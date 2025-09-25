#!/bin/bash

# VPS Deployment Script for Chatbot System
# Run this script on your VPS to deploy the application

set -e

echo "🚀 Starting Chatbot Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root (use sudo)"
    exit 1
fi

# Update system
print_status "Updating system packages..."
apt update && apt upgrade -y

# Install Docker
print_status "Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    usermod -aG docker $SUDO_USER
    rm get-docker.sh
else
    print_warning "Docker already installed"
fi

# Install Docker Compose
print_status "Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
else
    print_warning "Docker Compose already installed"
fi

# Install essential tools
print_status "Installing essential tools..."
apt install -y curl wget git nginx certbot python3-certbot-nginx ufw htop

# Configure firewall
print_status "Configuring firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp  # Backend API
ufw allow 9000/tcp  # Portainer
ufw --force enable

# Create application directory
print_status "Creating application directory..."
APP_DIR="/opt/chatbot"
mkdir -p $APP_DIR
cd $APP_DIR

# Clone repository (if using Git)
print_status "Preparing application files..."
print_warning "Please upload your application files to $APP_DIR"
print_warning "Or clone from your repository:"
echo "git clone https://github.com/yourusername/chatbot.git ."

# Create .env file
print_status "Creating environment file..."
if [ ! -f .env ]; then
    cp .env.example .env
    print_warning "Please edit .env file with your actual configuration:"
    echo "nano .env"
    echo ""
    echo "Required variables:"
    echo "- MONGODB_URI (your MongoDB Atlas connection string)"
    echo "- JWT_SECRET (32+ character secret key)"
    echo "- OPENAI_API_KEY (your OpenAI API key)"
    echo "- FACEBOOK_VERIFY_TOKEN (your Facebook verify token)"
    echo "- FACEBOOK_APP_SECRET (your Facebook app secret)"
    echo ""
    read -p "Press Enter after editing .env file..."
fi

# Set proper permissions
print_status "Setting permissions..."
chown -R $SUDO_USER:$SUDO_USER $APP_DIR
chmod +x deploy.sh

# Build and start containers
print_status "Building and starting containers..."
docker-compose down --remove-orphans
docker-compose build --no-cache
docker-compose up -d

# Wait for services to start
print_status "Waiting for services to start..."
sleep 30

# Check service status
print_status "Checking service status..."
docker-compose ps

# Setup SSL with Let's Encrypt (optional)
read -p "Do you want to setup SSL certificate? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter your domain name: " DOMAIN
    if [ ! -z "$DOMAIN" ]; then
        print_status "Setting up SSL certificate for $DOMAIN..."
        certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
        
        # Update nginx config for SSL
        print_status "Updating nginx configuration for SSL..."
        # Add SSL configuration here if needed
    fi
fi

# Create systemd service for auto-start
print_status "Creating systemd service..."
cat > /etc/systemd/system/chatbot.service << EOF
[Unit]
Description=Chatbot Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$APP_DIR
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

systemctl enable chatbot.service
systemctl start chatbot.service

# Setup log rotation
print_status "Setting up log rotation..."
cat > /etc/logrotate.d/chatbot << EOF
$APP_DIR/backend/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    notifempty
    create 644 $SUDO_USER $SUDO_USER
}
EOF

# Create monitoring script
print_status "Creating monitoring script..."
cat > $APP_DIR/monitor.sh << 'EOF'
#!/bin/bash
# Simple monitoring script

# Check if containers are running
if ! docker-compose ps | grep -q "Up"; then
    echo "⚠️  Some containers are down. Restarting..."
    docker-compose up -d
fi

# Check disk space
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 85 ]; then
    echo "⚠️  Disk usage is ${DISK_USAGE}%. Please clean up."
fi

# Check memory usage
MEM_USAGE=$(free | grep Mem | awk '{printf("%.0f", $3/$2 * 100.0)}')
if [ $MEM_USAGE -gt 85 ]; then
    echo "⚠️  Memory usage is ${MEM_USAGE}%. Consider upgrading."
fi

echo "✅ System check completed at $(date)"
EOF

chmod +x $APP_DIR/monitor.sh

# Add cron job for monitoring
(crontab -l 2>/dev/null; echo "*/5 * * * * $APP_DIR/monitor.sh >> $APP_DIR/monitor.log 2>&1") | crontab -

# Final status check
print_status "Performing final health check..."
sleep 10

# Check backend health
if curl -f http://localhost:3000/health &> /dev/null; then
    print_status "✅ Backend is healthy"
else
    print_error "❌ Backend health check failed"
fi

# Check frontend
if curl -f http://localhost &> /dev/null; then
    print_status "✅ Frontend is accessible"
else
    print_error "❌ Frontend health check failed"
fi

# Display final information
echo ""
echo "🎉 Deployment completed!"
echo ""
echo "📊 Service URLs:"
echo "  Frontend: http://$(hostname -I | awk '{print $1}')"
echo "  Backend API: http://$(hostname -I | awk '{print $1}'):3000"
echo "  Portainer: http://$(hostname -I | awk '{print $1}'):9000"
echo ""
echo "📝 Useful commands:"
echo "  View logs: docker-compose logs -f"
echo "  Restart: docker-compose restart"
echo "  Stop: docker-compose down"
echo "  Update: git pull && docker-compose build && docker-compose up -d"
echo ""
echo "📋 Next steps:"
echo "  1. Configure your domain DNS to point to this server"
echo "  2. Update Facebook webhook URL to your domain"
echo "  3. Test the chatbot functionality"
echo "  4. Monitor logs and performance"
echo ""
print_status "Happy chatbotting! 🤖"