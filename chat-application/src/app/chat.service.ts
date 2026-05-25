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
      this.messageSubject.next(event.data);
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

  sendMessage(plainText: string): void {
    if (this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(plainText); // Send clean, non-nested string lines
    }
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
    }, 6000); // Transitions status state tags clearly every 6 seconds
  }
}