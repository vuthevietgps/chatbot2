import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface OpenAIModel {
  id: string;
  name: string;
  description: string;
  maxTokens: number;
  costPer1kTokens: number;
}

export interface TestResult {
  success: boolean;
  error?: string;
  response?: string;
  tokensUsed?: number;
}

export interface OpenAIConfig {
  _id?: string;
  name: string;
  description?: string;
  model: string;
  apiKey: string;
  systemPrompt: string;
  maxTokens: number;
  temperature: number;
  status: 'active' | 'inactive';
  isDefault: boolean;
  applicableScenarios: string[];
  applicableFanpages: string[];
  totalRequests?: number;
  successfulResponses?: number;
  failedResponses?: number;
  totalTokensUsed?: number;
  lastUsedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface OpenAIConfigQuery {
  search?: string;
  status?: 'active' | 'inactive';
  scenario?: string;
  fanpage?: string;
  page?: number;
  limit?: number;
}

export interface OpenAIConfigResponse {
  data: OpenAIConfig[];
  total: number;
  page: number;
  totalPages: number;
}

export interface UsageStats {
  totalRequests: number;
  successfulResponses: number;
  failedResponses: number;
  totalTokensUsed: number;
  successRate: string;
  avgTokensPerRequest: number;
  lastUsedAt?: Date;
}

export interface TestResult {
  success: boolean;
  response?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class OpenAIConfigService {
  private readonly apiUrl = `${environment.apiUrl}/openai-config`;

  constructor(private http: HttpClient) {}

  /**
   * Get available OpenAI models
   */
  getAvailableModels(): Observable<{ data: OpenAIModel[] }> {
    return this.http.get<{ data: OpenAIModel[] }>(`${this.apiUrl}/models`);
  }

  /**
   * Get all OpenAI configurations with filtering and pagination
   */
  getConfigs(query: OpenAIConfigQuery = {}): Observable<OpenAIConfigResponse> {
    let params = new HttpParams();

    if (query.search) params = params.set('search', query.search);
    if (query.status) params = params.set('status', query.status);
    if (query.scenario) params = params.set('scenario', query.scenario);
    if (query.fanpage) params = params.set('fanpage', query.fanpage);
    if (query.page) params = params.set('page', query.page.toString());
    if (query.limit) params = params.set('limit', query.limit.toString());

    return this.http.get<OpenAIConfigResponse>(this.apiUrl, { params });
  }

  /**
   * Get OpenAI configuration by ID
   */
  getConfig(id: string): Observable<OpenAIConfig> {
    return this.http.get<OpenAIConfig>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create new OpenAI configuration
   */
  createConfig(config: Partial<OpenAIConfig>): Observable<OpenAIConfig> {
    return this.http.post<OpenAIConfig>(this.apiUrl, config);
  }

  /**
   * Update OpenAI configuration
   */
  updateConfig(id: string, config: Partial<OpenAIConfig>): Observable<OpenAIConfig> {
    return this.http.patch<OpenAIConfig>(`${this.apiUrl}/${id}`, config);
  }

  /**
   * Delete OpenAI configuration
   */
  deleteConfig(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get default configuration
   */
  getDefaultConfig(): Observable<{ data: OpenAIConfig | null; message?: string }> {
    return this.http.get<{ data: OpenAIConfig | null; message?: string }>(`${this.apiUrl}/default`);
  }

  /**
   * Set configuration as default
   */
  setAsDefault(id: string): Observable<OpenAIConfig> {
    return this.http.post<OpenAIConfig>(`${this.apiUrl}/${id}/set-default`, {});
  }

  /**
   * Test configuration
   */
  testConfig(id: string): Observable<TestResult> {
    return this.http.post<TestResult>(`${this.apiUrl}/${id}/test`, {});
  }

  /**
   * Get usage statistics
   */
  getUsageStats(id: string): Observable<{ data: UsageStats }> {
    return this.http.get<{ data: UsageStats }>(`${this.apiUrl}/${id}/usage-stats`);
  }

  /**
   * Get configuration by scenario
   */
  getConfigByScenario(scenarioId: string): Observable<{ data: OpenAIConfig | null }> {
    return this.http.get<{ data: OpenAIConfig | null }>(`${this.apiUrl}/scenario/${scenarioId}`);
  }

  /**
   * Get configuration by fanpage
   */
  getConfigByFanpage(fanpageId: string): Observable<{ data: OpenAIConfig | null }> {
    return this.http.get<{ data: OpenAIConfig | null }>(`${this.apiUrl}/fanpage/${fanpageId}`);
  }
}