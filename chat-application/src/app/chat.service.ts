import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private socket!: WebSocket;
  private messageSubject: Subject<any> = new Subject<any>();

  constructor() {
    this.connect();
  }

  private connect(): void {
    // Using a reliable, free public echo server for real-time testing simulation
    this.socket = new WebSocket('wss://echo.websocket.org');

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.messageSubject.next(data);
      } catch (e) {
        // Fallback if data isn't JSON strings
        this.messageSubject.next({ text: event.data, sender: 'Ojas', time: new Date() });
      }
    };

    this.socket.onclose = (event) => {
      console.log('WebSocket closed. Reconnecting...');
      setTimeout(() => this.connect(), 3000); // Auto-reconnect safety
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket Error: ', error);
    };
  }

  // Method to stream incoming messages to the component
  getMessages(): Observable<any> {
    return this.messageSubject.asObservable();
  }

  // Method to push a message across the WebSocket channel
  sendMessage(messageObj: { text: string; sender: string; time: Date }): void {
    if (this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(messageObj));
    } else {
      console.error('WebSocket connection is not open.');
    }
  }
}