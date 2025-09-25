export interface Fanpage {
  _id: string;
  pageId: string;
  pageName: string;
  accessToken: string;
  status: 'connected' | 'disconnected' | 'expired';
  connectedAt: Date;
  lastRefreshed: Date;
  connectedBy: string;
  categories: string[];
  avatarUrl?: string;
  subscriberCount?: number;
  defaultScriptGroupId?: string;
  defaultProductGroupId?: string;
  webhookSubscribed: boolean;
  messageQuota: number;
  messagesSentThisMonth: number;
  aiEnabled: boolean;
  timeZone: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFanpageDto {
  pageId: string;
  pageName: string;
  accessToken: string;
  categories?: string[];
  avatarUrl?: string;
  subscriberCount?: number;
  defaultScriptGroupId?: string;
  defaultProductGroupId?: string;
  messageQuota?: number;
  aiEnabled?: boolean;
  timeZone?: string;
}

export interface UpdateFanpageDto {
  pageName?: string;
  accessToken?: string;
  status?: 'connected' | 'disconnected' | 'expired';
  categories?: string[];
  avatarUrl?: string;
  subscriberCount?: number;
  defaultScriptGroupId?: string;
  defaultProductGroupId?: string;
  messageQuota?: number;
  aiEnabled?: boolean;
  timeZone?: string;
}

export interface FanpageQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'connected' | 'disconnected' | 'expired';
  aiEnabled?: boolean;
}