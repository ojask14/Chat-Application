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
  
  // --- Week 6 Authentication States ---
  isAuthenticated: boolean = false;
  isRegisterView: boolean = false;
  authUsername: string = '';
  authPassword: string = '';
  authEmail: string = '';

  userRoster: UserProfile[] = [
    { name: 'Ojas', status: 'Online' },
    { name: 'Vineet', status: 'Away' }
  ];

  constructor(private chatService: ChatService) {}

  ngOnInit(): void {
    // Check if user is already logged in via token storage simulation
    this.checkRouteProtection();

    // 1. Process incoming WebSocket streams
    this.chatService.getMessages().subscribe((rawMsg: any) => {
      if (typeof rawMsg === 'string' && rawMsg.includes('Request served by')) return;
      if (!this.isAuthenticated) return; // Prevent parsing messages if blocked by guard
      
      let incomingMsg: Message;

      if (rawMsg && typeof rawMsg === 'object' && rawMsg.fileData) {
        incomingMsg = {
          sender: this.selectedUser,
          chatWith: this.selectedUser === 'Ojas' ? 'Vineet' : 'Ojas', 
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

    // 2. Presence tracking logic
    this.chatService.getPresenceUpdates().subscribe((update: PresenceUpdate) => {
      const nameMatch = update.username.toLowerCase();
      if (nameMatch === 'ojas') {
        this.userRoster[0].status = update.status;
      } else if (nameMatch === 'vineet') {
        this.userRoster[1].status = update.status;
      }
    });
  }

  // --- Week 6 Authentication Router Guards ---
  checkRouteProtection(): void {
    const token = localStorage.getItem('mock_jwt_token');
    this.isAuthenticated = !!token;
  }

  onLogin(): void {
    if (!this.authUsername.trim() || !this.authPassword.trim()) return;
    
    // Simulate setting a verified JWT token signature payload on success
    localStorage.setItem('mock_jwt_token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mockPayloadDataSignature');
    this.isAuthenticated = true;
    
    // Reset inputs
    this.authUsername = '';
    this.authPassword = '';
  }

  onRegister(): void {
    if (!this.authUsername.trim() || !this.authPassword.trim() || !this.authEmail.trim()) return;
    // Toggle view back to login screen after simulated user creation
    this.isRegisterView = false;
    alert('Registration successful! Please login with your credentials.');
  }

  onLogout(): void {
    localStorage.removeItem('mock_jwt_token');
    this.isAuthenticated = false;
    this.messages = []; // Clear chat logs on security reset
  }

  toggleAuthView(): void {
    this.isRegisterView = !this.isRegisterView;
    this.authUsername = '';
    this.authPassword = '';
    this.authEmail = '';
  }

  // --- Existing Chat Methods ---
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

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (!file) return;

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

      this.messages = [...this.messages, filePayload];
      this.chatService.sendMessage(filePayload);
    });
  }
}