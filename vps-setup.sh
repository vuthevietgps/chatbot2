#!/bin/bash

#############################################################################
# VPS DEEP CLEAN & CHATBOT INSTALLATION SCRIPT
# For Ubuntu 20.04+ / CentOS 8+ / Debian 11+
# Repository: https://github.com/vuthevietgps/chatbot2
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

# Detect OS
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$NAME
        VERSION=$VERSION_ID
    else
        print_error "Cannot detect OS. This script supports Ubuntu, CentOS, and Debian only."
        exit 1
    fi
    
    print_info "Detected OS: $OS $VERSION"
    log "OS Detection: $OS $VERSION"
}

# System information check
system_info() {
    print_step "Gathering system information..."
    
    echo -e "${WHITE}System Information:${NC}"
    echo "  Hostname: $(hostname)"
    echo "  OS: $OS $VERSION"
    echo "  Kernel: $(uname -r)"
    echo "  Architecture: $(uname -m)"
    echo "  CPU Cores: $(nproc)"
    echo "  Total RAM: $(free -h | awk '/^Mem:/ {print $2}')"
    echo "  Available Storage: $(df -h / | awk 'NR==2 {print $4}')"
    echo "  Public IP: $(curl -s ifconfig.me || echo 'Unable to detect')"
    echo "  Private IP: $(hostname -I | awk '{print $1}')"
    
    # Check minimum requirements
    RAM_GB=$(free -g | awk '/^Mem:/ {print $2}')
    DISK_GB=$(df --output=avail -BG / | tail -n1 | sed 's/G//')
    
    if [ $RAM_GB -lt 3 ]; then
        print_warning "RAM is ${RAM_GB}GB. Recommended minimum is 4GB."
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    if [ $DISK_GB -lt 20 ]; then
        print_warning "Available disk space is ${DISK_GB}GB. Recommended minimum is 50GB."
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# Backup existing configurations
backup_existing() {
    print_step "Creating backup of existing configurations..."
    
    mkdir -p $BACKUP_DIR
    
    # Backup important directories if they exist
    [ -d /etc/nginx ] && cp -r /etc/nginx $BACKUP_DIR/
    [ -d /etc/apache2 ] && cp -r /etc/apache2 $BACKUP_DIR/
    [ -d /opt/chatbot ] && cp -r /opt/chatbot $BACKUP_DIR/
    [ -f /etc/crontab ] && cp /etc/crontab $BACKUP_DIR/
    
    # Backup docker configurations
    [ -f /etc/docker/daemon.json ] && cp /etc/docker/daemon.json $BACKUP_DIR/
    
    print_success "Backup created at: $BACKUP_DIR"
    log "Backup created at: $BACKUP_DIR"
}

# Deep clean system
deep_clean() {
    print_step "Performing deep system cleanup..."
    
    # Stop all non-essential services
    print_info "Stopping unnecessary services..."
    systemctl stop apache2 2>/dev/null || true
    systemctl stop nginx 2>/dev/null || true
    systemctl stop mysql 2>/dev/null || true
    systemctl stop postgresql 2>/dev/null || true
    
    # Remove old packages and dependencies
    print_info "Removing unnecessary packages..."
    if command -v apt &> /dev/null; then
        apt autoremove -y
        apt autoclean
        apt clean
        
        # Remove common bloatware
        apt remove --purge -y \
            apache2* \
            mysql* \
            postgresql* \
            php* \
            sendmail* \
            exim4* \
            bind9* \
            samba* \
            cups* \
            avahi-daemon* \
            bluetooth* \
            2>/dev/null || true
            
    elif command -v yum &> /dev/null; then
        yum clean all
        yum autoremove -y
        
        # Remove common packages for CentOS/RHEL
        yum remove -y \
            httpd* \
            mysql* \
            postgresql* \
            php* \
            sendmail* \
            bind* \
            samba* \
            cups* \
            avahi* \
            bluetooth* \
            2>/dev/null || true
    fi
    
    # Clean system directories
    print_info "Cleaning system directories..."
    rm -rf /tmp/*
    rm -rf /var/tmp/*
    rm -rf /var/cache/apt/archives/*
    rm -rf /var/log/*.log
    rm -rf /var/log/*/*.log
    
    # Clean Docker if installed
    if command -v docker &> /dev/null; then
        print_info "Cleaning Docker system..."
        docker system prune -af --volumes 2>/dev/null || true
    fi
    
    # Clean old kernels (Ubuntu/Debian)
    if command -v apt &> /dev/null; then
        print_info "Removing old kernels..."
        apt autoremove --purge -y
    fi
    
    # Reset firewall rules
    print_info "Resetting firewall rules..."
    if command -v ufw &> /dev/null; then
        ufw --force reset
    elif command -v firewall-cmd &> /dev/null; then
        firewall-cmd --complete-reload
    fi
    
    print_success "Deep cleanup completed"
    log "Deep cleanup completed"
}

# Update system packages
update_system() {
    print_step "Updating system packages..."
    
    if command -v apt &> /dev/null; then
        apt update
        apt upgrade -y
        apt dist-upgrade -y
    elif command -v yum &> /dev/null; then
        yum update -y
        yum upgrade -y
    elif command -v dnf &> /dev/null; then
        dnf update -y
        dnf upgrade -y
    fi
    
    print_success "System packages updated"
    log "System packages updated"
}

# Install essential packages
install_essentials() {
    print_step "Installing essential packages..."
    
    if command -v apt &> /dev/null; then
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
            certbot \
            python3-certbot-nginx \
            software-properties-common \
            apt-transport-https \
            ca-certificates \
            gnupg \
            lsb-release
            
    elif command -v yum &> /dev/null; then
        yum install -y epel-release
        yum install -y \
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
            firewalld \
            certbot \
            python3-certbot-nginx
    fi
    
    print_success "Essential packages installed"
    log "Essential packages installed"
}

# Configure security
configure_security() {
    print_step "Configuring security settings..."
    
    # Configure fail2ban
    print_info "Setting up fail2ban..."
    systemctl enable fail2ban
    systemctl start fail2ban
    
    # Configure firewall
    print_info "Configuring firewall..."
    if command -v ufw &> /dev/null; then
        ufw --force reset
        ufw default deny incoming
        ufw default allow outgoing
        ufw allow ssh
        ufw allow 80/tcp
        ufw allow 443/tcp
        ufw allow 3000/tcp comment 'Chatbot Backend'
        ufw allow 9000/tcp comment 'Portainer'
        ufw --force enable
    elif command -v firewall-cmd &> /dev/null; then
        systemctl enable firewalld
        systemctl start firewalld
        firewall-cmd --permanent --add-service=ssh
        firewall-cmd --permanent --add-service=http
        firewall-cmd --permanent --add-service=https
        firewall-cmd --permanent --add-port=3000/tcp
        firewall-cmd --permanent --add-port=9000/tcp
        firewall-cmd --reload
    fi
    
    # Secure SSH (if not already done)
    print_info "Securing SSH configuration..."
    sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
    sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
    sed -i 's/#PubkeyAuthentication yes/PubkeyAuthentication yes/' /etc/ssh/sshd_config
    systemctl restart sshd
    
    # Set up automatic security updates
    if command -v apt &> /dev/null; then
        apt install -y unattended-upgrades
        dpkg-reconfigure -plow unattended-upgrades
    fi
    
    print_success "Security configuration completed"
    log "Security configuration completed"
}

# Install Docker
install_docker() {
    print_step "Installing Docker..."
    
    # Remove old versions
    if command -v apt &> /dev/null; then
        apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true
        
        # Add Docker's official GPG key
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
        
        # Add Docker repository
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
        
        apt update
        apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
        
    elif command -v yum &> /dev/null; then
        yum remove -y docker docker-client docker-client-latest docker-common docker-latest docker-latest-logrotate docker-logrotate docker-engine
        
        # Add Docker repository
        yum install -y yum-utils
        yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
        
        yum install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    fi
    
    # Configure Docker
    systemctl enable docker
    systemctl start docker
    
    # Add current user to docker group (if not root)
    if [ "$SUDO_USER" ]; then
        usermod -aG docker $SUDO_USER
        print_info "Added $SUDO_USER to docker group. Please re-login to use docker without sudo."
    fi
    
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
    "live-restore": true
}
EOF
    
    systemctl restart docker
    
    # Install Docker Compose (standalone)
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    
    # Verify installation
    docker --version
    docker-compose --version
    
    print_success "Docker installed successfully"
    log "Docker installed successfully"
}

# Install Node.js (for local development/debugging)
install_nodejs() {
    print_step "Installing Node.js..."
    
    # Install Node.js 18.x LTS
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    
    if command -v apt &> /dev/null; then
        apt install -y nodejs
    elif command -v yum &> /dev/null; then
        yum install -y nodejs npm
    fi
    
    # Verify installation
    node --version
    npm --version
    
    print_success "Node.js installed successfully"
    log "Node.js installed successfully"
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
    chmod +x *.sh 2>/dev/null || true
    
    # Create environment file
    if [ ! -f .env ]; then
        cp .env.example .env
        print_warning "Please edit .env file with your configuration:"
        print_info "nano $APP_DIR/.env"
    fi
    
    print_success "Application setup completed"
    log "Application setup completed at $APP_DIR"
}

# Setup monitoring and maintenance
setup_monitoring() {
    print_step "Setting up monitoring and maintenance..."
    
    # Create log directory
    mkdir -p /var/log/chatbot
    
    # Setup log rotation
    cat > /etc/logrotate.d/chatbot << EOF
/var/log/chatbot/*.log {
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

$APP_DIR/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    notifempty
    create 644 root root
}
EOF
    
    # Create maintenance script
    cat > $APP_DIR/maintenance.sh << 'EOF'
#!/bin/bash
# Daily maintenance script for Chatbot system

LOG_FILE="/var/log/chatbot/maintenance.log"

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a $LOG_FILE
}

log "=== Daily Maintenance Started ==="

# Update system packages (weekly)
if [ $(date +%u) -eq 1 ]; then
    log "Updating system packages..."
    apt update && apt upgrade -y
fi

# Clean Docker system
log "Cleaning Docker system..."
docker system prune -f

# Check disk usage
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    log "WARNING: Disk usage is ${DISK_USAGE}%"
    # Clean old logs
    find /var/log -name "*.log" -mtime +7 -delete
    find $APP_DIR/logs -name "*.log" -mtime +3 -delete
fi

# Check memory usage
MEM_USAGE=$(free | grep Mem | awk '{printf("%.1f", $3/$2 * 100.0)}')
log "Memory usage: ${MEM_USAGE}%"

# Restart containers if needed
if ! docker-compose -f $APP_DIR/docker-compose.yml ps | grep -q "Up"; then
    log "Restarting containers..."
    cd $APP_DIR && docker-compose restart
fi

# Backup database (if using local DB)
# Add your backup commands here

log "=== Daily Maintenance Completed ==="
EOF
    
    chmod +x $APP_DIR/maintenance.sh
    
    # Add to crontab
    (crontab -l 2>/dev/null; echo "0 2 * * * $APP_DIR/maintenance.sh") | crontab -
    
    # Create systemd service for chatbot
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
    
    systemctl daemon-reload
    systemctl enable chatbot.service
    
    print_success "Monitoring and maintenance setup completed"
    log "Monitoring and maintenance setup completed"
}

# Performance optimization
optimize_system() {
    print_step "Optimizing system performance..."
    
    # Kernel parameters optimization
    cat >> /etc/sysctl.conf << EOF

# Chatbot Performance Optimization
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.tcp_fin_timeout = 30
net.ipv4.tcp_keepalive_time = 1200
net.ipv4.tcp_max_tw_buckets = 400000
net.ipv4.tcp_tw_reuse = 1
net.ipv4.ip_local_port_range = 9000 65535
fs.file-max = 1000000
vm.swappiness = 10
vm.dirty_ratio = 15
vm.dirty_background_ratio = 5
EOF
    
    sysctl -p
    
    # Increase file limits
    cat >> /etc/security/limits.conf << EOF

# Chatbot file limits
* soft nofile 65535
* hard nofile 65535
* soft nproc 32768
* hard nproc 32768
EOF
    
    # Optimize Docker
    cat > /etc/docker/daemon.json << EOF
{
    "log-driver": "json-file",
    "log-opts": {
        "max-size": "10m",
        "max-file": "3"
    },
    "storage-driver": "overlay2",
    "live-restore": true,
    "max-concurrent-downloads": 10,
    "max-concurrent-uploads": 5,
    "default-ulimits": {
        "nofile": {
            "Hard": 64000,
            "Name": "nofile",
            "Soft": 64000
        }
    }
}
EOF
    
    systemctl restart docker
    
    print_success "System optimization completed"
    log "System optimization completed"
}

# Final verification
final_verification() {
    print_step "Performing final verification..."
    
    # Check services
    echo -e "\n${WHITE}Service Status:${NC}"
    systemctl is-active docker && print_success "Docker is running" || print_error "Docker is not running"
    systemctl is-active fail2ban && print_success "Fail2ban is running" || print_error "Fail2ban is not running"
    
    # Check firewall
    if command -v ufw &> /dev/null; then
        ufw status | grep -q "Status: active" && print_success "UFW firewall is active" || print_error "UFW firewall is not active"
    fi
    
    # Check Docker Compose
    docker-compose --version && print_success "Docker Compose is installed" || print_error "Docker Compose installation failed"
    
    # Check application directory
    [ -d $APP_DIR ] && print_success "Application directory exists" || print_error "Application directory not found"
    [ -f $APP_DIR/.env ] && print_success "Environment file exists" || print_warning "Environment file needs configuration"
    
    # System resources
    echo -e "\n${WHITE}System Resources After Setup:${NC}"
    echo "  Available RAM: $(free -h | awk '/^Mem:/ {print $7}')"
    echo "  Available Storage: $(df -h / | awk 'NR==2 {print $4}')"
    echo "  Load Average: $(uptime | awk -F'load average:' '{print $2}')"
    
    print_success "Final verification completed"
    log "Final verification completed"
}

# Display final instructions
show_final_instructions() {
    print_header "INSTALLATION COMPLETED SUCCESSFULLY! 🎉"
    
    echo -e "${WHITE}Next Steps:${NC}"
    echo -e "${CYAN}1. Configure Environment Variables:${NC}"
    echo -e "   ${YELLOW}nano $APP_DIR/.env${NC}"
    echo -e "   Fill in your MongoDB Atlas, OpenAI, and Facebook credentials"
    echo ""
    
    echo -e "${CYAN}2. Start the Application:${NC}"
    echo -e "   ${YELLOW}cd $APP_DIR${NC}"
    echo -e "   ${YELLOW}docker-compose up -d${NC}"
    echo ""
    
    echo -e "${CYAN}3. Access Your Application:${NC}"
    echo -e "   Frontend: ${YELLOW}http://$(curl -s ifconfig.me)${NC}"
    echo -e "   Backend API: ${YELLOW}http://$(curl -s ifconfig.me):3000${NC}"
    echo -e "   Portainer: ${YELLOW}http://$(curl -s ifconfig.me):9000${NC}"
    echo ""
    
    echo -e "${CYAN}4. Useful Commands:${NC}"
    echo -e "   View logs: ${YELLOW}docker-compose logs -f${NC}"
    echo -e "   Restart: ${YELLOW}docker-compose restart${NC}"
    echo -e "   Stop: ${YELLOW}docker-compose down${NC}"
    echo -e "   Update: ${YELLOW}git pull && docker-compose build && docker-compose up -d${NC}"
    echo ""
    
    echo -e "${CYAN}5. Security Notes:${NC}"
    echo -e "   - SSH root login is disabled"
    echo -e "   - Firewall is configured with essential ports only"
    echo -e "   - Fail2ban is active for brute force protection"
    echo -e "   - System updates are automated"
    echo ""
    
    echo -e "${WHITE}System Information:${NC}"
    echo -e "   Installation Log: ${YELLOW}$LOG_FILE${NC}"
    echo -e "   Application Directory: ${YELLOW}$APP_DIR${NC}"
    echo -e "   Backup Directory: ${YELLOW}$BACKUP_DIR${NC}"
    echo -e "   Maintenance Script: ${YELLOW}$APP_DIR/maintenance.sh${NC}"
    echo ""
    
    echo -e "${GREEN}✅ Your VPS is now ready for production deployment!${NC}"
    echo -e "${PURPLE}🤖 Happy Chatbotting!${NC}"
}

# Main execution flow
main() {
    print_header "VPS DEEP CLEAN & CHATBOT INSTALLATION"
    
    # Pre-flight checks
    check_root
    detect_os
    
    # Create log file
    touch $LOG_FILE
    log "Installation started by user: ${SUDO_USER:-root}"
    
    # Show system info and get confirmation
    system_info
    echo ""
    read -p "🚀 Ready to proceed with installation? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Installation cancelled by user"
        exit 0
    fi
    
    # Execute installation steps
    backup_existing
    deep_clean
    update_system
    install_essentials
    configure_security
    install_docker
    install_nodejs
    setup_application
    setup_monitoring
    optimize_system
    final_verification
    
    # Show final instructions
    show_final_instructions
    
    log "Installation completed successfully"
}

# Trap errors
trap 'print_error "An error occurred during installation. Check $LOG_FILE for details."; exit 1' ERR

# Run main function
main "$@"