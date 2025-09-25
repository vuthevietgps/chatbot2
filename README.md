# 🚀 Chatbot2 - Intelligent Multi-Tenant Chatbot System

<div align="center">

![Chatbot2 Logo](https://img.shields.io/badge/Chatbot2-v1.0.0-blue?style=for-the-badge&logo=robot&logoColor=white)

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Angular](https://img.shields.io/badge/Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white)](https://angular.io/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)](https://openai.com/)

**Professional Multi-Tenant Chatbot Platform with Advanced AI Integration**

[Features](#-features) • [Quick Start](#-quick-start) • [Deployment](#-deployment) • [Documentation](#-documentation) • [Support](#-support)

</div>

---

## 🌟 Features

### 🎯 **Core Capabilities**
- **Multi-Tenant Architecture** - Support multiple businesses and fanpages
- **Real-time Chat Processing** - WebSocket-powered live conversations
- **AI-Powered Responses** - OpenAI GPT integration with customizable scenarios
- **Smart Script Management** - Dynamic response templates with context awareness
- **Role-Based Access Control** - Director, Manager, Employee permission levels
- **Analytics Dashboard** - Comprehensive usage statistics and insights

### 🤖 **AI & Automation**
- **Multiple OpenAI Configurations** - Different AI models for different scenarios
- **Context-Aware Responses** - Intelligent conversation flow management
- **Auto-Response Triggers** - Keyword-based automated replies
- **Custom AI Scenarios** - Tailored conversational experiences
- **Usage Monitoring** - Track AI API costs and performance

### 📊 **Management System**
- **Product Groups Management** - Organize products with custom categories
- **Fanpage Integration** - Facebook Pages API integration
- **Script Templates** - Pre-built conversation flows
- **User Management** - Multi-role user system
- **Real-time Monitoring** - Live system health and performance metrics

### �️ **Security & Reliability**
- **JWT Authentication** - Secure user sessions
- **Rate Limiting** - API protection and abuse prevention
- **Health Monitoring** - Automated system diagnostics
- **Docker Containerization** - Reliable deployment and scaling
- **Backup Systems** - Automated data protection

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ LTS
- **Docker** & Docker Compose
- **MongoDB Atlas** account
- **OpenAI API** key
- **Facebook Developer** account (for Messenger integration)

### 1️⃣ Clone Repository

```bash
git clone https://github.com/vuthevietgps/chatbot2.git
cd chatbot2
```

### 2️⃣ Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit with your credentials
nano .env
```

**Required Environment Variables:**
```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chatbot2

# JWT Security
JWT_SECRET=your-super-secret-jwt-key

# OpenAI Integration
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_MODEL=gpt-4-turbo-preview

# Facebook Integration
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
FACEBOOK_VERIFY_TOKEN=your-webhook-verify-token

# Application
NODE_ENV=production
FRONTEND_URL=http://your-domain.com
BACKEND_URL=http://your-domain.com:3000
```

### 3️⃣ Start with Docker

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### 4️⃣ Access Your Application

- **Frontend Dashboard:** http://localhost
- **Backend API:** http://localhost:3000
- **API Documentation:** http://localhost:3000/api
- **Portainer (Container Management):** http://localhost:9000

---

## 🌐 Production Deployment

### VPS Deployment (Automated)

We provide a comprehensive VPS setup script that handles everything:

```bash
# Download and run VPS setup script
wget https://raw.githubusercontent.com/vuthevietgps/chatbot2/main/vps-setup.sh
chmod +x vps-setup.sh
sudo ./vps-setup.sh
```

**What the script does:**
- ✅ Deep clean VPS and remove unnecessary packages
- ✅ Install Docker, Docker Compose, Node.js
- ✅ Configure firewall and security settings
- ✅ Set up SSL certificates with Let's Encrypt
- ✅ Clone repository and configure environment
- ✅ Set up monitoring and health checks
- ✅ Configure automated backups and maintenance
- ✅ Optimize system performance

### Health Monitoring

Use our health check script to monitor your deployment:

```bash
# Basic health check
./health-check.sh

# Full system analysis
./health-check.sh full

# Auto-fix common issues
./health-check.sh fix

# Generate detailed report
./health-check.sh report
```

---

## 🛠️ Technology Stack

### Backend (NestJS)
- **Framework**: NestJS với TypeScript
- **Database**: MongoDB Atlas
- **Authentication**: JWT + Passport
- **API Documentation**: Swagger
- **Validation**: class-validator
- **Security**: bcryptjs cho mã hóa password

### Frontend (Angular)
- **Framework**: Angular 17 với TypeScript
- **UI Library**: Angular Material
- **State Management**: Services + RxJS
- **Routing**: Angular Router
- **Forms**: Reactive Forms

## Cấu trúc Project

```
chatbot2/
├── backend/                 # NestJS Backend
│   ├── src/
│   │   ├── auth/           # Authentication module
│   │   ├── users/          # User management module
│   │   ├── app.module.ts   # Root module
│   │   └── main.ts         # Application entry point
│   ├── package.json
│   └── .env.example        # Environment configuration template
│
├── frontend/               # Angular Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── auth/       # Authentication components
│   │   │   ├── layout/     # Layout components (header, sidebar)
│   │   │   ├── pages/      # Feature pages (users, etc.)
│   │   │   └── services/   # API services
│   │   ├── environments/   # Environment configurations
│   │   └── styles.scss     # Global styles
│   └── package.json
│
└── .github/
    └── copilot-instructions.md # Project guidelines
```

## Cài đặt và Chạy

### Prerequisites
- Node.js (v18 trở lên)
- MongoDB Atlas account
- Angular CLI

### Backend Setup

1. **Cài đặt dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Cấu hình environment:**
   ```bash
   cp .env.example .env
   ```
   Sửa file `.env` với thông tin MongoDB Atlas của bạn:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chatbot
   JWT_SECRET=your-super-secret-jwt-key
   PORT=3000
   ```

3. **Chạy backend:**
   ```bash
   npm run start:dev
   ```
   Backend sẽ chạy tại: http://localhost:3000
   API Documentation: http://localhost:3000/api-docs

### Frontend Setup

1. **Cài đặt dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Chạy frontend:**
   ```bash
   npm start
   ```
   Frontend sẽ chạy tại: http://localhost:4200

## API Endpoints

### Users Management
- `GET /users` - Lấy danh sách users
- `POST /users` - Tạo user mới
- `GET /users/:id` - Lấy thông tin user
- `PATCH /users/:id` - Cập nhật user
- `DELETE /users/:id` - Xóa user
- `PATCH /users/:id/toggle-status` - Bật/tắt trạng thái user
- `GET /users/statistics` - Thống kê users

### Authentication
- `POST /auth/login` - Đăng nhập

## Tính năng User Management

### Vai trò (Roles)
1. **Giám đốc (director)**: Quyền cao nhất
2. **Quản lý (manager)**: Quyền quản lý nhóm
3. **Nhân viên (employee)**: Quyền cơ bản

### Chức năng
- ✅ **Thêm user**: Form popup với validation đầy đủ
- ✅ **Sửa user**: Cập nhật thông tin (không bao gồm password)
- ✅ **Xóa user**: Xác nhận trước khi xóa
- ✅ **Kích hoạt/Vô hiệu hóa**: Toggle trạng thái user
- ✅ **Tìm kiếm**: Tìm theo tên, email
- ✅ **Lọc**: Lọc theo vai trò
- ✅ **Phân trang**: Pagination cho danh sách
- ✅ **Thống kê**: Tổng số, active, inactive users

### Giao diện
- **Sidebar**: Menu điều hướng các tính năng
- **Header**: Thông tin user, menu actions
- **Main Content**: 
  - Statistics cards ở trên
  - Bộ lọc và tìm kiếm
  - Bảng dữ liệu với actions
  - Phân trang

## Database Schema

### User Schema
```typescript
{
  fullName: string;        // Họ tên
  email: string;          // Email (unique)
  phone: string;          // Số điện thoại
  password: string;       // Mật khẩu (hashed)
  role: 'director' | 'manager' | 'employee';  // Vai trò
  isActive: boolean;      // Trạng thái hoạt động
  department?: string;    // Phòng ban
  position?: string;      // Chức vụ
  avatar?: string;        // URL avatar
  dateOfBirth?: Date;     // Ngày sinh
  createdAt: Date;        // Ngày tạo
  updatedAt: Date;        // Ngày cập nhật
}
```

## Roadmap

### Phase 1: User Management ✅
- [x] CRUD operations cho users
- [x] Authentication cơ bản
- [x] Role-based system
- [x] Dashboard layout

### Phase 2: Fanpage Management (Coming soon)
- [ ] Kết nối Facebook API
- [ ] Quản lý nhiều fanpage
- [ ] Cấu hình webhook
- [ ] Monitor messages

### Phase 3: Chat Scripts (Coming soon)
- [ ] Visual flow builder
- [ ] Template management
- [ ] Conditional responses
- [ ] Integration với fanpage

### Phase 4: Customer Management (Coming soon)
- [ ] Customer database
- [ ] Chat history
- [ ] Customer segmentation
- [ ] Analytics dashboard

## Đóng góp

1. Fork repository
2. Tạo feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push branch: `git push origin feature/amazing-feature`
5. Tạo Pull Request

## License

MIT License - xem file [LICENSE](LICENSE) để biết thêm chi tiết.

## Liên hệ

- **Project**: Chatbot Management System
- **Version**: 1.0.0
- **Status**: In Development 🚧