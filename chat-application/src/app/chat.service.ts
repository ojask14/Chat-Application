import { Injectable } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';

export interface PresenceUpdate {
  username: string;
  status: 'Online' | 'Offline' | 'Away';
}

export interface MessagePayload {
  text?: string;
  sender: 'Ojas' | 'Vineet' | 'Me';
  chatWith: 'Ojas' | 'Vineet';
  fileData?: {
    name: string;
    url: string;
    type: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private socket!: WebSocket;
  private presenceSubject: Subject<PresenceUpdate> = new Subject<PresenceUpdate>();

  // --- Week 7 Centralized RxJS State Store Management Cache ---
  private messagesState: MessagePayload[] = [];
  private messagesSubject: BehaviorSubject<MessagePayload[]> = new BehaviorSubject<MessagePayload[]>([]);

  constructor() {
    this.connect();
    this.startPresenceSimulation();
  }

  private connect(): void {
    this.socket = new WebSocket('wss://echo.websocket.org');

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleIncomingMessageStream(data);
      } catch (e) {
        this.handleIncomingMessageStream(event.data);
      }
    };

    this.socket.onclose = () => {
      setTimeout(() => this.connect(), 3000);
    };
  }

  // Pure State Store Mutator: Appends and pushes new state data downstream
  private handleIncomingMessageStream(rawMsg: any): void {
    if (typeof rawMsg === 'string' && rawMsg.includes('Request served by')) return;
    if (rawMsg?.text && rawMsg.text.includes('Request served by')) return;

    let extractedText = typeof rawMsg === 'string' ? rawMsg : rawMsg?.text || JSON.stringify(rawMsg);
    let attachedFile = rawMsg && typeof rawMsg === 'object' && rawMsg.fileData ? rawMsg.fileData : undefined;

    try {
      const parsed = JSON.parse(extractedText);
      if (parsed && parsed.text) {
        extractedText = parsed.text;
        if (parsed.fileData) attachedFile = parsed.fileData;
      }
    } catch (e) {}

    // Determine target history frame index mapping via active connection state parameters
    // Reading previous window contexts dynamically to route peer cross-transfers accurately
    const mockWindowMapping = this.messagesState.length > 0 ? this.messagesState[this.messagesState.length - 1].chatWith : 'Ojas';
    
    const incomingPayload: MessagePayload = {
      text: attachedFile ? undefined : extractedText,
      sender: mockWindowMapping, 
      chatWith: mockWindowMapping === 'Ojas' ? 'Vineet' : 'Ojas',
      fileData: attachedFile
    };

    this.updateMessagesState(incomingPayload);
  }

  // Exposes state storage array as a read-only stream to prevent components from mutating data directly
  getMessagesStateStream(): Observable<MessagePayload[]> {
    return this.messagesSubject.asObservable();
  }

  getPresenceUpdates(): Observable<PresenceUpdate> {
    return this.presenceSubject.asObservable();
  }

  // Updates central store internal record matrix
  updateMessagesState(newRecord: MessagePayload): void {
    this.messagesState = [...this.messagesState, newRecord];
    this.messagesSubject.next(this.messagesState); // Emit optimized clone references
  }

  sendMessage(messageObj: any): void {
    if (this.socket.readyState === WebSocket.OPEN) {
      if (typeof messageObj === 'object') {
        this.socket.send(JSON.stringify(messageObj));
      } else {
        this.socket.send(messageObj);
      }
    }
  }

  uploadFile(file: File): Promise<string> {
    return new Promise((resolve) => {
      const localUrl = URL.createObjectURL(file);
      resolve(localUrl);
    });
  }

  private startPresenceSimulation(): void {
    const users = ['Ojas', 'Vineet'];
    const statuses: ('Online' | 'Offline' | 'Away')[] = ['Online', 'Offline', 'Away'];

    setInterval(() => {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      
      this.presenceSubject.next({
        username: randomUser,
        status: randomStatus
      });
    }, 6000);
  }
}