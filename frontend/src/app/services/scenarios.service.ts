import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type ScenarioStatus = 'active' | 'inactive';
export type TriggerType = 'keyword' | 'event' | 'time';
export type MatchMode = 'contains' | 'exact' | 'regex';
export type NodeType = 'text' | 'media' | 'carousel' | 'quick_reply' | 'form' | 'action' | 'wait' | 'ai_reply' | 'child_script';
export type VarType = 'string' | 'number' | 'boolean' | 'json';

export interface ScenarioMeta {
  id: string;
  name: string;
  description?: string;
  page_id: string;
  product_group_id?: string | null;
  status: ScenarioStatus;
  priority: number;
  ai_enabled: boolean;
  openai_config_id?: string;
  created_by?: string; updated_by?: string; created_at?: string; updated_at?: string;
  published_version?: number;
}

export interface Trigger {
  id: string; scenario_id: string; type: TriggerType; match_mode: MatchMode; value: string; is_active: boolean;
}

export interface NodeBase { id: string; scenario_id: string; type: NodeType; name: string; is_entry?: boolean; position_x: number; position_y: number; }
export interface Node<T = any> extends NodeBase { content: T; }

export interface Link { id: string; scenario_id: string; from_node_id: string; to_node_id: string; condition?: any; order_index?: number; }

export interface Variable { id: string; scenario_id: string; key: string; type: VarType; default_value?: any; source?: 'manual' | 'customer' | 'system' | 'runtime'; }

export interface VersionInfo { id: string; scenario_id: string; version: number; created_by?: string; created_at?: string; note?: string; }

export interface AIRuntimeConfig { model?: string; temperature?: number; max_tokens?: number; top_p?: number; system_prompt?: string; openai_config_id?: string; }

export interface TestRunRequest { message: string; customerId?: string; simulate?: boolean; useAI?: boolean; }
export interface TestRunResult { steps: Array<any>; messages: Array<any>; }

@Injectable({ providedIn: 'root' })
export class ScenariosService {
  private readonly baseUrl = 'http://localhost:3000/api/chat/scenarios';
  constructor(private http: HttpClient) {}

  // Scenario meta
  getScenario(id: string): Observable<ScenarioMeta> { return this.http.get<ScenarioMeta>(`${this.baseUrl}/${id}`); }
  updateScenario(id: string, dto: Partial<ScenarioMeta>): Observable<ScenarioMeta> { return this.http.put<ScenarioMeta>(`${this.baseUrl}/${id}`, dto); }

  // Triggers
  listTriggers(id: string): Observable<Trigger[]> { return this.http.get<Trigger[]>(`${this.baseUrl}/${id}/triggers`); }
  createTrigger(id: string, body: Omit<Trigger, 'id' | 'scenario_id'>): Observable<Trigger> { return this.http.post<Trigger>(`${this.baseUrl}/${id}/triggers`, body); }
  updateTrigger(triggerId: string, body: Partial<Trigger>): Observable<Trigger> { return this.http.put<Trigger>(`${this.baseUrl}/triggers/${triggerId}`, body); }
  deleteTrigger(triggerId: string): Observable<void> { return this.http.delete<void>(`${this.baseUrl}/triggers/${triggerId}`); }

  // Nodes & Links
  listNodes(id: string): Observable<{ nodes: Node[]; links: Link[] }> { return this.http.get<{ nodes: Node[]; links: Link[] }>(`${this.baseUrl}/${id}/nodes`); }
  createNode(id: string, body: Omit<Node, 'id' | 'scenario_id'>): Observable<Node> { return this.http.post<Node>(`${this.baseUrl}/${id}/nodes`, body); }
  updateNode(nodeId: string, body: Partial<Node>): Observable<Node> { return this.http.put<Node>(`${this.baseUrl}/nodes/${nodeId}`, body); }
  deleteNode(nodeId: string): Observable<void> { return this.http.delete<void>(`${this.baseUrl}/nodes/${nodeId}`); }
  createLink(id: string, body: Omit<Link, 'id' | 'scenario_id'>): Observable<Link> { return this.http.post<Link>(`${this.baseUrl}/${id}/links`, body); }
  updateLink(linkId: string, body: Partial<Link>): Observable<Link> { return this.http.put<Link>(`${this.baseUrl}/links/${linkId}`, body); }
  deleteLink(linkId: string): Observable<void> { return this.http.delete<void>(`${this.baseUrl}/links/${linkId}`); }

  // Variables
  listVariables(id: string): Observable<Variable[]> { return this.http.get<Variable[]>(`${this.baseUrl}/${id}/variables`); }
  createVariable(id: string, body: Omit<Variable, 'id' | 'scenario_id'>): Observable<Variable> { return this.http.post<Variable>(`${this.baseUrl}/${id}/variables`, body); }
  updateVariable(varId: string, body: Partial<Variable>): Observable<Variable> { return this.http.put<Variable>(`${this.baseUrl}/variables/${varId}`, body); }
  deleteVariable(varId: string): Observable<void> { return this.http.delete<void>(`${this.baseUrl}/variables/${varId}`); }

  // AI settings
  getAI(id: string): Observable<AIRuntimeConfig> { return this.http.get<AIRuntimeConfig>(`${this.baseUrl}/${id}/ai`); }
  updateAI(id: string, cfg: AIRuntimeConfig): Observable<AIRuntimeConfig> { return this.http.put<AIRuntimeConfig>(`${this.baseUrl}/${id}/ai`, cfg); }

  // Test run
  testRun(id: string, req: TestRunRequest): Observable<TestRunResult> { return this.http.post<TestRunResult>(`${this.baseUrl}/${id}/test-run`, req); }

  // Publish / Versions
  publish(id: string, note?: string): Observable<{ version: number }> { return this.http.post<{ version: number }>(`${this.baseUrl}/${id}/publish`, { note }); }
  listVersions(id: string): Observable<VersionInfo[]> { return this.http.get<VersionInfo[]>(`${this.baseUrl}/${id}/versions`); }
  restoreVersion(id: string, version: number): Observable<void> { return this.http.post<void>(`${this.baseUrl}/${id}/versions/${version}/restore`, {}); }
}
