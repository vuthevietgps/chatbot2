# OpenAI Management System Documentation

## Tổng quan

Hệ thống quản lý OpenAI cho phép quản trị viên tạo và quản lý nhiều cấu hình OpenAI khác nhau, mỗi cấu hình có thể được áp dụng cho các fanpage hoặc scenario cụ thể.

## Tính năng chính

### 1. Quản lý cấu hình OpenAI
- **Tạo/Sửa/Xóa** cấu hình OpenAI
- **Lựa chọn model** từ dropdown (GPT-3.5 Turbo, GPT-4, GPT-4 Turbo, GPT-4 Omni)
- **Quản lý API Key** riêng biệt cho từng cấu hình
- **System Prompt** tùy chỉnh cho từng cấu hình
- **Cài đặt tham số** (temperature, max tokens)

### 2. Áp dụng cấu hình theo ngữ cảnh
- **Theo Fanpage**: Cấu hình riêng cho từng fanpage
- **Theo Scenario**: Cấu hình cho từng nhóm kịch bản
- **Cấu hình mặc định**: Fallback khi không có cấu hình cụ thể

### 3. Thống kê và giám sát
- **Số lượng request** đã xử lý
- **Tỷ lệ thành công/thất bại**
- **Tổng tokens** đã sử dụng
- **Thời gian sử dụng** lần cuối

## API Endpoints

### 1. Model Management
```
GET /openai-config/models
```
Lấy danh sách các model OpenAI có sẵn

### 2. Configuration CRUD
```
POST /openai-config
GET /openai-config
GET /openai-config/:id
PATCH /openai-config/:id
DELETE /openai-config/:id
```

### 3. Configuration Lookup
```
GET /openai-config/default
GET /openai-config/scenario/:scenarioId
GET /openai-config/fanpage/:fanpageId
```

### 4. Management Operations
```
POST /openai-config/:id/set-default
POST /openai-config/:id/test
GET /openai-config/:id/usage-stats
```

## Data Schema

### OpenAI Configuration
```typescript
{
  name: string;           // Tên cấu hình
  description?: string;   // Mô tả
  model: string;          // Model OpenAI (gpt-3.5-turbo, gpt-4, etc.)
  apiKey: string;         // API Key OpenAI
  systemPrompt: string;   // System prompt
  maxTokens: number;      // Giới hạn tokens (50-4000)
  temperature: number;    // Temperature (0-2)
  status: 'active' | 'inactive';
  isDefault: boolean;     // Cấu hình mặc định
  applicableScenarios: ObjectId[];  // Danh sách scenario áp dụng
  applicableFanpages: ObjectId[];   // Danh sách fanpage áp dụng
  
  // Thống kê sử dụng
  totalRequests: number;
  successfulResponses: number;
  failedResponses: number;
  totalTokensUsed: number;
  lastUsedAt: Date;
  
  // Audit trail
  createdBy: ObjectId;
  updatedBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
```

## Workflow Integration

### 1. Chatbot Processing Flow
```
Incoming Message → Find Script Match → No Match Found → AI Fallback
                                                            ↓
                                             Find OpenAI Config:
                                             1. By Fanpage
                                             2. By Scenario  
                                             3. Default Config
                                                            ↓
                                             Generate AI Response
                                                            ↓
                                             Update Usage Stats
                                                            ↓
                                             Send Response
```

### 2. Configuration Priority
1. **Fanpage-specific config**: Ưu tiên cao nhất
2. **Scenario-specific config**: Ưu tiên trung bình  
3. **Default config**: Fallback cuối cùng

## Sử dụng trong Admin Interface

### 1. Tạo cấu hình mới
```typescript
// POST /openai-config
{
  "name": "GPT-4 cho Fanpage Thời Trang",
  "description": "Cấu hình AI chuyên về tư vấn thời trang",
  "model": "gpt-4",
  "apiKey": "sk-...",
  "systemPrompt": "Bạn là chuyên gia tư vấn thời trang...",
  "maxTokens": 200,
  "temperature": 0.7,
  "status": "active",
  "isDefault": false,
  "applicableFanpages": ["fanpage_id_1", "fanpage_id_2"]
}
```

### 2. Dropdown Model Selection
Frontend sẽ gọi `/openai-config/models` để lấy danh sách:
```typescript
const models = [
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: '...' },
  { id: 'gpt-4', name: 'GPT-4', description: '...' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: '...' },
  { id: 'gpt-4o', name: 'GPT-4 Omni', description: '...' }
];
```

### 3. Test Configuration
```typescript
// POST /openai-config/:id/test
{
  "success": true,
  "response": "Xin chào! Tôi có thể giúp gì cho bạn?"
}
```

## Best Practices

### 1. Security
- **Encrypt API Keys** trong database
- **Validate permissions** trước khi thao tác
- **Audit log** mọi thay đổi cấu hình

### 2. Performance
- **Cache configurations** để tránh query database liên tục
- **Rate limiting** cho API calls
- **Monitor token usage** để tránh vượt quota

### 3. Configuration Management
- **Có ít nhất 1 default config** luôn hoạt động
- **Test configuration** trước khi kích hoạt
- **Backup configurations** trước khi thay đổi

## Migration từ Environment Variables

Để chuyển từ hệ thống cũ (dùng env vars) sang hệ thống mới:

1. **Tạo default config** từ env vars hiện tại
2. **Update chatbot processor** sử dụng database configs
3. **Gradually migrate** các fanpage sang configs riêng
4. **Remove env var dependency** khi hoàn thành

## Monitoring & Alerts

### 1. Usage Monitoring
- Track token usage per config
- Monitor success/failure rates
- Alert when approaching API limits

### 2. Health Checks
- Periodic config validation
- API key validity checking
- Model availability verification

## Example Usage

### Frontend Component (Angular)
```typescript
export class OpenAIConfigComponent {
  models$ = this.http.get('/api/openai-config/models');
  scenarios$ = this.http.get('/api/script-groups');
  fanpages$ = this.http.get('/api/fanpages');
  
  onSubmit(form) {
    const config = {
      name: form.name,
      model: form.selectedModel,
      apiKey: form.apiKey,
      systemPrompt: form.systemPrompt,
      applicableScenarios: form.selectedScenarios,
      applicableFanpages: form.selectedFanpages
    };
    
    this.http.post('/api/openai-config', config).subscribe();
  }
}
```

### Service Integration
```typescript
// ChatBotProcessorService sẽ tự động:
// 1. Tìm config phù hợp theo priority
// 2. Sử dụng config để generate response  
// 3. Update usage statistics
// 4. Handle fallback nếu config fail
```