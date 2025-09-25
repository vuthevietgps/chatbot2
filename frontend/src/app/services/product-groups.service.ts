import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export enum ProductGroupStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}

export interface ProductGroup {
  _id?: string;
  name: string;
  description?: string;
  color: string; // hex
  status: ProductGroupStatus;
  parentGroupId?: string;
  deletedAt?: Date | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface ProductGroupQuery {
  search?: string;
  status?: ProductGroupStatus;
  page?: number;
  limit?: number;
  includeDeleted?: boolean;
}

export interface ProductGroupResponse {
  data: ProductGroup[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ProductGroupStats {
  total: number;
  active: number;
  inactive: number;
  withProducts: number;
}

@Injectable({ providedIn: 'root' })
export class ProductGroupsService {
  private readonly baseUrl = 'http://localhost:3000/product-groups';

  constructor(private http: HttpClient) {}

  getAll(query?: ProductGroupQuery): Observable<ProductGroupResponse> {
    let params = new HttpParams();
    
    if (query) {
      if (query.search) params = params.set('search', query.search);
      if (query.status) params = params.set('status', query.status);
      if (query.page) params = params.set('page', query.page.toString());
      if (query.limit) params = params.set('limit', query.limit.toString());
      if (query.includeDeleted) params = params.set('includeDeleted', query.includeDeleted.toString());
    }
    
    return this.http.get<ProductGroupResponse>(this.baseUrl, { params });
  }

  // For backward compatibility with existing components
  getAllSimple(): Observable<ProductGroup[]> {
    const params = new HttpParams().set('limit', '1000');
    return this.http.get<ProductGroupResponse>(this.baseUrl, { params }).pipe(
      map(response => response.data)
    );
  }

  getById(id: string): Observable<ProductGroup> {
    return this.http.get<ProductGroup>(`${this.baseUrl}/${id}`);
  }

  getProducts(groupId: string, page?: number, limit?: number): Observable<any> {
    let params = new HttpParams();
    if (page) params = params.set('page', page.toString());
    if (limit) params = params.set('limit', limit.toString());
    
    return this.http.get(`${this.baseUrl}/${groupId}/products`, { params });
  }

  create(dto: Partial<ProductGroup>): Observable<ProductGroup> {
    return this.http.post<ProductGroup>(this.baseUrl, dto);
  }

  update(id: string, dto: Partial<ProductGroup>): Observable<ProductGroup> {
    return this.http.patch<ProductGroup>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  // Get active groups for dropdowns
  getActiveGroups(): Observable<ProductGroup[]> {
    const params = new HttpParams()
      .set('status', ProductGroupStatus.ACTIVE)
      .set('limit', '1000');
    
    return this.http.get<ProductGroupResponse>(this.baseUrl, { params }).pipe(
      map((response: ProductGroupResponse) => response.data)
    );
  }

  // Get statistics
  getStats(): Observable<ProductGroupStats> {
    // This would be implemented as a separate endpoint in real app
    // For now, calculate from getAll response
    return this.getAll({ limit: 1000 }).pipe(
      map((response: ProductGroupResponse) => ({
        total: response.total,
        active: response.data.filter(g => g.status === ProductGroupStatus.ACTIVE).length,
        inactive: response.data.filter(g => g.status === ProductGroupStatus.INACTIVE).length,
        withProducts: 0 // TODO: Implement when product integration is ready
      }))
    );
  }
}
