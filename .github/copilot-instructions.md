# Chatbot Project with NestJS, Angular, MongoDB Atlas

## Project Structure
Full-stack chatbot application with:
- **Backend**: NestJS with TypeScript
- **Frontend**: Angular with TypeScript  
- **Database**: MongoDB Atlas
- **Features**:
	- User management with 3 roles (director, manager, employee)
	- Product Groups management (name, color)
	- Fanpages management (pageId, pageName, accessToken, status, connectedAt, lastRefreshed, connectedBy, categories, avatarUrl, subscriberCount, defaultScriptGroupId, defaultProductGroupId, webhookSubscribed, messageQuota, messagesSentThisMonth, aiEnabled, timeZone)
	- Script Groups management (name, description, pageId, productGroupId, status, priority, aiEnabled, createdBy)
	- Scripts management (id uuid, scriptGroupId, name, trigger[], responseTemplate, linkedProductId, linkedProductGroupId, priority, status, contextRequirement, aiAssist, action)

## Progress Tracking
- [x] Create copilot-instructions.md file
- [x] Scaffold NestJS Backend
- [x] Scaffold Angular Frontend  
- [x] Configure MongoDB Atlas connection
- [x] Implement User management with roles
- [x] Setup project dependencies
- [x] Implement Product Groups management (backend + frontend)
- [x] Implement Fanpages management (backend + frontend)
- [x] Implement Script Groups management (backend + frontend)  
- [x] Implement Scripts management (backend + frontend)
- [x] Implement Real-time features (WebSocket, live chat, typing indicators)
- [x] Implement OpenAI integration with chatbot automation
- [x] Implement OpenAI Management System (CRUD, model selection, API key management, scenario linking, usage statistics)
- [ ] Test and run the application
- [ ] Create frontend interface for OpenAI management

## Development Guidelines
- Use TypeScript throughout the project
- Implement proper error handling
- Follow NestJS and Angular best practices
- Use MongoDB Atlas for cloud database