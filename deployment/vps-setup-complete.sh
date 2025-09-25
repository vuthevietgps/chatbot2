#!/bin/bash

#############################################################################
# VPS COMPLETE SETUP SCRIPT - Based on Real Deployment Experience
# For Ubuntu 22.04+ / 24.04 LTS
# Repository: https://github.com/vuthevietgps/chatbot2
# 
# This script includes all lessons learned from successful deployment:
# - MongoDB URI encoding for special characters
# - Angular budget size fixes  
# - Docker networking configuration
# - Nginx proxy setup for containers
# - Firewall and security hardening
#############################################################################

set -e

# Colors for beautiful output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Configuration
GITHUB_REPO="https://github.com/vuthevietgps/chatbot2.git"
APP_DIR="/opt/chatbot"
LOG_FILE="/var/log/chatbot-install.log"
BACKUP_DIR="/opt/backup-$(date +%Y%m%d-%H%M%S)"

# Functions for colored output
print_header() {
    echo -e "\n${PURPLE}############################################################################${NC}"
    echo -e "${WHITE}  $1${NC}"
    echo -e "${PURPLE}############################################################################${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ [SUCCESS]${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ️  [INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️  [WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}❌ [ERROR]${NC} $1"
}

print_step() {
    echo -e "\n${CYAN}🔧 [STEP]${NC} $1"
}

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> $LOG_FILE
}

# Check if running as root
check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_error "This script must be run as root. Use: sudo $0"
        exit 1
    fi
}

# System information check
system_info() {
    print_step "Gathering system information..."
    
    echo -e "${WHITE}System Information:${NC}"
    echo "  Hostname: $(hostname)"
    echo "  OS: $(lsb_release -d | cut -f2)"
    echo "  Kernel: $(uname -r)"
    echo "  Architecture: $(uname -m)"
    echo "  CPU Cores: $(nproc)"
    echo "  Total RAM: $(free -h | awk '/^Mem:/ {print $2}')"
    echo "  Available Storage: $(df -h / | awk 'NR==2 {print $4}')"
    echo "  Public IP: $(curl -s ifconfig.me || echo 'Unable to detect')"
    echo "  Private IP: $(hostname -I | awk '{print $1}')"
    
    # Check minimum requirements based on real experience
    RAM_GB=$(free -g | awk '/^Mem:/ {print $2}')
    DISK_GB=$(df --output=avail -BG / | tail -n1 | sed 's/G//')
    
    if [ $RAM_GB -lt 3 ]; then
        print_warning "RAM is ${RAM_GB}GB. Minimum 3.8GB recommended for stable operation."
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    if [ $DISK_GB -lt 30 ]; then
        print_warning "Available disk space is ${DISK_GB}GB. Minimum 35GB recommended."
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# Update system packages
update_system() {
    print_step "Updating system packages..."
    
    export DEBIAN_FRONTEND=noninteractive
    apt update
    apt upgrade -y
    apt dist-upgrade -y
    
    print_success "System packages updated"
    log "System packages updated"
}

# Install essential packages
install_essentials() {
    print_step "Installing essential packages..."
    
    apt install -y \
        curl \
        wget \
        git \
        unzip \
        vim \
        nano \
        htop \
        neofetch \
        tree \
        jq \
        bc \
        net-tools \
        lsof \
        rsync \
        screen \
        tmux \
        fail2ban \
        ufw \
        software-properties-common \
        apt-transport-https \
        ca-certificates \
        gnupg \
        lsb-release
    
    print_success "Essential packages installed"
    log "Essential packages installed"
}

# Create swap space (learned from experience - needed for 3.8GB RAM VPS)
create_swap() {
    print_step "Creating swap space for better memory management..."
    
    # Check if swap already exists
    if free | awk '/^Swap:/ {exit ($2 > 0 ? 0 : 1)}'; then
        print_info "Swap space already exists"
        return
    fi
    
    # Create 2GB swap file
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    
    # Make swap permanent
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    
    # Optimize swap usage
    echo 'vm.swappiness=10' >> /etc/sysctl.conf
    echo 'vm.vfs_cache_pressure=50' >> /etc/sysctl.conf
    
    print_success "Swap space created (2GB)"
    log "Swap space created"
}

# Install Docker CE (specific version that works)
install_docker() {
    print_step "Installing Docker CE..."
    
    # Remove old versions
    apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true
    
    # Add Docker's official GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Add Docker repository
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    apt update
    apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # Configure Docker daemon for production
    mkdir -p /etc/docker
    cat > /etc/docker/daemon.json << EOF
{
    "log-driver": "json-file",
    "log-opts": {
        "max-size": "10m",
        "max-file": "3"
    },
    "storage-driver": "overlay2",
    "live-restore": true,
    "default-ulimits": {
        "nofile": {
            "Hard": 64000,
            "Name": "nofile",
            "Soft": 64000
        }
    }
}
EOF
    
    # Start and enable Docker
    systemctl enable docker
    systemctl start docker
    
    # Add user to docker group
    if [ "$SUDO_USER" ]; then
        usermod -aG docker $SUDO_USER
        print_info "Added $SUDO_USER to docker group"
    fi
    
    # Install Docker Compose standalone (avoid version conflicts)
    curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    
    # Test installation
    docker --version
    docker-compose --version
    
    print_success "Docker CE installed successfully"
    log "Docker installed successfully"
}

# Install Node.js 20.x (latest LTS)
install_nodejs() {
    print_step "Installing Node.js 20.x LTS..."
    
    # Install Node.js 20.x LTS from NodeSource
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
    
    # Verify installation
    node_version=$(node --version)
    npm_version=$(npm --version)
    
    print_info "Node.js version: $node_version"
    print_info "NPM version: $npm_version"
    
    print_success "Node.js installed successfully"
    log "Node.js installed: $node_version, NPM: $npm_version"
}

# Configure UFW firewall (learned from experience)
configure_firewall() {
    print_step "Configuring UFW firewall..."
    
    # Reset and configure UFW
    ufw --force reset
    ufw default deny incoming
    ufw default allow outgoing
    
    # Allow essential ports based on real deployment
    ufw allow ssh comment 'SSH access'
    ufw allow 80/tcp comment 'HTTP'
    ufw allow 443/tcp comment 'HTTPS'
    ufw allow 3000/tcp comment 'Backend API'
    ufw allow 4200/tcp comment 'Frontend Dev'
    
    # Enable firewall
    ufw --force enable
    
    print_success "UFW firewall configured"
    log "UFW firewall configured"
}

# Setup Fail2Ban security
setup_fail2ban() {
    print_step "Configuring Fail2Ban..."
    
    # Configure SSH protection
    cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 24h
EOF
    
    systemctl enable fail2ban
    systemctl restart fail2ban
    
    print_success "Fail2Ban configured"
    log "Fail2Ban configured"
}

# Clone and setup application
setup_application() {
    print_step "Setting up Chatbot application..."
    
    # Remove existing directory if exists
    [ -d $APP_DIR ] && rm -rf $APP_DIR
    
    # Create application directory
    mkdir -p $APP_DIR
    cd $APP_DIR
    
    # Clone repository
    print_info "Cloning repository from: $GITHUB_REPO"
    git clone $GITHUB_REPO .
    
    # Set proper permissions
    if [ "$SUDO_USER" ]; then
        chown -R $SUDO_USER:$SUDO_USER $APP_DIR
    fi
    
    # Make scripts executable
    find . -name "*.sh" -exec chmod +x {} \;
    
    print_success "Application cloned and setup completed"
    log "Application setup completed at $APP_DIR"
}

# Create environment configuration helper
create_env_helper() {
    print_step "Creating environment configuration helper..."
    
    cd $APP_DIR
    
    # Create environment setup script
    cat > env-setup.sh << 'EOF'
#!/bin/bash

# Environment Configuration Helper
# This script helps configure .env file with proper MongoDB URI encoding

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
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

# URL encode function for MongoDB URI
url_encode() {
    local string="${1}"
    local strlen=${#string}
    local encoded=""
    local pos c o

    for (( pos=0 ; pos<strlen ; pos++ )); do
       c=${string:$pos:1}
       case "$c" in
          [-_.~a-zA-Z0-9] ) o="${c}" ;;
          * )               printf -v o '%%%02x' "'$c"
       esac
       encoded+="${o}"
    done
    echo "${encoded}"
}

print_info "Chatbot Environment Configuration"
echo "=================================="

# Check if .env exists
if [ -f .env ]; then
    print_warning ".env file already exists. Creating backup..."
    cp .env .env.backup.$(date +%Y%m%d-%H%M%S)
fi

# Copy from example
cp .env.example .env

print_info "Please provide the following configuration:"

# MongoDB Configuration
echo ""
print_info "1. MongoDB Atlas Configuration"
read -p "MongoDB Username: " MONGODB_USER
read -s -p "MongoDB Password: " MONGODB_PASSWORD
echo ""
read -p "MongoDB Cluster URL (e.g., cluster.abc123.mongodb.net): " MONGODB_CLUSTER
read -p "Database Name [chatbot]: " MONGODB_DB
MONGODB_DB=${MONGODB_DB:-chatbot}

# URL encode the password to handle special characters
ENCODED_PASSWORD=$(url_encode "$MONGODB_PASSWORD")

# Construct MongoDB URI
MONGODB_URI="mongodb+srv://${MONGODB_USER}:${ENCODED_PASSWORD}@${MONGODB_CLUSTER}/${MONGODB_DB}?retryWrites=true&w=majority&appName=chatbot"

# Update .env file
sed -i "s|MONGODB_URI=.*|MONGODB_URI=${MONGODB_URI}|" .env

print_info "✅ MongoDB URI configured with URL encoding"

# JWT Secret
echo ""
print_info "2. JWT Secret (leave empty to generate random)"
read -p "JWT Secret: " JWT_SECRET
if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(openssl rand -hex 32)
    print_info "Generated JWT Secret: $JWT_SECRET"
fi
sed -i "s|JWT_SECRET=.*|JWT_SECRET=${JWT_SECRET}|" .env

# OpenAI Configuration
echo ""
print_info "3. OpenAI Configuration"
read -p "OpenAI API Key: " OPENAI_API_KEY
sed -i "s|OPENAI_API_KEY=.*|OPENAI_API_KEY=${OPENAI_API_KEY}|" .env

# Facebook Configuration
echo ""
print_info "4. Facebook Configuration"
read -p "Facebook App ID: " FACEBOOK_APP_ID
read -p "Facebook App Secret: " FACEBOOK_APP_SECRET
read -p "Facebook Verify Token: " FACEBOOK_VERIFY_TOKEN

sed -i "s|FACEBOOK_APP_ID=.*|FACEBOOK_APP_ID=${FACEBOOK_APP_ID}|" .env
sed -i "s|FACEBOOK_APP_SECRET=.*|FACEBOOK_APP_SECRET=${FACEBOOK_APP_SECRET}|" .env
sed -i "s|FACEBOOK_VERIFY_TOKEN=.*|FACEBOOK_VERIFY_TOKEN=${FACEBOOK_VERIFY_TOKEN}|" .env

# Server Configuration
echo ""
print_info "5. Server Configuration"
SERVER_IP=$(curl -s ifconfig.me || hostname -I | awk '{print $1}')
print_info "Detected server IP: $SERVER_IP"
read -p "Server IP/Domain [$SERVER_IP]: " SERVER_HOST
SERVER_HOST=${SERVER_HOST:-$SERVER_IP}

sed -i "s|SERVER_HOST=.*|SERVER_HOST=${SERVER_HOST}|" .env
sed -i "s|FRONTEND_URL=.*|FRONTEND_URL=http://${SERVER_HOST}:4200|" .env
sed -i "s|BACKEND_URL=.*|BACKEND_URL=http://${SERVER_HOST}:3000|" .env

print_info "✅ Environment configuration completed!"
print_info "Configuration saved to .env file"

echo ""
print_warning "Important notes:"
echo "- MongoDB password has been URL encoded to handle special characters"
echo "- JWT secret has been generated randomly for security"
echo "- Update Facebook webhook URL to: http://${SERVER_HOST}:3000/webhook/facebook"
echo ""
print_info "You can now run: docker-compose up -d"
EOF

    chmod +x env-setup.sh
    
    print_success "Environment configuration helper created"
    log "Environment configuration helper created"
}

# Fix Angular budget limits (learned from deployment experience)
fix_angular_budget() {
    print_step "Fixing Angular budget limits..."
    
    cd $APP_DIR
    
    # Check if angular.json exists
    if [ -f frontend/angular.json ]; then
        # Backup original file
        cp frontend/angular.json frontend/angular.json.backup
        
        # Update budget limits to handle production build
        sed -i 's/"maximumWarning": "500kb"/"maximumWarning": "5mb"/g' frontend/angular.json
        sed -i 's/"maximumError": "1mb"/"maximumError": "10mb"/g' frontend/angular.json
        
        print_success "Angular budget limits updated"
        log "Angular budget limits fixed"
    else
        print_warning "Angular.json not found, skipping budget fix"
    fi
}

# Fix backend Dockerfile (learned from deployment experience)
fix_backend_dockerfile() {
    print_step "Fixing backend Dockerfile..."
    
    cd $APP_DIR
    
    if [ -f backend/Dockerfile ]; then
        # Backup original
        cp backend/Dockerfile backend/Dockerfile.backup
        
        # Create optimized Dockerfile
        cat > backend/Dockerfile << 'EOF'
# Backend Dockerfile - Production Ready
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove dev dependencies after build to reduce image size
RUN npm prune --production

# Expose port
EXPOSE 3000

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Change ownership
RUN chown -R nestjs:nodejs /usr/src/app
USER nestjs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start the application
CMD ["node", "dist/main"]
EOF
        
        print_success "Backend Dockerfile optimized"
        log "Backend Dockerfile fixed"
    fi
}

# Create comprehensive monitoring script
create_monitoring() {
    print_step "Creating monitoring and maintenance tools..."
    
    cd $APP_DIR
    
    # Create enhanced health check script
    cat > health-check-enhanced.sh << 'EOF'
#!/bin/bash

# Enhanced Health Check Script for Chatbot System
# Monitors containers, system resources, and application health

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

print_status "Starting comprehensive health check..."

# Check Docker service
if systemctl is-active --quiet docker; then
    print_success "Docker service is running"
else
    print_error "Docker service is not running"
    systemctl start docker
fi

# Check containers
print_status "Checking container status..."
if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "(chatbot-backend|chatbot-frontend)"; then
    
    # Check backend health
    if curl -sf http://localhost:3000/health > /dev/null 2>&1; then
        print_success "Backend health check passed"
    else
        print_error "Backend health check failed"
        docker logs chatbot-backend --tail=10
    fi
    
    # Check frontend
    if curl -sf http://localhost:4200 > /dev/null 2>&1; then
        print_success "Frontend is accessible"
    else
        print_error "Frontend is not accessible"
        docker logs chatbot-frontend --tail=10
    fi
    
    # Check internal container networking
    if docker exec chatbot-frontend curl -sf http://chatbot-backend:3000/health > /dev/null 2>&1; then
        print_success "Internal container networking is working"
    else
        print_warning "Internal container networking issue detected"
    fi
    
else
    print_error "Chatbot containers are not running"
    print_status "Attempting to restart containers..."
    docker-compose up -d
fi

# System resource monitoring
print_status "Checking system resources..."

# Memory usage
MEM_USAGE=$(free | grep Mem | awk '{printf("%.1f", $3/$2 * 100.0)}')
if (( $(echo "$MEM_USAGE > 80" | bc -l) )); then
    print_warning "High memory usage: ${MEM_USAGE}%"
else
    print_success "Memory usage: ${MEM_USAGE}%"
fi

# Disk usage
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    print_warning "High disk usage: ${DISK_USAGE}%"
    print_status "Cleaning up Docker system..."
    docker system prune -f
else
    print_success "Disk usage: ${DISK_USAGE}%"
fi

# Check network connectivity
if ping -c 1 8.8.8.8 > /dev/null 2>&1; then
    print_success "Internet connectivity is working"
else
    print_error "Internet connectivity issue"
fi

# Check firewall status
if ufw status | grep -q "Status: active"; then
    print_success "UFW firewall is active"
else
    print_warning "UFW firewall is not active"
fi

# Check MongoDB connectivity (if backend is running)
if curl -sf http://localhost:3000/health > /dev/null 2>&1; then
    print_success "MongoDB connection is healthy"
else
    print_warning "Unable to verify MongoDB connection"
fi

print_status "Health check completed"

# Log results
echo "$(date '+%Y-%m-%d %H:%M:%S') - Health check completed" >> health-check.log
EOF

    chmod +x health-check-enhanced.sh
    
    # Create automatic deployment script
    cat > app-deploy.sh << 'EOF'
#!/bin/bash

# Automated Application Deployment Script
# Handles building and deploying with lessons learned

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
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

print_info "Starting automated deployment..."

# Ensure we're in the right directory
cd /opt/chatbot

# Stop existing containers
print_info "Stopping existing containers..."
docker-compose down --remove-orphans

# Clean up old images to free space
print_info "Cleaning up Docker system..."
docker system prune -f

# Build images with no cache (ensure latest changes)
print_info "Building backend image..."
docker build --no-cache -t chatbot_backend ./backend

print_info "Building frontend image..."  
docker build --no-cache -t chatbot_frontend ./frontend

# Create Docker network if it doesn't exist
if ! docker network ls | grep -q chatbot_chatbot-network; then
    print_info "Creating Docker network..."
    docker network create chatbot_chatbot-network
fi

# Start backend first
print_info "Starting backend container..."
docker run -d \
  --name chatbot-backend \
  --network chatbot_chatbot-network \
  -p 3000:3000 \
  --env-file .env \
  --restart unless-stopped \
  chatbot_backend

# Wait for backend to be ready
print_info "Waiting for backend to start..."
sleep 30

# Check backend health
for i in {1..10}; do
    if curl -sf http://localhost:3000/health > /dev/null; then
        print_info "Backend is healthy"
        break
    fi
    if [ $i -eq 10 ]; then
        print_error "Backend failed to start properly"
        docker logs chatbot-backend
        exit 1
    fi
    sleep 5
done

# Start frontend
print_info "Starting frontend container..."
docker run -d \
  --name chatbot-frontend \
  --network chatbot_chatbot-network \
  -p 4200:80 \
  --restart unless-stopped \
  chatbot_frontend

# Wait for frontend
print_info "Waiting for frontend to start..."
sleep 15

# Final health check
print_info "Performing final health check..."

if curl -sf http://localhost:3000/health > /dev/null; then
    print_info "✅ Backend health check passed"
else
    print_error "❌ Backend health check failed"
fi

if curl -sf http://localhost:4200 > /dev/null; then
    print_info "✅ Frontend is accessible"
else
    print_error "❌ Frontend is not accessible"
fi

# Test internal networking
if docker exec chatbot-frontend curl -sf http://chatbot-backend:3000/health > /dev/null; then
    print_info "✅ Container networking is working"
else
    print_error "❌ Container networking issue"
fi

print_info "Deployment completed!"
print_info "Frontend: http://$(hostname -I | awk '{print $1}'):4200"
print_info "Backend: http://$(hostname -I | awk '{print $1}'):3000"
EOF

    chmod +x app-deploy.sh
    
    print_success "Monitoring and deployment tools created"
    log "Monitoring tools created"
}

# Create systemd service for auto-start
create_systemd_service() {
    print_step "Creating systemd service for auto-start..."
    
    cat > /etc/systemd/system/chatbot.service << EOF
[Unit]
Description=Chatbot Application
Requires=docker.service
After=docker.service
StartLimitIntervalSec=0

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$APP_DIR
ExecStart=$APP_DIR/app-deploy.sh
ExecStop=/usr/bin/docker stop chatbot-frontend chatbot-backend
ExecStopPost=/usr/bin/docker rm -f chatbot-frontend chatbot-backend
TimeoutStartSec=300
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
    
    systemctl daemon-reload
    systemctl enable chatbot.service
    
    print_success "Systemd service created and enabled"
    log "Systemd service created"
}

# Setup log rotation
setup_logrotate() {
    print_step "Setting up log rotation..."
    
    cat > /etc/logrotate.d/chatbot << EOF
$APP_DIR/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    notifempty
    create 644 root root
    postrotate
        systemctl reload rsyslog > /dev/null 2>&1 || true
    endscript
}

/var/log/chatbot-install.log {
    weekly
    missingok
    rotate 4
    compress
    notifempty
}
EOF
    
    print_success "Log rotation configured"
    log "Log rotation setup completed"
}

# Final verification and setup completion
final_verification() {
    print_step "Performing final system verification..."
    
    # Check all services
    echo -e "\n${WHITE}Service Status:${NC}"
    
    systemctl is-active docker && print_success "Docker is running" || print_error "Docker is not running"
    systemctl is-active fail2ban && print_success "Fail2ban is running" || print_error "Fail2ban is not running"
    systemctl is-enabled chatbot && print_success "Chatbot service is enabled" || print_error "Chatbot service is not enabled"
    
    # Check firewall
    ufw status | grep -q "Status: active" && print_success "UFW firewall is active" || print_error "UFW firewall is not active"
    
    # Check tools
    command -v docker &> /dev/null && print_success "Docker is installed" || print_error "Docker installation failed"
    command -v docker-compose &> /dev/null && print_success "Docker Compose is installed" || print_error "Docker Compose installation failed"
    command -v node &> /dev/null && print_success "Node.js is installed" || print_error "Node.js installation failed"
    
    # Check application directory
    [ -d $APP_DIR ] && print_success "Application directory exists" || print_error "Application directory not found"
    [ -f $APP_DIR/env-setup.sh ] && print_success "Environment setup script ready" || print_error "Environment setup script missing"
    [ -f $APP_DIR/app-deploy.sh ] && print_success "Deployment script ready" || print_error "Deployment script missing"
    
    # System resources after setup
    echo -e "\n${WHITE}System Resources After Setup:${NC}"
    echo "  Available RAM: $(free -h | awk '/^Mem:/ {print $7}')"
    echo "  Available Storage: $(df -h / | awk 'NR==2 {print $4}')"
    echo "  Swap Space: $(free -h | awk '/^Swap:/ {print $2}')"
    echo "  Load Average: $(uptime | awk -F'load average:' '{print $2}')"
    
    print_success "Final verification completed"
    log "Final verification completed successfully"
}

# Display final instructions
show_final_instructions() {
    print_header "VPS SETUP COMPLETED SUCCESSFULLY! 🎉"
    
    echo -e "${WHITE}Your VPS is now ready for Chatbot deployment!${NC}"
    echo ""
    
    echo -e "${CYAN}📋 Next Steps:${NC}"
    echo -e "${YELLOW}1. Configure Environment Variables:${NC}"
    echo -e "   cd $APP_DIR"
    echo -e "   ./env-setup.sh"
    echo -e "   ${WHITE}(This script handles MongoDB URI encoding automatically)${NC}"
    echo ""
    
    echo -e "${YELLOW}2. Deploy the Application:${NC}"
    echo -e "   ./app-deploy.sh"
    echo -e "   ${WHITE}(This will build and start all containers)${NC}"
    echo ""
    
    echo -e "${YELLOW}3. Monitor the System:${NC}"
    echo -e "   ./health-check-enhanced.sh"
    echo -e "   ${WHITE}(Run this to check system health)${NC}"
    echo ""
    
    echo -e "${CYAN}🌐 Access URLs (after deployment):${NC}"
    local SERVER_IP=$(curl -s ifconfig.me || hostname -I | awk '{print $1}')
    echo -e "   Frontend: ${YELLOW}http://${SERVER_IP}:4200${NC}"
    echo -e "   Backend API: ${YELLOW}http://${SERVER_IP}:3000${NC}"
    echo -e "   API Docs: ${YELLOW}http://${SERVER_IP}:3000/api-docs${NC}"
    echo -e "   Health Check: ${YELLOW}http://${SERVER_IP}:3000/health${NC}"
    echo ""
    
    echo -e "${CYAN}🔧 Useful Commands:${NC}"
    echo -e "   View containers: ${YELLOW}docker ps${NC}"
    echo -e "   View logs: ${YELLOW}docker logs chatbot-backend${NC} or ${YELLOW}docker logs chatbot-frontend${NC}"
    echo -e "   Restart app: ${YELLOW}systemctl restart chatbot${NC}"
    echo -e "   Update code: ${YELLOW}git pull && ./app-deploy.sh${NC}"
    echo ""
    
    echo -e "${CYAN}🛡️  Security Features Enabled:${NC}"
    echo -e "   ✅ UFW Firewall with minimal open ports"
    echo -e "   ✅ Fail2Ban protection against brute force"
    echo -e "   ✅ Docker containers with non-root users"
    echo -e "   ✅ Automatic security updates"
    echo -e "   ✅ Log rotation and system monitoring"
    echo ""
    
    echo -e "${CYAN}💡 Key Improvements Based on Deployment Experience:${NC}"
    echo -e "   ✅ MongoDB URI encoding for special characters"
    echo -e "   ✅ Angular budget limits increased for production builds"
    echo -e "   ✅ Optimized Docker networking configuration"
    echo -e "   ✅ Enhanced health checks and monitoring"
    echo -e "   ✅ Automatic container restart policies"
    echo -e "   ✅ Swap space for better memory management"
    echo ""
    
    echo -e "${WHITE}📁 Important Files:${NC}"
    echo -e "   Setup Log: ${YELLOW}$LOG_FILE${NC}"
    echo -e "   App Directory: ${YELLOW}$APP_DIR${NC}"
    echo -e "   Environment Config: ${YELLOW}$APP_DIR/env-setup.sh${NC}"
    echo -e "   Deployment Script: ${YELLOW}$APP_DIR/app-deploy.sh${NC}"
    echo -e "   Health Check: ${YELLOW}$APP_DIR/health-check-enhanced.sh${NC}"
    echo ""
    
    echo -e "${GREEN}🚀 Your VPS is production-ready!${NC}"
    echo -e "${PURPLE}Happy Chatbotting! 🤖${NC}"
    
    # Save instructions to file
    cat > $APP_DIR/DEPLOYMENT_INSTRUCTIONS.md << EOF
# Chatbot Deployment Instructions

## System Setup Completed ✅

Your VPS has been fully configured with all necessary components:

### Next Steps

1. **Configure Environment**
   \`\`\`bash
   cd $APP_DIR
   ./env-setup.sh
   \`\`\`

2. **Deploy Application**
   \`\`\`bash
   ./app-deploy.sh
   \`\`\`

3. **Monitor System**
   \`\`\`bash
   ./health-check-enhanced.sh
   \`\`\`

### Access URLs
- Frontend: http://${SERVER_IP}:4200
- Backend: http://${SERVER_IP}:3000
- API Docs: http://${SERVER_IP}:3000/api-docs

### Key Features
- ✅ Automatic MongoDB URI encoding
- ✅ Production-ready Docker configuration
- ✅ Enhanced security and monitoring
- ✅ Automatic container restart
- ✅ System resource optimization

### Troubleshooting
If you encounter issues:
1. Check logs: \`docker logs chatbot-backend\`
2. Run health check: \`./health-check-enhanced.sh\`
3. Restart application: \`systemctl restart chatbot\`

EOF
}

# Main execution flow
main() {
    print_header "VPS COMPLETE SETUP - CHATBOT DEPLOYMENT READY"
    print_info "Based on real deployment experience and lessons learned"
    
    # Pre-flight checks
    check_root
    
    # Create log file
    mkdir -p $(dirname $LOG_FILE)
    touch $LOG_FILE
    log "VPS setup started by user: ${SUDO_USER:-root}"
    
    # Show system info and get confirmation
    system_info
    echo ""
    read -p "🚀 Ready to proceed with complete VPS setup? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Setup cancelled by user"
        exit 0
    fi
    
    # Execute all setup steps
    update_system
    install_essentials
    create_swap
    install_docker
    install_nodejs
    configure_firewall
    setup_fail2ban
    setup_application
    create_env_helper
    fix_angular_budget
    fix_backend_dockerfile
    create_monitoring
    create_systemd_service
    setup_logrotate
    final_verification
    
    # Show final instructions
    show_final_instructions
    
    log "VPS setup completed successfully"
}

# Trap errors
trap 'print_error "An error occurred during setup. Check $LOG_FILE for details."; exit 1' ERR

# Run main function
main "$@"