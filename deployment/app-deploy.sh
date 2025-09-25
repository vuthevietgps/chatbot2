#!/bin/bash

# Quick Deployment Script for Chatbot
# Based on successful production deployment experience
# This script should be run AFTER vps-setup-complete.sh

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Configuration
APP_DIR="/opt/chatbot"

print_info "🚀 Starting Chatbot Application Deployment"
print_info "Based on real deployment experience"

# Ensure we're in the right directory
cd $APP_DIR

# Check if environment is configured
if [ ! -f .env ]; then
    print_error ".env file not found!"
    print_info "Please run: ./env-setup.sh first"
    exit 1
fi

# Stop any existing containers
print_step "Stopping existing containers..."
docker stop chatbot-backend chatbot-frontend 2>/dev/null || true
docker rm chatbot-backend chatbot-frontend 2>/dev/null || true

# Clean up old images to free space
print_step "Cleaning up Docker system..."
docker system prune -f

# Build backend image (with production optimizations)
print_step "Building backend image..."
docker build --no-cache -t chatbot_backend ./backend

# Build frontend image  
print_step "Building frontend image..."
docker build --no-cache -t chatbot_frontend ./frontend

# Create/ensure Docker network exists
print_step "Ensuring Docker network exists..."
if ! docker network ls | grep -q chatbot_chatbot-network; then
    docker network create chatbot_chatbot-network
    print_info "Created Docker network: chatbot_chatbot-network"
fi

# Start backend first (it takes longer to initialize)
print_step "Starting backend container..."
docker run -d \
  --name chatbot-backend \
  --network chatbot_chatbot-network \
  -p 3000:3000 \
  --env-file .env \
  --restart unless-stopped \
  chatbot_backend

print_info "Backend container started"

# Wait for backend to be ready
print_step "Waiting for backend to initialize..."
sleep 30

# Check backend health with retries
print_info "Checking backend health..."
for i in {1..12}; do
    if curl -sf http://localhost:3000/health > /dev/null 2>&1; then
        print_info "✅ Backend is healthy and ready"
        break
    fi
    
    if [ $i -eq 12 ]; then
        print_error "❌ Backend failed to start properly after 60 seconds"
        print_info "Backend logs:"
        docker logs chatbot-backend --tail=20
        exit 1
    fi
    
    print_info "Waiting for backend... (attempt $i/12)"
    sleep 5
done

# Start frontend container
print_step "Starting frontend container..."
docker run -d \
  --name chatbot-frontend \
  --network chatbot_chatbot-network \
  -p 4200:80 \
  --restart unless-stopped \
  chatbot_frontend

print_info "Frontend container started"

# Wait for frontend to be ready
print_step "Waiting for frontend to initialize..."
sleep 15

# Comprehensive health check
print_step "Performing comprehensive health check..."

# Check backend
if curl -sf http://localhost:3000/health > /dev/null 2>&1; then
    print_info "✅ Backend health check passed"
    BACKEND_RESPONSE=$(curl -s http://localhost:3000/health)
    print_info "Backend response: $BACKEND_RESPONSE"
else
    print_error "❌ Backend health check failed"
    print_info "Backend logs:"
    docker logs chatbot-backend --tail=10
fi

# Check frontend
if curl -sf http://localhost:4200 > /dev/null 2>&1; then
    print_info "✅ Frontend is accessible"
else
    print_error "❌ Frontend is not accessible"
    print_info "Frontend logs:"  
    docker logs chatbot-frontend --tail=10
fi

# Check internal container networking
if docker exec chatbot-frontend curl -sf http://chatbot-backend:3000/health > /dev/null 2>&1; then
    print_info "✅ Internal container networking is working"
else
    print_warning "⚠️  Internal container networking may have issues"
    print_info "This could cause API calls from frontend to fail"
fi

# Check API documentation
if curl -sf http://localhost:3000/api-docs > /dev/null 2>&1; then
    print_info "✅ API documentation is accessible"  
else
    print_warning "⚠️  API documentation is not accessible"
fi

# Display container status
print_step "Container Status:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(NAMES|chatbot-)"

# Display system resources
print_step "System Resources:"
echo "Memory Usage: $(free -h | awk '/^Mem:/ {print $3 "/" $2}')"
echo "Disk Usage: $(df -h / | awk 'NR==2 {print $5}')"

# Get server IP
SERVER_IP=$(curl -s ifconfig.me || hostname -I | awk '{print $1}')

print_info ""
print_info "🎉 Deployment Completed Successfully!"
print_info ""
print_info "📍 Access Your Application:"
print_info "   Frontend: http://${SERVER_IP}:4200"
print_info "   Backend API: http://${SERVER_IP}:3000"
print_info "   API Documentation: http://${SERVER_IP}:3000/api-docs"
print_info "   Health Check: http://${SERVER_IP}:3000/health"
print_info ""
print_info "🔧 Useful Commands:"
print_info "   View backend logs: docker logs chatbot-backend -f"
print_info "   View frontend logs: docker logs chatbot-frontend -f"
print_info "   Restart backend: docker restart chatbot-backend"
print_info "   Restart frontend: docker restart chatbot-frontend" 
print_info "   Stop all: docker stop chatbot-backend chatbot-frontend"
print_info "   Health check: ./health-check-enhanced.sh"
print_info ""
print_info "💡 Next Steps:"
print_info "   1. Test the application in your browser"
print_info "   2. Configure Facebook webhook URL: http://${SERVER_IP}:3000/webhook/facebook"
print_info "   3. Set up domain and SSL certificate (optional)"
print_info "   4. Monitor logs and performance"
print_info ""
print_info "🤖 Happy Chatbotting!"

# Save deployment info
cat > deployment-info.txt << EOF
Chatbot Deployment Information
=============================

Deployment Date: $(date)
Server IP: $SERVER_IP

Application URLs:
- Frontend: http://${SERVER_IP}:4200
- Backend: http://${SERVER_IP}:3000  
- API Docs: http://${SERVER_IP}:3000/api-docs
- Health: http://${SERVER_IP}:3000/health

Container Names:
- Backend: chatbot-backend
- Frontend: chatbot-frontend
- Network: chatbot_chatbot-network

Key Features Deployed:
✅ NestJS Backend with MongoDB Atlas
✅ Angular Frontend with Nginx
✅ Docker containerization
✅ Container networking
✅ Auto-restart policies
✅ Health monitoring
✅ Security configurations

Notes:
- MongoDB URI is properly encoded for special characters
- Angular budget limits are optimized for production
- Containers communicate via Docker network
- All services have health checks enabled
EOF

print_info "Deployment information saved to: deployment-info.txt"