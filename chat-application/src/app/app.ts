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
  sender: 'Ojas' | 'Vineet' | 'Me';
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
      if (typeof rawMsg === 'string' && rawMsg.includes('Request served by')) return;
      if (rawMsg?.text && rawMsg.text.includes('Request served by')) return;

      let extractedText = typeof rawMsg === 'string' ? rawMsg : rawMsg?.text || JSON.stringify(rawMsg);

      try {
        const parsed = JSON.parse(extractedText);
        if (parsed && parsed.text) extractedText = parsed.text;
      } catch (e) {}

      /**
       * TRUE REAL-TIME CROSS ROUTING:
       * If I am currently looking at Ojas's box and type a message, I am acting as "Me" sending to Ojas.
       * Therefore, when the message goes through the network, it should appear in VINEET'S chat history 
       * as an incoming message from OJAS!
       */
      const currentSender = this.selectedUser; 
      const destinationWindow = this.selectedUser === 'Ojas' ? 'Vineet' : 'Ojas';

      const crossRoutedMessage: Message = {
        text: extractedText,
        sender: currentSender,      // Shows up labeled as the person who actually typed it
        chatWith: destinationWindow // Appends directly into the opposite person's history panel!
      };

      this.messages = [...this.messages, crossRoutedMessage];
    });

    // 2. Direct live roster status updates mapping
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

    // Local Outgoing Blue Message Bubble (Saved locally as my sent history for the open tab)
    const outboundPayload: Message = {
      text: this.newMessage,
      sender: 'Me',
      chatWith: this.selectedUser
    };

    this.messages = [...this.messages, outboundPayload];
    
    // Transmit message through WebSocket to simulate live delivery network
    this.chatService.sendMessage(this.newMessage);
    
    this.newMessage = '';
  }
}