import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ChatService, PresenceUpdate, MessagePayload } from './chat.service';
import { Subscription } from 'rxjs';

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
export class AppComponent implements OnInit, OnDestroy {
  title = 'chat-application';
  newMessage: string = '';
  selectedUser: 'Ojas' | 'Vineet' = 'Ojas'; 
  
  // Local presentation reference pointer
  messages: MessagePayload[] = [];
  private stateSubscription!: Subscription;

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
    this.checkRouteProtection();

    // --- Week 7 RxJS Optimization Stream Subscriptions ---
    this.stateSubscription = this.chatService.getMessagesStateStream().subscribe((updatedLog: MessagePayload[]) => {
      this.messages = updatedLog; // O(1) instant pointer reference assignment avoids re-render loops
    });

    this.chatService.getPresenceUpdates().subscribe((update: PresenceUpdate) => {
      const nameMatch = update.username.toLowerCase();
      if (nameMatch === 'ojas') {
        this.userRoster[0].status = update.status;
      } else if (nameMatch === 'vineet') {
        this.userRoster[1].status = update.status;
      }
    });
  }

  ngOnDestroy(): void {
    // Prevent memory leaks on application teardown
    if (this.stateSubscription) {
      this.stateSubscription.unsubscribe();
    }
  }

  checkRouteProtection(): void {
    const token = localStorage.getItem('mock_jwt_token');
    this.isAuthenticated = !!token;
  }

  onLogin(): void {
    if (!this.authUsername.trim() || !this.authPassword.trim()) return;
    localStorage.setItem('mock_jwt_token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mockPayloadDataSignature');
    this.isAuthenticated = true;
    this.authUsername = '';
    this.authPassword = '';
  }

  onRegister(): void {
    if (!this.authUsername.trim() || !this.authPassword.trim() || !this.authEmail.trim()) return;
    this.isRegisterView = false;
    alert('Registration successful! Please login with your credentials.');
  }

  onLogout(): void {
    localStorage.removeItem('mock_jwt_token');
    this.isAuthenticated = false;
  }

  toggleAuthView(): void {
    this.isRegisterView = !this.isRegisterView;
    this.authUsername = '';
    this.authPassword = '';
    this.authEmail = '';
  }

  selectUser(username: 'Ojas' | 'Vineet'): void {
    this.selectedUser = username;
  }

  onSendMessage(): void {
    if (!this.newMessage.trim()) return;

    const outboundPayload: MessagePayload = {
      text: this.newMessage,
      sender: 'Me',
      chatWith: this.selectedUser
    };

    // Commit change directly to central service repository state
    this.chatService.updateMessagesState(outboundPayload);
    this.chatService.sendMessage(this.newMessage);
    this.newMessage = '';
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (!file) return;

    this.chatService.uploadFile(file).then((fileUrl: string) => {
      const filePayload: MessagePayload = {
        sender: 'Me',
        chatWith: this.selectedUser,
        fileData: {
          name: file.name,
          url: fileUrl,
          type: file.type
        }
      };

      this.chatService.updateMessagesState(filePayload);
      this.chatService.sendMessage(filePayload);
    });
  }
}