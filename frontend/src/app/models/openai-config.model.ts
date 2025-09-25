export interface OpenAIModel {
  id: string;
  name: string;
  description: string;
  maxTokens: number;
  costPer1kTokens: number;
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
  
  // Usage statistics
  totalRequests?: number;
  successfulResponses?: number;
  failedResponses?: number;
  totalTokensUsed?: number;
  lastUsedAt?: Date;
  
  // Audit trail
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

export const OPENAI_MODELS = [
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    description: 'Nhanh và tiết kiệm chi phí, phù hợp cho hầu hết tác vụ',
    maxTokens: 4096,
    costPer1kTokens: 0.0015
  },
  {
    id: 'gpt-4',
    name: 'GPT-4',
    description: 'Chất lượng cao nhất, phù hợp cho tác vụ phức tạp',
    maxTokens: 8192,
    costPer1kTokens: 0.03
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    description: 'Cân bằng giữa chất lượng và tốc độ',
    maxTokens: 128000,
    costPer1kTokens: 0.01
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4 Omni',
    description: 'Model mới nhất với khả năng đa phương tiện',
    maxTokens: 128000,
    costPer1kTokens: 0.005
  }
];