import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export interface PresenceUpdate {
  username: string;
  status: 'Online' | 'Offline' | 'Away';
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private socket!: WebSocket;
  private messageSubject: Subject<any> = new Subject<any>();
  private presenceSubject: Subject<PresenceUpdate> = new Subject<PresenceUpdate>();

  constructor() {
    this.connect();
    this.startPresenceSimulation();
  }

  private connect(): void {
    this.socket = new WebSocket('wss://echo.websocket.org');

    this.socket.onmessage = (event) => {
      try {
        // Try parsing JSON payloads directly if transmitted as structured tracking file items
        const data = JSON.parse(event.data);
        this.messageSubject.next(data);
      } catch (e) {
        this.messageSubject.next(event.data);
      }
    };

    this.socket.onclose = () => {
      setTimeout(() => this.connect(), 3000);
    };
  }

  getMessages(): Observable<any> {
    return this.messageSubject.asObservable();
  }

  getPresenceUpdates(): Observable<PresenceUpdate> {
    return this.presenceSubject.asObservable();
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

  /**
   * New Week 5 File Processing Method: Converts file stream buffers 
   * into local secure object links to enable seamless inline media rendering.
   */
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