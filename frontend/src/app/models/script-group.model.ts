export interface ScriptGroup {
  _id: string;
  name: string;
  description?: string;
  pageId: string;
  productGroupId?: string;
  status: 'active' | 'inactive';
  priority: number;
  aiEnabled: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateScriptGroupDto {
  name: string;
  description?: string;
  pageId: string;
  productGroupId?: string;
  status?: 'active' | 'inactive';
  priority?: number;
  aiEnabled?: boolean;
}

export interface UpdateScriptGroupDto {
  name?: string;
  description?: string;
  productGroupId?: string;
  status?: 'active' | 'inactive';
  priority?: number;
  aiEnabled?: boolean;
}

export interface ScriptGroupQuery {
  page?: number;
  limit?: number;
  search?: string;
  pageId?: string;
  status?: 'active' | 'inactive';
}