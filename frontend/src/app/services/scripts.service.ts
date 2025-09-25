import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type ScriptStatus = 'active' | 'inactive';
export type ScriptAction = 'send_image' | 'show_product_list' | 'create_order';

export interface Script {
  _id?: string;
  id?: string; // uuid
  scriptGroupId: any; // string or populated object
  name: string;
  trigger: string[];
  responseTemplate: string;
  linkedProductId?: any;
  linkedProductGroupId?: any;
  priority?: number;
  status: ScriptStatus;
  contextRequirement?: string;
  aiAssist?: boolean;
  action?: ScriptAction;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class ScriptsService {
  private readonly baseUrl = 'http://localhost:3000/scripts';
  constructor(private http: HttpClient) {}

  getAll(): Observable<Script[]> { return this.http.get<Script[]>(this.baseUrl); }
  getById(id: string): Observable<Script> { return this.http.get<Script>(`${this.baseUrl}/${id}`); }
  create(dto: Partial<Script>): Observable<Script> { return this.http.post<Script>(this.baseUrl, dto); }
  update(id: string, dto: Partial<Script>): Observable<Script> { return this.http.patch<Script>(`${this.baseUrl}/${id}`, dto); }
  delete(id: string): Observable<void> { return this.http.delete<void>(`${this.baseUrl}/${id}`); }
}
