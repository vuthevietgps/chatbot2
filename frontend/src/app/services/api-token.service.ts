import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { Fanpage } from './fanpages.service';

@Injectable({ providedIn: 'root' })
export class ApiTokenService {
  private readonly baseUrl = 'http://localhost:3000/fanpages';
  constructor(private http: HttpClient) {}

  // Read-only list for API & Token management view
  listFanpages(): Observable<Fanpage[]> {
    return this.http.get<Fanpage[]>(this.baseUrl);
  }

  subscribe(pageId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/${pageId}/subscribe`, {});
  }
  unsubscribe(pageId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${pageId}/unsubscribe`);
  }
  checkToken(pageId: string): Observable<{ pageId: string; status: string; checkedAt: string }> {
    return this.http.get<{ pageId: string; status: string; checkedAt: string }>(`${this.baseUrl}/${pageId}/check-token`);
  }
  refreshToken(pageId: string, newAccessToken: string): Observable<{ lastRefreshed: string }> {
    return this.http.post<{ lastRefreshed: string }>(`${this.baseUrl}/${pageId}/refresh-token`, { newAccessToken });
  }
}
