import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Message {
  _id?: string;
  id: string;
  conversationId: string;
  pageId: string;
  psid: string;
  direction: 'in' | 'out';
  senderType: 'customer' | 'bot' | 'agent';
  text: string;
  attachments: any[];
  fbMessageId?: string;
  processedBy?: 'script' | 'ai' | 'agent' | 'none';
  status: 'received' | 'processed' | 'sent' | 'error';
  createdAt: string;
}

export interface SendMessageDto {
  text: string;
  attachments?: any[];
}

export interface SendMessageResult {
  success: boolean;
  fbMessageId?: string;
  message: Message;
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class MessagesService {
  private readonly baseUrl = 'http://localhost:3000/messages';
  private readonly conversationsUrl = 'http://localhost:3000/conversations';
  
  constructor(private http: HttpClient) {}

  getAll(): Observable<Message[]> {
    return this.http.get<Message[]>(this.baseUrl);
  }

  getById(id: string): Observable<Message> {
    return this.http.get<Message>(`${this.baseUrl}/${id}`);
  }

  getByConversationId(conversationId: string): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.baseUrl}/by-conversation/${conversationId}`);
  }

  sendMessage(conversationId: string, dto: SendMessageDto): Observable<SendMessageResult> {
    return this.http.post<SendMessageResult>(`${this.conversationsUrl}/${conversationId}/messages`, dto);
  }

  create(dto: Message): Observable<Message> {
    return this.http.post<Message>(this.baseUrl, dto);
  }

  update(id: string, dto: Partial<Message>): Observable<Message> {
    return this.http.patch<Message>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}