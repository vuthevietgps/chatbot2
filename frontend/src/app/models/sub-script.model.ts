export interface SubScript {
  _id?: string;
  scenario_id: string;
  name: string;
  trigger_keywords: string[];
  response_template: string;
  product_id?: string;
  product_group_id?: string;
  priority: number;
  status: 'active' | 'inactive';
  action: {
    type: 'none' | 'add_tag' | 'set_variable' | 'call_webhook';
    key?: string;
    value?: string;
    webhook_url?: string;
    tag_name?: string;
  };
  context_required?: string;
  match_mode: string;
  created_by: string;
  created_at?: Date;
  updated_at?: Date;
  
  // Populated fields
  scenario?: {
    _id: string;
    name: string;
  };
  product?: {
    _id: string;
    name: string;
  };
  product_group?: {
    _id: string;
    name: string;
  };
  creator?: {
    _id: string;
    name: string;
    email: string;
  };
}

export interface SubScriptCreateRequest {
  scenario_id: string;
  name: string;
  trigger_keywords?: string[];
  response_template: string;
  product_id?: string;
  product_group_id?: string;
  priority?: number;
  status?: 'active' | 'inactive';
  action?: {
    type: 'none' | 'add_tag' | 'set_variable' | 'call_webhook';
    key?: string;
    value?: string;
    webhook_url?: string;
    tag_name?: string;
  };
  context_required?: string;
  match_mode?: string;
  created_by: string;
}

export interface SubScriptUpdateRequest extends Partial<SubScriptCreateRequest> {}

export interface SubScriptSearchRequest {
  keywords: string[];
  scenario_id?: string;
}

export interface SubScriptStatistics {
  total: number;
  active: number;
  inactive: number;
  byScenario: Array<{
    _id: string;
    scenarioName: string;
    count: number;
  }>;
}