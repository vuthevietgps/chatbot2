import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Message, MessagesService, SendMessageDto } from '../../services/messages.service';
import { Conversation, ConversationsService } from '../../services/conversations.service';

@Component({
  selector: 'app-messages',
  template: `
    <div class="messages-container">
      <div class="content-header">
        <h2>Chi tiết hội thoại</h2>
        <div class="conversation-info" *ngIf="conversation">
          <span><strong>Fanpage:</strong> {{ conversation.pageId }}</span>
          <span><strong>Khách:</strong> {{ conversation.psid }}</span>
          <div class="status-controls">
            <span><strong>Trạng thái:</strong></span>
            <mat-select 
              [value]="conversation.status" 
              (selectionChange)="changeStatus($event.value)"
              class="status-select"
            >
              <mat-option value="active">Đang hoạt động</mat-option>
              <mat-option value="pending">Chờ xử lý</mat-option>
              <mat-option value="closed">Đã đóng</mat-option>
            </mat-select>
          </div>
        </div>
      </div>

      <mat-card class="chat-card">
        <mat-card-content>
          <div class="messages-list" #messagesContainer>
            <div 
              *ngFor="let msg of messages; trackBy: trackMessage"
              class="message-item"
              [ngClass]="{
                'message-in': msg.direction === 'in',
                'message-out': msg.direction === 'out'
              }"
            >
              <div class="message-bubble">
                <div class="message-header">
                  <span class="sender-type">{{ getSenderTypeLabel(msg.senderType) }}</span>
                  <span class="message-time">{{ msg.createdAt | date:'short' }}</span>
                  <span class="message-status" *ngIf="msg.status">
                    <mat-icon 
                      [color]="getStatusColor(msg.status)"
                      [matTooltip]="getStatusLabel(msg.status)"
                    >
                      {{ getStatusIcon(msg.status) }}
                    </mat-icon>
                  </span>
                </div>
                <div class="message-text">{{ msg.text }}</div>
                <div class="message-attachments" *ngIf="msg.attachments && msg.attachments.length > 0">
                  <mat-chip-set>
                    <mat-chip *ngFor="let att of msg.attachments">
                      <mat-icon>attachment</mat-icon>
                      Attachment
                    </mat-chip>
                  </mat-chip-set>
                </div>
              </div>
            </div>
          </div>
          
          <div class="no-messages" *ngIf="messages.length === 0">
            <mat-icon>chat_bubble_outline</mat-icon>
            <p>Chưa có tin nhắn nào</p>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Message Input Form -->
      <mat-card class="message-input-card" *ngIf="conversation?.status === 'active'">
        <mat-card-content>
          <form [formGroup]="messageForm" (ngSubmit)="sendMessage()" class="message-form">
            <mat-form-field appearance="outline" class="message-input">
              <mat-label>Nhập tin nhắn...</mat-label>
              <textarea 
                matInput 
                formControlName="text"
                placeholder="Nhập tin nhắn để gửi cho khách hàng"
                rows="2"
                (keydown.enter)="onEnterPress($event)"
              ></textarea>
              <mat-error *ngIf="messageForm.get('text')?.hasError('required')">
                Vui lòng nhập nội dung tin nhắn
              </mat-error>
              <mat-error *ngIf="messageForm.get('text')?.hasError('minlength')">
                Tin nhắn phải có ít nhất 1 ký tự
              </mat-error>
            </mat-form-field>
            <div class="form-actions">
              <button 
                mat-raised-button 
                color="primary" 
                type="submit"
                [disabled]="messageForm.invalid || sending"
              >
                <mat-icon *ngIf="!sending">send</mat-icon>
                <mat-spinner *ngIf="sending" diameter="16"></mat-spinner>
                {{ sending ? 'Đang gửi...' : 'Gửi' }}
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>

      <div class="conversation-closed-notice" *ngIf="conversation?.status === 'closed'">
        <mat-icon>info</mat-icon>
        <span>Hội thoại đã được đóng. Không thể gửi tin nhắn mới.</span>
      </div>

      <div class="actions-bar">
        <button mat-stroked-button routerLink="/conversations">
          <mat-icon>arrow_back</mat-icon>
          Quay lại danh sách
        </button>
        <button mat-stroked-button color="primary" (click)="reload()">
          <mat-icon>refresh</mat-icon>
          Tải lại
        </button>
      </div>
    </div>
  `,
  styles: [`
    .messages-container {
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    
    .conversation-info {
      display: flex;
      gap: 20px;
      align-items: center;
      margin-top: 8px;
      font-size: 0.9em;
      color: #666;
    }
    
    .status-controls {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .status-select {
      width: 150px;
      font-size: 0.9em;
    }
    
    .chat-card {
      flex: 1;
      margin: 16px 0;
      max-height: calc(100vh - 400px);
    }
    
    .messages-list {
      max-height: 400px;
      overflow-y: auto;
      padding: 16px;
    }
    
    .message-item {
      margin-bottom: 16px;
      display: flex;
    }
    
    .message-in {
      justify-content: flex-start;
    }
    
    .message-out {
      justify-content: flex-end;
    }
    
    .message-bubble {
      max-width: 70%;
      padding: 12px;
      border-radius: 12px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    }
    
    .message-in .message-bubble {
      background-color: #f5f5f5;
      border-bottom-left-radius: 4px;
    }
    
    .message-out .message-bubble {
      background-color: #e3f2fd;
      border-bottom-right-radius: 4px;
    }
    
    .message-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
      font-size: 0.8em;
      color: #666;
    }
    
    .sender-type {
      font-weight: 500;
    }
    
    .message-status {
      margin-left: 8px;
    }
    
    .message-text {
      word-wrap: break-word;
      white-space: pre-wrap;
    }
    
    .message-attachments {
      margin-top: 8px;
    }
    
    .message-input-card {
      margin-bottom: 16px;
    }
    
    .message-form {
      display: flex;
      gap: 16px;
      align-items: flex-end;
    }
    
    .message-input {
      flex: 1;
    }
    
    .form-actions {
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
    }
    
    .conversation-closed-notice {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background-color: #fff3cd;
      color: #856404;
      border-radius: 4px;
      margin-bottom: 16px;
    }
    
    .no-messages {
      text-align: center;
      padding: 40px;
      color: #999;
    }
    
    .no-messages mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
    }
    
    .actions-bar {
      display: flex;
      gap: 12px;
      justify-content: flex-start;
    }
  `]
})
export class MessagesComponent implements OnInit {
  conversationId: string = '';
  conversation: Conversation | null = null;
  messages: Message[] = [];
  messageForm: FormGroup;
  sending: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private messagesService: MessagesService,
    private conversationsService: ConversationsService,
    private snackBar: MatSnackBar,
    private fb: FormBuilder
  ) {
    this.messageForm = this.fb.group({
      text: ['', [Validators.required, Validators.minLength(1)]]
    });
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.conversationId = params['id'];
      if (this.conversationId) {
        this.loadConversation();
        this.loadMessages();
      }
    });
  }

  loadConversation() {
    this.conversationsService.getById(this.conversationId).subscribe({
      next: conv => this.conversation = conv,
      error: () => this.show('Không thể tải thông tin hội thoại')
    });
  }

  loadMessages() {
    this.messagesService.getByConversationId(this.conversationId).subscribe({
      next: messages => {
        this.messages = messages;
        setTimeout(() => this.scrollToBottom(), 100);
      },
      error: () => this.show('Không thể tải tin nhắn')
    });
  }

  sendMessage() {
    if (this.messageForm.invalid || this.sending || !this.conversationId) {
      return;
    }

    this.sending = true;
    const dto: SendMessageDto = {
      text: this.messageForm.get('text')?.value.trim()
    };

    this.messagesService.sendMessage(this.conversationId, dto).subscribe({
      next: result => {
        this.sending = false;
        if (result.success) {
          this.messageForm.reset();
          this.loadMessages(); // Reload to show the new message
          this.loadConversation(); // Update conversation info
          this.show('Tin nhắn đã được gửi thành công');
        } else {
          this.show(`Lỗi gửi tin nhắn: ${result.error || 'Không xác định'}`);
        }
      },
      error: err => {
        this.sending = false;
        this.show(`Không thể gửi tin nhắn: ${err.message || 'Lỗi server'}`);
      }
    });
  }

  changeStatus(newStatus: 'active' | 'closed' | 'pending') {
    if (!this.conversation || this.conversation.status === newStatus) {
      return;
    }

    this.conversationsService.updateStatus(this.conversation.id, newStatus).subscribe({
      next: updatedConversation => {
        this.conversation = updatedConversation;
        this.show(`Đã cập nhật trạng thái thành: ${this.getConversationStatusLabel(newStatus)}`);
      },
      error: err => {
        this.show(`Không thể cập nhật trạng thái: ${err.message || 'Lỗi server'}`);
      }
    });
  }

  onEnterPress(event: Event) {
    const e = event as KeyboardEvent;
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.sendMessage();
    }
  }

  reload() {
    this.loadConversation();
    this.loadMessages();
  }

  getSenderTypeLabel(senderType: string): string {
    switch (senderType) {
      case 'customer': return 'Khách hàng';
      case 'bot': return 'Bot';
      case 'agent': return 'Tư vấn viên';
      default: return senderType;
    }
  }

  getConversationStatusLabel(status: string): string {
    switch (status) {
      case 'active': return 'Đang hoạt động';
      case 'pending': return 'Chờ xử lý';
      case 'closed': return 'Đã đóng';
      default: return status;
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'received': return 'Đã nhận';
      case 'processed': return 'Đã xử lý';
      case 'sent': return 'Đã gửi';
      case 'error': return 'Lỗi';
      default: return status;
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'received': return 'check_circle';
      case 'processed': return 'schedule';
      case 'sent': return 'done_all';
      case 'error': return 'error';
      default: return 'help';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'received': return 'primary';
      case 'processed': return 'accent';
      case 'sent': return 'primary';
      case 'error': return 'warn';
      default: return '';
    }
  }

  trackMessage(index: number, message: Message): string {
    return message.id;
  }

  private scrollToBottom() {
    const container = document.querySelector('.messages-list');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }

  private show(msg: string) {
    this.snackBar.open(msg, 'Đóng', { duration: 2500, verticalPosition: 'top' });
  }
}