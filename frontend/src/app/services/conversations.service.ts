import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Conversation {
  _id?: string;
  id: string;
  pageId: string;
  psid: string;
  customerId?: string;
  status: 'active' | 'closed' | 'pending';
  lastMessage: string;
  lastUpdated: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateConversationStatusDto {
  status: 'active' | 'closed' | 'pending';
}

@Injectable({ providedIn: 'root' })
export class ConversationsService {
  private readonly baseUrl = 'http://localhost:3000/conversations';
  constructor(private http: HttpClient) {}

  getAll(): Observable<Conversation[]> {
    return this.http.get<Conversation[]>(this.baseUrl);
  }

  getById(id: string): Observable<Conversation> {
    return this.http.get<Conversation>(`${this.baseUrl}/${id}`);
  }

  getByPageIdAndPsid(pageId: string, psid: string): Observable<Conversation> {
    return this.http.get<Conversation>(`${this.baseUrl}/by-page-psid/${pageId}/${psid}`);
  }

  updateStatus(id: string, status: 'active' | 'closed' | 'pending'): Observable<Conversation> {
    return this.http.patch<Conversation>(`${this.baseUrl}/${id}/status`, { status });
  }

  create(dto: Conversation): Observable<Conversation> {
    return this.http.post<Conversation>(this.baseUrl, dto);
  }

  update(id: string, dto: Partial<Conversation>): Observable<Conversation> {
    return this.http.patch<Conversation>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}