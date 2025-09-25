import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type ScriptGroupStatus = 'active' | 'inactive';

export interface ScriptGroup {
  _id?: string;
  name: string;
  description?: string;
  pageId: any; // populated object or string id
  productGroupId: any; // populated object or string id
  status: ScriptGroupStatus;
  priority?: number;
  aiEnabled?: boolean;
  createdBy?: any;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class ScriptGroupsService {
  private readonly baseUrl = 'http://localhost:3000/script-groups';
  constructor(private http: HttpClient) {}

  getAll(): Observable<ScriptGroup[]> { return this.http.get<ScriptGroup[]>(this.baseUrl); }
  getById(id: string): Observable<ScriptGroup> { return this.http.get<ScriptGroup>(`${this.baseUrl}/${id}`); }
  create(dto: Partial<ScriptGroup>): Observable<ScriptGroup> { return this.http.post<ScriptGroup>(this.baseUrl, dto); }
  update(id: string, dto: Partial<ScriptGroup>): Observable<ScriptGroup> { return this.http.patch<ScriptGroup>(`${this.baseUrl}/${id}`, dto); }
  delete(id: string): Observable<void> { return this.http.delete<void>(`${this.baseUrl}/${id}`); }
}
