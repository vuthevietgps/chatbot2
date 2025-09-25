import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type FanpageStatus = 'active' | 'expired' | 'removed';

export interface Fanpage {
  _id?: string;
  pageId: string;
  pageName: string;
  accessToken: string;
  status: FanpageStatus;
  connectedAt: string; // ISO string
  lastRefreshed?: string;
  connectedBy?: string; // user id
  categories?: string[];
  avatarUrl?: string;
  subscriberCount?: number;
  defaultScriptGroupId?: string;
  defaultProductGroupId?: string;
  webhookSubscribed?: boolean;
  messageQuota?: number;
  messagesSentThisMonth?: number;
  aiEnabled?: boolean;
  timeZone?: string;
}

@Injectable({ providedIn: 'root' })
export class FanpagesService {
  private readonly baseUrl = 'http://localhost:3000/fanpages';
  constructor(private http: HttpClient) {}

  getAll(): Observable<Fanpage[]> {
    return this.http.get<Fanpage[]>(this.baseUrl);
  }
  getById(id: string): Observable<Fanpage> {
    return this.http.get<Fanpage>(`${this.baseUrl}/${id}`);
  }
  create(dto: Fanpage): Observable<Fanpage> {
    return this.http.post<Fanpage>(this.baseUrl, dto);
  }
  update(id: string, dto: Partial<Fanpage>): Observable<Fanpage> {
    return this.http.patch<Fanpage>(`${this.baseUrl}/${id}`, dto);
  }
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  // API & Token management
  subscribe(pageId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/${pageId}/subscribe`, {});
  }
  unsubscribe(pageId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${pageId}/unsubscribe`);
  }
  checkToken(pageId: string): Observable<{ pageId: string; status: string; checkedAt: string }> {
    return this.http.get<{ pageId: string; status: string; checkedAt: string }>(`${this.baseUrl}/${pageId}/check-token`);
  }
  refreshToken(pageId: string, newAccessToken: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/${pageId}/refresh-token`, { newAccessToken });
  }
}
