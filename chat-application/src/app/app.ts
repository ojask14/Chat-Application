import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ChatService, PresenceUpdate } from './chat.service';

interface Message {
  text?: string;
  sender: 'Ojas' | 'Vineet' | 'Me';
  chatWith: 'Ojas' | 'Vineet';
  fileData?: {
    name: string;
    url: string;
    type: string;
  };
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
    // 1. Process incoming WebSocket text streams and simulated file echo shares
    this.chatService.getMessages().subscribe((rawMsg: any) => {
      if (typeof rawMsg === 'string' && rawMsg.includes('Request served by')) return;
      
      let incomingMsg: Message;

      // Handle file structures vs text lines sent across the service pipeline
      if (rawMsg && typeof rawMsg === 'object' && rawMsg.fileData) {
        incomingMsg = {
          sender: this.selectedUser,
          chatWith: this.selectedUser === 'Ojas' ? 'Vineet' : 'Ojas', // True cross-routing to opposite user
          fileData: rawMsg.fileData
        };
      } else {
        let extractedText = typeof rawMsg === 'string' ? rawMsg : rawMsg?.text || JSON.stringify(rawMsg);
        try {
          const parsed = JSON.parse(extractedText);
          if (parsed && parsed.text) extractedText = parsed.text;
        } catch (e) {}

        incomingMsg = {
          text: extractedText,
          sender: this.selectedUser, 
          chatWith: this.selectedUser === 'Ojas' ? 'Vineet' : 'Ojas'
        };
      }

      this.messages = [...this.messages, incomingMsg];
    });

    // 2. Presence tracking logic integration
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

    const outboundPayload: Message = {
      text: this.newMessage,
      sender: 'Me',
      chatWith: this.selectedUser
    };

    this.messages = [...this.messages, outboundPayload];
    this.chatService.sendMessage(this.newMessage);
    this.newMessage = '';
  }

  // Processes local files uploaded by clicking the attachment icon
  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (!file) return;

    // Use our Angular service utility helper to format data cleanly
    this.chatService.uploadFile(file).then((fileUrl: string) => {
      const filePayload: Message = {
        sender: 'Me',
        chatWith: this.selectedUser,
        fileData: {
          name: file.name,
          url: fileUrl,
          type: file.type
        }
      };

      // Push file content box dynamically into history stack
      this.messages = [...this.messages, filePayload];
      
      // Simulate transmitting the shared attachment via socket channel
      this.chatService.sendMessage(filePayload);
    });
  }
}