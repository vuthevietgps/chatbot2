import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export enum CustomerStatus {
  NEW = 'new',
  POTENTIAL = 'potential',
  VIP = 'vip',
  INACTIVE = 'inactive',
  BLOCKED = 'blocked'
}

export interface Customer {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  facebookId?: string;
  fanpageId?: string;
  tags: string[];
  notes?: string;
  status: CustomerStatus;
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerQuery {
  search?: string;
  status?: CustomerStatus;
  tag?: string;
  fanpageId?: string;
  page?: number;
  limit?: number;
  includeDeleted?: boolean;
}

export interface CustomerResponse {
  customers: Customer[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CustomerStats {
  total: number;
  new: number;
  potential: number;
  vip: number;
  inactive: number;
  blocked: number;
}

export interface Conversation {
  _id: string;
  customerId: string;
  fanpageId: string;
  messages: Array<{
    _id: string;
    sender: 'user' | 'page';
    text: string;
    timestamp: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationResponse {
  conversations: Conversation[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class CustomersService {
  private baseUrl = `${environment.apiUrl}/customers`;

  constructor(private http: HttpClient) {}

  // Get all customers with filtering and pagination
  getCustomers(query: CustomerQuery = {}): Observable<CustomerResponse> {
    let params = new HttpParams();
    
    if (query.search) params = params.set('search', query.search);
    if (query.status) params = params.set('status', query.status);
    if (query.tag) params = params.set('tag', query.tag);
    if (query.fanpageId) params = params.set('fanpageId', query.fanpageId);
    if (query.page) params = params.set('page', query.page.toString());
    if (query.limit) params = params.set('limit', query.limit.toString());
    if (query.includeDeleted) params = params.set('includeDeleted', query.includeDeleted.toString());

    return this.http.get<CustomerResponse>(this.baseUrl, { params });
  }

  // Get customer by ID
  getCustomer(id: string): Observable<Customer> {
    return this.http.get<Customer>(`${this.baseUrl}/${id}`);
  }

  // Create new customer
  createCustomer(customerData: Partial<Customer>): Observable<Customer> {
    return this.http.post<Customer>(this.baseUrl, customerData);
  }

  // Update customer
  updateCustomer(id: string, customerData: Partial<Customer>): Observable<Customer> {
    return this.http.patch<Customer>(`${this.baseUrl}/${id}`, customerData);
  }

  // Delete customer (soft delete)
  deleteCustomer(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  // Get customer statistics
  getStatistics(): Observable<CustomerStats> {
    return this.http.get<CustomerStats>(`${this.baseUrl}/statistics`);
  }

  // Get available tags
  getTags(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/tags`);
  }

  // Get customer conversations
  getConversations(customerId: string, page?: number, limit?: number): Observable<ConversationResponse> {
    let params = new HttpParams();
    if (page) params = params.set('page', page.toString());
    if (limit) params = params.set('limit', limit.toString());

    return this.http.get<ConversationResponse>(`${this.baseUrl}/${customerId}/conversations`, { params });
  }
}