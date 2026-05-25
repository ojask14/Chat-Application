import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ChatService, PresenceUpdate } from './chat.service';

interface Message {
  text: string;
  sender: 'Me' | 'Them';
  chatWith: 'Ojas' | 'Vineet';
}

interface UserProfile {
  name: 'Ojas' | 'Vineet';
  status: 'Online' | 'Offline' | 'Away';
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent implements OnInit {
  title = 'chat-application';
  newMessage: string = '';
  selectedUser: 'Ojas' | 'Vineet' = 'Ojas'; 
  messages: Message[] = [];

  userRoster: UserProfile[] = [
    { name: 'Ojas', status: 'Online' },
    { name: 'Vineet', status: 'Away' }
  ];

  constructor(private chatService: ChatService) {}

  ngOnInit(): void {
    // 1. Process incoming WebSocket text stream
    this.chatService.getMessages().subscribe((rawMsg: any) => {
      // Filter out system cloud server load balancer text
      if (typeof rawMsg === 'string' && rawMsg.includes('Request served by')) return;
      if (rawMsg?.text && rawMsg.text.includes('Request served by')) return;

      // Extract the plain text string smoothly
      let extractedText = '';
      if (typeof rawMsg === 'string') {
        extractedText = rawMsg;
      } else if (rawMsg?.text) {
        extractedText = rawMsg.text;
      } else {
        extractedText = JSON.stringify(rawMsg);
      }

      // Safeguard: Extract message text if it was stringified as an object by previous logic versions
      try {
        const parsed = JSON.parse(extractedText);
        if (parsed && parsed.text) {
          extractedText = parsed.text;
        }
      } catch (e) {
        // Not a JSON string, use raw extracted text safely
      }

      // Live Destination Router: Force the echoed string to appear as an incoming reply block
      const incomingReply: Message = {
        text: extractedText,
        sender: 'Them', // Flags it as the other person replying to you
        chatWith: this.selectedUser // Loads explicitly into the view screen you are staring at
      };

      this.messages = [...this.messages, incomingReply];
    });

    // 2. Map user status updates directly without index risks
    this.chatService.getPresenceUpdates().subscribe((update: PresenceUpdate) => {
      const nameMatch = update.username.toLowerCase();
      if (nameMatch === 'ojas') {
        this.userRoster[0].status = update.status;
      } else if (nameMatch === 'vineet') {
        this.userRoster[1].status = update.status;
      }
    });
  }

  selectUser(username: 'Ojas' | 'Vineet'): void {
    this.selectedUser = username;
  }

  onSendMessage(): void {
    if (!this.newMessage.trim()) return;

    const currentActiveView = this.selectedUser;

    // Push local outgoing blue bubble immediately into the open window view
    const outboundPayload: Message = {
      text: this.newMessage,
      sender: 'Me',
      chatWith: currentActiveView
    };

    this.messages = [...this.messages, outboundPayload];
    
    // Transmit plain message string text straight across the WebSocket connection channel
    this.chatService.sendMessage(this.newMessage);
    
    this.newMessage = '';
  }
}