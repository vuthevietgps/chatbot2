import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export type ProductCurrency = 'VND' | 'USD';
export type ProductStatus = 'active' | 'inactive' | 'out_of_stock';

export interface ProductVariant {
  attribute: string;
  value: string;
  extraPrice?: number;
}

export interface Product {
  _id?: string;
  name: string;
  sku: string;
  groupId: string; // ObjectId or populated object
  shortDescription?: string;
  description?: string;
  price: number;
  salePrice?: number;
  currency: ProductCurrency;
  status: ProductStatus;
  stock: number;
  images: string[];
  variants: ProductVariant[];
  featured: boolean;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
}

export interface ProductQuery {
  search?: string;
  sku?: string;
  groupId?: string;
  status?: ProductStatus;
  page?: number;
  limit?: number;
}

export interface ProductResponse {
  data: Product[];
  total: number;
}

export interface ProductStatistics {
  total: number;
  active: number;
  inactive: number;
  outOfStock: number;
}

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private readonly baseUrl = 'http://localhost:3000/products';
  constructor(private http: HttpClient) {}

  getAll(query?: ProductQuery): Observable<ProductResponse> {
    let params = new HttpParams();
    
    if (query?.search) params = params.set('search', query.search);
    if (query?.sku) params = params.set('sku', query.sku);
    if (query?.groupId) params = params.set('groupId', query.groupId);
    if (query?.status) params = params.set('status', query.status);
    if (query?.page) params = params.set('page', query.page.toString());
    if (query?.limit) params = params.set('limit', query.limit.toString());

    return this.http.get<ProductResponse>(this.baseUrl, { params });
  }

  getById(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.baseUrl}/${id}`);
  }

  getStatistics(): Observable<ProductStatistics> {
    return this.http.get<ProductStatistics>(`${this.baseUrl}/statistics`);
  }

  create(dto: Partial<Product>): Observable<Product> {
    return this.http.post<Product>(this.baseUrl, dto);
  }

  update(id: string, dto: Partial<Product>): Observable<Product> {
    return this.http.patch<Product>(`${this.baseUrl}/${id}`, dto);
  }

  toggleStatus(id: string): Observable<Product> {
    return this.http.patch<Product>(`${this.baseUrl}/${id}/status`, {});
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
