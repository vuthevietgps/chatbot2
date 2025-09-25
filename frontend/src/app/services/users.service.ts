import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CreateUserDto {
  fullName: string;
  email: string;
  phone: string;
  role: 'director' | 'manager' | 'employee';
  department?: string;
  position?: string;
  password?: string;
}

export interface UpdateUserDto extends Partial<CreateUserDto> {}

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly baseUrl = 'http://localhost:3000/users';

  constructor(private http: HttpClient) {}

  getUsers(role?: string): Observable<any[]> {
    const url = role ? `${this.baseUrl}?role=${role}` : this.baseUrl;
    return this.http.get<any[]>(url);
  }

  getStatistics(): Observable<{ total: number; active: number; inactive: number }> {
    return this.http.get<{ total: number; active: number; inactive: number }>(`${this.baseUrl}/statistics`);
  }

  createUser(dto: CreateUserDto): Observable<any> {
    return this.http.post<any>(this.baseUrl, dto);
  }

  updateUser(id: string, dto: UpdateUserDto): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/${id}`, dto);
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  toggleStatus(id: string): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/${id}/toggle-status`, {});
  }

  changePassword(id: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${id}/change-password`, { newPassword });
  }
}
