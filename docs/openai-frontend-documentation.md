# OpenAI Management System - Frontend Documentation

## Tổng quan
Hệ thống quản lý cấu hình OpenAI được tích hợp vào chatbot Angular frontend, cung cấp giao diện quản lý toàn diện cho việc cấu hình, theo dõi và quản lý các API OpenAI.

## Cấu trúc thư mục
```
src/app/pages/openai-config/
├── openai-config.component.ts         # Component chính
├── openai-config.component.html       # Template chính  
├── openai-config.component.scss       # Style chính
├── openai-config.module.ts           # Module cấu hình
├── openai-config-form/               # Form component
│   ├── openai-config-form.component.ts
│   ├── openai-config-form.component.html
│   └── openai-config-form.component.scss
├── openai-config-stats/              # Stats component
│   ├── openai-config-stats.component.ts
│   ├── openai-config-stats.component.html
│   └── openai-config-stats.component.scss
└── openai-config.service.ts          # Service layer

src/app/models/
└── openai-config.model.ts            # Type definitions
```

## Thành phần chính

### 1. OpenAI Config Service
**File:** `src/app/services/openai-config.service.ts`

**Chức năng:**
- CRUD operations cho OpenAI configurations
- Test API key và model connectivity
- Lấy usage statistics
- Quản lý model list và validation

**Các method chính:**
```typescript
// CRUD Operations
getConfigs(query?: OpenAIConfigQuery): Observable<any>
getConfigById(id: string): Observable<OpenAIConfig>
createConfig(config: CreateOpenAIConfigDto): Observable<OpenAIConfig>
updateConfig(id: string, config: UpdateOpenAIConfigDto): Observable<OpenAIConfig>
deleteConfig(id: string): Observable<void>

// Testing & Validation
testConfig(testData: TestConfigDto): Observable<any>
getAvailableModels(): Observable<OpenAIModel[]>

// Statistics
getUsageStats(configId: string): Observable<OpenAIUsageStats>
```

### 2. Main Component
**File:** `src/app/pages/openai-config/openai-config.component.ts`

**Chức năng:**
- Hiển thị danh sách cấu hình OpenAI trong data table
- Filtering và pagination
- CRUD operations UI
- Dialog management cho create/edit/stats

**Features:**
- Material Data Table với sorting
- Advanced filtering (name, model, scope, status)
- Real-time status indicators
- Action buttons (Edit, Delete, Stats, Test)
- Responsive design

### 3. Form Component
**File:** `src/app/pages/openai-config/openai-config-form/`

**Chức năng:**
- Create/Edit dialog cho OpenAI configurations
- Form validation với reactive forms
- Model selection dropdown
- API key testing functionality
- Scope selection với checkboxes

**Validation Rules:**
- Name: required, min 3 characters
- Model: required selection
- API Key: required, format validation
- Scope: at least one selection required

### 4. Stats Component  
**File:** `src/app/pages/openai-config/openai-config-stats/`

**Chức năng:**
- Hiển thị usage statistics trong dialog
- Overview cards (Total Requests, Success Rate, Total Tokens, Avg Tokens)
- Detailed breakdown (Success/Failure analysis)
- Cost estimation
- Usage timeline information

**Metrics displayed:**
- Total requests và success rate
- Token usage và cost estimation
- Request/response breakdown
- Last usage information

## Models & Types

### OpenAI Config Interface
```typescript
interface OpenAIConfig {
  _id: string;
  name: string;
  model: string;
  apiKey: string;
  scope: string[];
  fanpageId?: string;
  scenarioId?: string;
  priority: number;
  status: 'active' | 'inactive';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Model Definitions
```typescript
interface OpenAIModel {
  id: string;
  name: string;
  description: string;
  contextWindow: number;
  costPer1kTokens: number;
}
```

## Routing Configuration

### Module Routing
```typescript
// app-routing.module.ts
{
  path: 'openai-config',
  loadChildren: () => import('./pages/openai-config/openai-config.module')
    .then(m => m.OpenaiConfigModule)
}
```

### Sidebar Navigation
Menu item được thêm vào sidebar:
```html
<mat-list-item routerLink="/openai-config" routerLinkActive="active-link">
  <mat-icon matListItemIcon>psychology</mat-icon>
  <span matListItemTitle>Cấu hình OpenAI</span>
</mat-list-item>
```

## Material Design Components

### Dependencies Required
```typescript
// Material modules cần thiết
MatTableModule, MatPaginatorModule, MatSortModule
MatInputModule, MatFormFieldModule, MatSelectModule
MatButtonModule, MatIconModule, MatCardModule
MatChipsModule, MatDialogModule, MatSnackBarModule
MatProgressSpinnerModule, MatTooltipModule
MatSlideToggleModule, MatMenuModule, MatCheckboxModule
```

## Styling & UI/UX

### Design Principles
- **Responsive Design**: Mobile-first approach với breakpoints
- **Material Design**: Consistent với Angular Material theme
- **Accessibility**: ARIA labels và keyboard navigation
- **Loading States**: Spinners và skeleton screens
- **Error Handling**: User-friendly error messages

### Color Scheme
- **Primary**: Blue (#1976d2) - cho main actions
- **Accent**: Orange (#ff5722) - cho highlights  
- **Success**: Green (#4caf50) - cho success states
- **Warning**: Red (#f44336) - cho errors/warnings

## API Integration

### Backend Endpoints
```typescript
// Base URL: /api/openai-config
GET    /                    # List configs với query params
GET    /:id                 # Get single config
POST   /                    # Create new config
PUT    /:id                 # Update config
DELETE /:id                 # Delete config
POST   /test                # Test API key/model
GET    /:id/usage-stats     # Get usage statistics
```

### Error Handling
- HTTP error interceptors
- User-friendly error messages
- Retry mechanisms cho network errors
- Validation error display trong forms

## Usage Examples

### Testing API Configuration
```typescript
// Test một OpenAI configuration
const testData: TestConfigDto = {
  model: 'gpt-4',
  apiKey: 'sk-...',
  testMessage: 'Hello, this is a test message'
};

this.openaiService.testConfig(testData).subscribe({
  next: (result) => console.log('Test successful:', result),
  error: (error) => console.error('Test failed:', error)
});
```

### Loading Usage Statistics
```typescript
// Lấy usage stats cho một config
this.openaiService.getUsageStats(configId).subscribe({
  next: (stats) => {
    console.log('Total requests:', stats.totalRequests);
    console.log('Success rate:', stats.successRate);
    console.log('Cost estimate:', stats.costEstimate);
  }
});
```

## Future Enhancements

### Planned Features
1. **Charts & Visualization**: Usage charts với Chart.js/D3
2. **Export/Import**: Configuration backup/restore
3. **Bulk Operations**: Multi-select actions
4. **Real-time Monitoring**: WebSocket-based live updates
5. **Advanced Analytics**: Detailed usage patterns
6. **Cost Tracking**: Monthly/daily cost breakdown
7. **Alert System**: Usage threshold notifications

### Performance Optimizations
1. **Virtual Scrolling**: Cho large datasets
2. **Caching**: Service-level caching với TTL
3. **Lazy Loading**: Images và heavy components
4. **Pagination**: Server-side pagination implementation

## Troubleshooting

### Common Issues
1. **Module Loading Error**: Kiểm tra import paths trong module
2. **Service Not Found**: Verify service registration trong providers
3. **Dialog Not Opening**: Check MatDialogModule import
4. **Form Validation**: Kiểm tra FormBuilder injection
5. **API Connection**: Verify backend URL trong environment

### Development Tips
1. **Hot Reload**: Component changes auto-refresh
2. **Debug Mode**: Console logs cho API calls
3. **Mock Data**: Test mode với fake responses
4. **Error Simulation**: Test error handling scenarios

## Conclusion

OpenAI Management System frontend cung cấp một giao diện quản lý comprehensive và user-friendly cho việc cấu hình và theo dõi OpenAI integrations. Hệ thống được thiết kế với focus vào usability, performance và maintainability, sử dụng Angular best practices và Material Design principles.