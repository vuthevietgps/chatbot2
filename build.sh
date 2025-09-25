# Production Build Script
#!/bin/bash

echo "🏗️  Building production images..."

# Build backend
echo "Building backend..."
cd backend
docker build -t chatbot-backend:latest .
cd ..

# Build frontend  
echo "Building frontend..."
cd frontend
docker build -t chatbot-frontend:latest .
cd ..

echo "✅ Build completed!"
echo ""
echo "To deploy:"
echo "1. Copy files to VPS: scp -r . user@your-vps:/opt/chatbot/"
echo "2. SSH to VPS: ssh user@your-vps"
echo "3. Run deployment: cd /opt/chatbot && sudo ./deploy.sh"