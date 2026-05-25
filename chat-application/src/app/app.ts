import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { ChatService } from './chat.service';

interface Message {
  text: string;
  sender: string;
  chatWith: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatSidenavModule,
    MatListModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent implements OnInit {
  title = 'chat-application';
  newMessage: string = '';
  selectedUser: string = 'Ojas'; 

  messages: Message[] = [
    { text: 'Hey there! Welcome to the chat system workspace.', sender: 'Ojas', chatWith: 'Ojas' },
    { text: 'hello', sender: 'Vineet', chatWith: 'Vineet' }
  ];

  constructor(private chatService: ChatService) {}

  ngOnInit(): void {
    this.chatService.getMessages().subscribe((msg: any) => {
      if (msg.text && msg.text.includes('Request served by')) {
        return; 
      }
      const txtContent = msg.text || (typeof msg === 'string' ? msg : JSON.stringify(msg));
      this.messages.push({
        text: txtContent,
        sender: this.selectedUser,
        chatWith: this.selectedUser
      });
    });
  }

  selectUser(username: string): void {
    this.selectedUser = username;
  }

  get filteredMessages(): Message[] {
    return this.messages.filter(m => m.chatWith === this.selectedUser);
  }

  onSendMessage(): void {
    if (!this.newMessage.trim()) return;

    this.messages.push({
      text: this.newMessage,
      sender: 'Me',
      chatWith: this.selectedUser
    });
    
    this.chatService.sendMessage({ text: this.newMessage, sender: 'Me', time: new Date() });
    this.newMessage = '';
  }
}