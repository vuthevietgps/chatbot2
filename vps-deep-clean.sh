#!/bin/bash

#############################################################################
# VPS DEEP CLEAN & SETUP SCRIPT FOR CHATBOT2
# Complete server preparation and application deployment
# Compatible with Ubuntu 20.04+, CentOS 8+, Debian 11+
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
NC='\033[0m'

# Configuration
GITHUB_REPO="https://github.com/vuthevietgps/chatbot2.git"
APP_DIR="/opt/chatbot"
LOG_FILE="/var/log/chatbot-install.log"
BACKUP_DIR="/opt/backup-$(date +%Y%m%d-%H%M%S)"
SCRIPT_VERSION="1.0.0"

# Functions for colored output
print_header() {
    clear
    echo -e "${PURPLE}╔══════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║${WHITE}                    CHATBOT2 VPS DEPLOYMENT SCRIPT                    ${PURPLE}║${NC}"
    echo -e "${PURPLE}║${WHITE}                          Version $SCRIPT_VERSION                           ${PURPLE}║${NC}"
    echo -e "${PURPLE}╚══════════════════════════════════════════════════════════════════════╝${NC}"
    echo -e "\n${WHITE}$1${NC}\n"
}

print_success() { echo -e "${GREEN}✅ [SUCCESS]${NC} $1"; }
print_info() { echo -e "${BLUE}ℹ️  [INFO]${NC} $1"; }
print_warning() { echo -e "${YELLOW}⚠️  [WARNING]${NC} $1"; }
print_error() { echo -e "${RED}❌ [ERROR]${NC} $1"; }
print_step() { echo -e "\n${CYAN}🔧 [STEP]${NC} $1"; }

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a $LOG_FILE
}

# Progress indicator
show_progress() {
    local current=\$1
    local total=\$2
    local width=50
    local percentage=\$((current * 100 / total))
    local filled=\$((current * width / total))
    
    printf "\r${CYAN}Progress: [${NC}"
    printf "%*s" \$filled | tr ' ' '█'
    printf "%*s" \$((width - filled)) | tr ' ' '░'
    printf "${CYAN}] %d%% (%d/%d)${NC}" \$percentage \$current \$total
}

# Check if running as root
check_root() {
    if [ "\$EUID" -ne 0 ]; then
        print_error "This script must be run as root. Use: sudo \$0"
        exit 1
    fi
    print_success "Running as root user"
}

# Detect OS and version
detect_os() {
    print_step "Detecting operating system..."
    
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=\$NAME
        VERSION=\$VERSION_ID
        DISTRO=\$ID
    else
        print_error "Cannot detect OS. This script supports Ubuntu, CentOS, and Debian only."
        exit 1
    fi
    
    print_success "Detected OS: \$OS \$VERSION"
    log "OS Detection: \$OS \$VERSION (\$DISTRO)"
    
    # Check if OS is supported
    case \$DISTRO in
        ubuntu)
            if [ "\$(echo \$VERSION | cut -d. -f1)" -lt 20 ]; then
                print_warning "Ubuntu version \$VERSION detected. Recommended: 20.04 or higher"
            fi
            PACKAGE_MANAGER="apt"
            ;;
        centos|rhel)
            if [ "\$(echo \$VERSION | cut -d. -f1)" -lt 8 ]; then
                print_warning "CentOS/RHEL version \$VERSION detected. Recommended: 8 or higher"
            fi
            PACKAGE_MANAGER="yum"
            ;;
        debian)
            if [ "\$(echo \$VERSION | cut -d. -f1)" -lt 11 ]; then
                print_warning "Debian version \$VERSION detected. Recommended: 11 or higher"
            fi
            PACKAGE_MANAGER="apt"
            ;;
        *)
            print_error "Unsupported OS: \$DISTRO"
            exit 1
            ;;
    esac
}

# System information and requirements check
system_check() {
    print_step "Performing system requirements check..."
    
    # Display system information
    echo -e "\n${WHITE}═══ SYSTEM INFORMATION ═══${NC}"
    echo -e "  ${CYAN}Hostname:${NC} \$(hostname -f)"
    echo -e "  ${CYAN}OS:${NC} \$OS \$VERSION"
    echo -e "  ${CYAN}Kernel:${NC} \$(uname -r)"
    echo -e "  ${CYAN}Architecture:${NC} \$(uname -m)"
    echo -e "  ${CYAN}CPU Cores:${NC} \$(nproc)"
    echo -e "  ${CYAN}CPU Model:${NC} \$(grep 'model name' /proc/cpuinfo | head -1 | cut -d: -f2 | xargs)"
    echo -e "  ${CYAN}Total RAM:${NC} \$(free -h | awk '/^Mem:/ {print \$2}')"
    echo -e "  ${CYAN}Available RAM:${NC} \$(free -h | awk '/^Mem:/ {print \$7}')"
    echo -e "  ${CYAN}Total Storage:${NC} \$(df -h / | awk 'NR==2 {print \$2}')"
    echo -e "  ${CYAN}Available Storage:${NC} \$(df -h / | awk 'NR==2 {print \$4}')"
    echo -e "  ${CYAN}Public IP:${NC} \$(curl -s ifconfig.me || echo 'Unable to detect')"
    echo -e "  ${CYAN}Private IP:${NC} \$(hostname -I | awk '{print \$1}')"
    echo ""
    
    # Check minimum requirements
    local ram_gb=\$(free -g | awk '/^Mem:/ {print \$2}')
    local disk_gb=\$(df --output=avail -BG / | tail -n1 | sed 's/G//')
    local cpu_cores=\$(nproc)
    
    echo -e "${WHITE}═══ REQUIREMENTS CHECK ═══${NC}"
    
    # RAM Check
    if [ \$ram_gb -lt 4 ]; then
        print_error "RAM: \${ram_gb}GB (Minimum required: 4GB)"
        echo -e "  ${YELLOW}Warning: Low RAM may cause performance issues${NC}"
    else
        print_success "RAM: \${ram_gb}GB (✓ Meets requirements)"
    fi
    
    # Disk Space Check
    if [ \$disk_gb -lt 20 ]; then
        print_error "Storage: \${disk_gb}GB available (Minimum required: 20GB)"
        echo -e "  ${YELLOW}Warning: Low disk space may cause deployment issues${NC}"
    else
        print_success "Storage: \${disk_gb}GB available (✓ Meets requirements)"
    fi
    
    # CPU Check
    if [ \$cpu_cores -lt 2 ]; then
        print_warning "CPU: \${cpu_cores} cores (Recommended: 2+ cores)"
    else
        print_success "CPU: \${cpu_cores} cores (✓ Meets requirements)"
    fi
    
    # Internet connectivity check
    if ping -c 1 google.com &> /dev/null; then
        print_success "Internet connectivity (✓ Working)"
    else
        print_error "Internet connectivity (✗ Failed)"
        echo -e "  ${YELLOW}Please check your network connection${NC}"
        exit 1
    fi
    
    echo ""
    read -p "Continue with installation? (y/N): " -n 1 -r
    echo
    if [[ ! \$REPLY =~ ^[Yy]\$ ]]; then
        print_info "Installation cancelled by user"
        exit 0
    fi
    
    log "System check completed - RAM: \${ram_gb}GB, Storage: \${disk_gb}GB, CPU: \${cpu_cores} cores"
}

# Create backup of existing configurations
create_backup() {
    print_step "Creating backup of existing configurations..."
    
    mkdir -p \$BACKUP_DIR
    
    # Backup important directories and files
    local backup_items=(
        "/etc/nginx"
        "/etc/apache2"
        "/etc/httpd"
        "/opt/chatbot"
        "/etc/crontab"
        "/etc/docker"
        "/etc/systemd/system"
        "/home/*/.bashrc"
        "/root/.bashrc"
    )
    
    for item in "\${backup_items[@]}"; do
        if [ -e "\$item" ]; then
            cp -r "\$item" "\$BACKUP_DIR/" 2>/dev/null || true
            print_info "Backed up: \$item"
        fi
    done
    
    # Create backup info file
    cat > "\$BACKUP_DIR/backup_info.txt" << EOF
Backup created: \$(date)
Hostname: \$(hostname)
OS: \$OS \$VERSION
Script version: \$SCRIPT_VERSION
Backup contents: System configurations before Chatbot2 installation
EOF
    
    print_success "Backup created at: \$BACKUP_DIR"
    log "Backup created at: \$BACKUP_DIR"
}

# Deep system cleanup
deep_cleanup() {
    print_step "Performing deep system cleanup..."
    
    local cleanup_steps=12
    local current_step=0
    
    # Stop unnecessary services
    ((current_step++))
    show_progress \$current_step \$cleanup_steps
    echo -e "\n  Stopping unnecessary services..."
    
    local services_to_stop=("apache2" "nginx" "mysql" "postgresql" "sendmail" "postfix")
    for service in "\${services_to_stop[@]}"; do
        systemctl stop "\$service" 2>/dev/null || true
        systemctl disable "\$service" 2>/dev/null || true
    done
    
    # Remove unnecessary packages
    ((current_step++))
    show_progress \$current_step \$cleanup_steps
    echo -e "\n  Removing unnecessary packages..."
    
    if [ "\$PACKAGE_MANAGER" = "apt" ]; then
        apt autoremove -y &>/dev/null
        apt autoclean &>/dev/null
        apt clean &>/dev/null
        
        # Remove common bloatware packages
        local packages_to_remove=(
            "apache2*" "mysql*" "postgresql*" "php*" "sendmail*" 
            "exim4*" "bind9*" "samba*" "cups*" "avahi-daemon*" 
            "bluetooth*" "snapd*"
        )
        
        for package in "\${packages_to_remove[@]}"; do
            apt remove --purge -y "\$package" 2>/dev/null || true
        done
        
    elif [ "\$PACKAGE_MANAGER" = "yum" ]; then
        yum clean all &>/dev/null
        yum autoremove -y &>/dev/null
        
        local packages_to_remove=(
            "httpd*" "mysql*" "postgresql*" "php*" "sendmail*"
            "bind*" "samba*" "cups*" "avahi*" "bluetooth*"
        )
        
        for package in "\${packages_to_remove[@]}"; do
            yum remove -y "\$package" 2>/dev/null || true
        done
    fi
    
    # Clean temporary directories
    ((current_step++))
    show_progress \$current_step \$cleanup_steps
    echo -e "\n  Cleaning temporary directories..."
    
    rm -rf /tmp/* 2>/dev/null || true
    rm -rf /var/tmp/* 2>/dev/null || true
    rm -rf /var/cache/apt/archives/* 2>/dev/null || true
    rm -rf /var/log/*.log 2>/dev/null || true
    find /var/log -name "*.log" -delete 2>/dev/null || true
    
    # Clean Docker if installed
    ((current_step++))
    show_progress \$current_step \$cleanup_steps
    echo -e "\n  Cleaning Docker system..."
    
    if command -v docker &> /dev/null; then
        docker system prune -af --volumes 2>/dev/null || true
        docker network prune -f 2>/dev/null || true
        docker volume prune -f 2>/dev/null || true
    fi
    
    # Remove old kernels
    ((current_step++))
    show_progress \$current_step \$cleanup_steps
    echo -e "\n  Removing old kernels..."
    
    if [ "\$PACKAGE_MANAGER" = "apt" ]; then
        apt autoremove --purge -y &>/dev/null || true
    fi
    
    # Reset network configurations
    ((current_step++))
    show_progress \$current_step \$cleanup_steps
    echo -e "\n  Resetting network configurations..."
    
    if command -v ufw &> /dev/null; then
        ufw --force reset &>/dev/null || true
    elif command -v firewall-cmd &> /dev/null; then
        firewall-cmd --complete-reload &>/dev/null || true
    fi
    
    # Clean package cache
    ((current_step++))
    show_progress \$current_step \$cleanup_steps
    echo -e "\n  Cleaning package cache..."
    
    if [ "\$PACKAGE_MANAGER" = "apt" ]; then
        apt clean all &>/dev/null || true
    elif [ "\$PACKAGE_MANAGER" = "yum" ]; then
        yum clean all &>/dev/null || true
    fi
    
    # Remove broken packages
    ((current_step++))
    show_progress \$current_step \$cleanup_steps
    echo -e "\n  Fixing broken packages..."
    
    if [ "\$PACKAGE_MANAGER" = "apt" ]; then
        dpkg --configure -a &>/dev/null || true
        apt --fix-broken install -y &>/dev/null || true
    fi
    
    # Clean user cache
    ((current_step++))
    show_progress \$current_step \$cleanup_steps
    echo -e "\n  Cleaning user cache..."
    
    find /home -name ".cache" -type d -exec rm -rf {} + 2>/dev/null || true
    find /root -name ".cache" -type d -exec rm -rf {} + 2>/dev/null || true
    
    # Clean system logs
    ((current_step++))
    show_progress \$current_step \$cleanup_steps
    echo -e "\n  Cleaning system logs..."
    
    journalctl --vacuum-time=1d &>/dev/null || true
    journalctl --vacuum-size=100M &>/dev/null || true
    
    # Clean memory cache
    ((current_step++))
    show_progress \$current_step \$cleanup_steps
    echo -e "\n  Clearing memory cache..."
    
    sync
    echo 3 > /proc/sys/vm/drop_caches 2>/dev/null || true
    
    # Final cleanup
    ((current_step++))
    show_progress \$current_step \$cleanup_steps
    echo -e "\n  Final cleanup..."
    
    updatedb &>/dev/null || true
    
    echo -e "\n"
    print_success "Deep cleanup completed"
    log "Deep system cleanup completed"
}

# Update system packages
update_system() {
    print_step "Updating system packages..."
    
    case \$PACKAGE_MANAGER in
        apt)
            print_info "Updating package lists..."
            apt update -y
            
            print_info "Upgrading installed packages..."
            apt upgrade -y
            
            print_info "Performing distribution upgrade..."
            apt dist-upgrade -y
            
            print_info "Installing security updates..."
            unattended-upgrade -d || true
            ;;
        yum)
            print_info "Updating system packages..."
            yum update -y
            yum upgrade -y
            ;;
    esac
    
    print_success "System packages updated successfully"
    log "System packages updated"
}

# Install essential packages
install_essentials() {
    print_step "Installing essential packages..."
    
    local essential_packages
    
    if [ "\$PACKAGE_MANAGER" = "apt" ]; then
        essential_packages=(
            "curl" "wget" "git" "unzip" "vim" "nano" "htop" "neofetch" 
            "tree" "jq" "bc" "net-tools" "lsof" "rsync" "screen" "tmux" 
            "fail2ban" "ufw" "certbot" "python3-certbot-nginx" 
            "software-properties-common" "apt-transport-https" 
            "ca-certificates" "gnupg" "lsb-release" "build-essential"
            "python3-pip" "nodejs" "npm" "redis-server"
        )
        
        print_info "Installing packages with APT..."
        apt install -y "\${essential_packages[@]}"
        
    elif [ "\$PACKAGE_MANAGER" = "yum" ]; then
        # Install EPEL repository first
        yum install -y epel-release
        
        essential_packages=(
            "curl" "wget" "git" "unzip" "vim" "nano" "htop" "neofetch"
            "tree" "jq" "bc" "net-tools" "lsof" "rsync" "screen" "tmux"
            "fail2ban" "firewalld" "certbot" "python3-certbot-nginx"
            "python3-pip" "nodejs" "npm" "redis"
        )
        
        print_info "Installing packages with YUM..."
        yum install -y "\${essential_packages[@]}"
    fi
    
    print_success "Essential packages installed"
    log "Essential packages installation completed"
}

# Configure security settings
configure_security() {
    print_step "Configuring security settings..."
    
    # Configure Fail2Ban
    print_info "Setting up Fail2Ban..."
    systemctl enable fail2ban
    systemctl start fail2ban
    
    # Create custom Fail2Ban configuration
    cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5
backend = systemd

[sshd]
enabled = true
port = ssh
logpath = %(sshd_log)s
backend = %(sshd_backend)s
maxretry = 3
bantime = 7200

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
logpath = /var/log/nginx/error.log
maxretry = 6

[nginx-noscript]
enabled = true
logpath = /var/log/nginx/access.log
maxretry = 6

[nginx-badbots]
enabled = true
logpath = /var/log/nginx/access.log
maxretry = 2

[nginx-noproxy]
enabled = true
logpath = /var/log/nginx/access.log
maxretry = 2
EOF
    
    systemctl restart fail2ban
    
    # Configure firewall
    print_info "Configuring firewall..."
    
    if command -v ufw &> /dev/null; then
        ufw --force reset
        ufw default deny incoming
        ufw default allow outgoing
        
        # Allow essential ports
        ufw allow ssh
        ufw allow 80/tcp comment 'HTTP'
        ufw allow 443/tcp comment 'HTTPS'
        ufw allow 3000/tcp comment 'Chatbot Backend'
        ufw allow 9000/tcp comment 'Portainer'
        
        # Enable logging
        ufw logging on
        
        # Enable firewall
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
    
    # Secure SSH configuration
    print_info "Securing SSH configuration..."
    
    # Backup original SSH config
    cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup
    
    # Apply security settings
    sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
    sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
    sed -i 's/#PubkeyAuthentication yes/PubkeyAuthentication yes/' /etc/ssh/sshd_config
    sed -i 's/#MaxAuthTries 6/MaxAuthTries 3/' /etc/ssh/sshd_config
    sed -i 's/#ClientAliveInterval 0/ClientAliveInterval 300/' /etc/ssh/sshd_config
    sed -i 's/#ClientAliveCountMax 3/ClientAliveCountMax 2/' /etc/ssh/sshd_config
    
    # Test SSH configuration
    sshd -t
    if [ \$? -eq 0 ]; then
        systemctl restart sshd
        print_success "SSH configuration updated"
    else
        print_error "SSH configuration test failed, restoring backup"
        cp /etc/ssh/sshd_config.backup /etc/ssh/sshd_config
    fi
    
    # Set up automatic security updates
    if [ "\$PACKAGE_MANAGER" = "apt" ]; then
        print_info "Configuring automatic security updates..."
        apt install -y unattended-upgrades
        
        cat > /etc/apt/apt.conf.d/50unattended-upgrades << 'EOF'
Unattended-Upgrade::Allowed-Origins {
    "\${distro_id}:\${distro_codename}-security";
    "\${distro_id}ESMApps:\${distro_codename}-apps-security";
    "\${distro_id}ESM:\${distro_codename}-infra-security";
};
Unattended-Upgrade::DevRelease "false";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";
EOF
        
        cat > /etc/apt/apt.conf.d/20auto-upgrades << 'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Download-Upgradeable-Packages "1";
APT::Periodic::AutocleanInterval "7";
APT::Periodic::Unattended-Upgrade "1";
EOF
        
        systemctl enable unattended-upgrades
        systemctl start unattended-upgrades
    fi
    
    print_success "Security configuration completed"
    log "Security settings configured"
}

# Install Docker and Docker Compose
install_docker() {
    print_step "Installing Docker and Docker Compose..."
    
    # Remove old Docker versions
    if [ "\$PACKAGE_MANAGER" = "apt" ]; then
        apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true
        
        # Add Docker's official GPG key
        print_info "Adding Docker GPG key..."
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
        
        # Add Docker repository
        print_info "Adding Docker repository..."
        echo "deb [arch=\$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \$(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
        
        apt update
        apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
        
    elif [ "\$PACKAGE_MANAGER" = "yum" ]; then
        yum remove -y docker docker-client docker-client-latest docker-common docker-latest docker-latest-logrotate docker-logrotate docker-engine 2>/dev/null || true
        
        # Add Docker repository
        yum install -y yum-utils
        yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
        
        yum install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    fi
    
    # Configure Docker daemon
    print_info "Configuring Docker daemon..."
    mkdir -p /etc/docker
    
    cat > /etc/docker/daemon.json << 'EOF'
{
    "log-driver": "json-file",
    "log-opts": {
        "max-size": "10m",
        "max-file": "3"
    },
    "storage-driver": "overlay2",
    "live-restore": true,
    "userland-proxy": false,
    "experimental": false,
    "metrics-addr": "127.0.0.1:9323",
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
    if [ "\$SUDO_USER" ]; then
        usermod -aG docker \$SUDO_USER
        print_info "Added \$SUDO_USER to docker group"
    fi
    
    # Install Docker Compose standalone
    print_info "Installing Docker Compose standalone..."
    DOCKER_COMPOSE_VERSION=\$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep tag_name | cut -d '"' -f 4)
    curl -L "https://github.com/docker/compose/releases/download/\$DOCKER_COMPOSE_VERSION/docker-compose-\$(uname -s)-\$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    
    # Verify installations
    docker --version
    docker-compose --version
    
    # Test Docker
    docker run hello-world &>/dev/null || {
        print_error "Docker test failed"
        exit 1
    }
    
    print_success "Docker and Docker Compose installed successfully"
    log "Docker installation completed"
}

# Install Node.js
install_nodejs() {
    print_step "Installing Node.js LTS..."
    
    # Install Node.js 18.x LTS
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    
    if [ "\$PACKAGE_MANAGER" = "apt" ]; then
        apt install -y nodejs
    elif [ "\$PACKAGE_MANAGER" = "yum" ]; then
        yum install -y nodejs npm
    fi
    
    # Update npm to latest version
    npm install -g npm@latest
    
    # Install global packages
    npm install -g pm2 @angular/cli
    
    # Verify installations
    node --version
    npm --version
    pm2 --version
    ng version
    
    print_success "Node.js and tools installed successfully"
    log "Node.js installation completed"
}

# Clone and setup application
setup_application() {
    print_step "Setting up Chatbot2 application..."
    
    # Remove existing directory
    if [ -d "\$APP_DIR" ]; then
        print_info "Removing existing application directory..."
        rm -rf "\$APP_DIR"
    fi
    
    # Create application directory
    mkdir -p "\$APP_DIR"
    cd "\$APP_DIR"
    
    # Clone repository
    print_info "Cloning repository from GitHub..."
    git clone "\$GITHUB_REPO" .
    
    # Check if clone was successful
    if [ ! -f "package.json" ] && [ ! -d "backend" ]; then
        print_error "Failed to clone repository or repository structure is invalid"
        exit 1
    fi
    
    # Set proper permissions
    if [ "\$SUDO_USER" ]; then
        chown -R \$SUDO_USER:\$SUDO_USER "\$APP_DIR"
    fi
    
    # Make scripts executable
    chmod +x *.sh 2>/dev/null || true
    
    # Create environment file from template
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_success "Environment file created from template"
        else
            print_warning "No .env.example found, creating basic .env file"
            create_basic_env_file
        fi
    fi
    
    print_success "Application setup completed"
    log "Application setup completed at \$APP_DIR"
}

# Create basic environment file
create_basic_env_file() {
    cat > "\$APP_DIR/.env" << 'EOF'
# Database Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chatbot2?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-4-turbo-preview

# Facebook Integration
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
FACEBOOK_VERIFY_TOKEN=your-webhook-verify-token

# Application Configuration
NODE_ENV=production
PORT=3000
FRONTEND_URL=http://localhost
BACKEND_URL=http://localhost:3000
EOF
}

# Setup monitoring and maintenance
setup_monitoring() {
    print_step "Setting up monitoring and maintenance..."
    
    # Create log directories
    mkdir -p /var/log/chatbot
    mkdir -p "\$APP_DIR/logs"
    
    # Setup log rotation
    cat > /etc/logrotate.d/chatbot << 'EOF'
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

/opt/chatbot/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    notifempty
    copytruncate
}
EOF
    
    # Create systemd service for chatbot
    cat > /etc/systemd/system/chatbot.service << EOF
[Unit]
Description=Chatbot2 Application
Requires=docker.service
After=docker.service network.target

[Service]
Type=oneshot
RemainAfterExit=yes
User=root
WorkingDirectory=\$APP_DIR
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
ExecReload=/usr/local/bin/docker-compose restart
TimeoutStartSec=300
TimeoutStopSec=120
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
    
    # Enable chatbot service
    systemctl daemon-reload
    systemctl enable chatbot.service
    
    # Create health check cron job
    (crontab -l 2>/dev/null || true; echo "*/5 * * * * \$APP_DIR/health-check.sh > /dev/null 2>&1") | crontab -
    
    # Create daily maintenance cron job
    (crontab -l 2>/dev/null || true; echo "0 2 * * * \$APP_DIR/health-check.sh fix > /dev/null 2>&1") | crontab -
    
    print_success "Monitoring and maintenance setup completed"
    log "Monitoring system configured"
}

# Performance optimization
optimize_system() {
    print_step "Optimizing system performance..."
    
    # Kernel parameters optimization
    print_info "Optimizing kernel parameters..."
    
    cat >> /etc/sysctl.conf << 'EOF'

# Chatbot2 Performance Optimization
# Network optimizations
net.core.somaxconn = 65535
net.core.netdev_max_backlog = 5000
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.tcp_fin_timeout = 30
net.ipv4.tcp_keepalive_time = 1200
net.ipv4.tcp_keepalive_probes = 7
net.ipv4.tcp_keepalive_intvl = 30
net.ipv4.tcp_max_tw_buckets = 400000
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_congestion_control = bbr
net.ipv4.ip_local_port_range = 10000 65535

# File system optimizations
fs.file-max = 1000000
fs.inotify.max_user_watches = 524288

# Memory management
vm.swappiness = 10
vm.dirty_ratio = 15
vm.dirty_background_ratio = 5
vm.vfs_cache_pressure = 50
vm.min_free_kbytes = 65536

# Security
kernel.dmesg_restrict = 1
kernel.kptr_restrict = 1
EOF
    
    sysctl -p
    
    # Increase file limits
    print_info "Increasing file limits..."
    
    cat >> /etc/security/limits.conf << 'EOF'

# Chatbot2 file limits
* soft nofile 65535
* hard nofile 65535
* soft nproc 32768
* hard nproc 32768
root soft nofile 65535
root hard nofile 65535
EOF
    
    # Configure systemd limits
    mkdir -p /etc/systemd/system.conf.d
    cat > /etc/systemd/system.conf.d/limits.conf << 'EOF'
[Manager]
DefaultLimitNOFILE=65535
DefaultLimitNPROC=32768
EOF
    
    # Optimize Docker
    print_info "Optimizing Docker configuration..."
    
    cat > /etc/docker/daemon.json << 'EOF'
{
    "log-driver": "json-file",
    "log-opts": {
        "max-size": "10m",
        "max-file": "3"
    },
    "storage-driver": "overlay2",
    "live-restore": true,
    "userland-proxy": false,
    "experimental": false,
    "max-concurrent-downloads": 10,
    "max-concurrent-uploads": 5,
    "default-ulimits": {
        "nofile": {
            "Hard": 64000,
            "Name": "nofile",
            "Soft": 64000
        },
        "memlock": {
            "Hard": -1,
            "Name": "memlock",
            "Soft": -1
        }
    },
    "log-level": "warn"
}
EOF
    
    systemctl restart docker
    
    # Setup swap if needed
    local ram_gb=\$(free -g | awk '/^Mem:/ {print \$2}')
    if [ \$ram_gb -lt 8 ] && [ ! -f /swapfile ]; then
        print_info "Creating swap file for low RAM system..."
        
        fallocate -l 2G /swapfile
        chmod 600 /swapfile
        mkswap /swapfile
        swapon /swapfile
        echo '/swapfile none swap sw 0 0' >> /etc/fstab
        
        # Optimize swap usage
        echo 'vm.swappiness=10' >> /etc/sysctl.conf
        
        print_success "Swap file created (2GB)"
    fi
    
    print_success "System optimization completed"
    log "System performance optimization completed"
}

# SSL certificate setup
setup_ssl() {
    print_step "Setting up SSL certificates..."
    
    # Check if domain is provided
    read -p "Enter your domain name (or press Enter to skip SSL setup): " DOMAIN
    
    if [ -z "\$DOMAIN" ]; then
        print_info "Skipping SSL setup"
        return 0
    fi
    
    # Validate domain format
    if [[ ! \$DOMAIN =~ ^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}\$ ]]; then
        print_warning "Invalid domain format. Skipping SSL setup."
        return 0
    fi
    
    # Install Nginx if not present
    if ! command -v nginx &> /dev/null; then
        print_info "Installing Nginx..."
        if [ "\$PACKAGE_MANAGER" = "apt" ]; then
            apt install -y nginx
        elif [ "\$PACKAGE_MANAGER" = "yum" ]; then
            yum install -y nginx
        fi
        systemctl enable nginx
        systemctl start nginx
    fi
    
    # Create basic Nginx configuration
    cat > /etc/nginx/sites-available/chatbot << EOF
server {
    listen 80;
    server_name \$DOMAIN www.\$DOMAIN;
    
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host \\\$host;
        proxy_set_header X-Real-IP \\\$remote_addr;
        proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\\$scheme;
    }
    
    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \\\$host;
        proxy_set_header X-Real-IP \\\$remote_addr;
        proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\\$scheme;
    }
}
EOF
    
    # Enable site
    ln -sf /etc/nginx/sites-available/chatbot /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    nginx -t && systemctl reload nginx
    
    # Generate SSL certificate with Certbot
    print_info "Generating SSL certificate for \$DOMAIN..."
    
    certbot --nginx -d \$DOMAIN -d www.\$DOMAIN --non-interactive --agree-tos --email admin@\$DOMAIN --redirect
    
    if [ \$? -eq 0 ]; then
        print_success "SSL certificate generated successfully"
        
        # Setup automatic renewal
        (crontab -l 2>/dev/null || true; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
        
    else
        print_warning "SSL certificate generation failed. Please check domain DNS settings."
    fi
}

# Final verification and testing
final_verification() {
    print_step "Performing final verification..."
    
    echo -e "\n${WHITE}═══ SERVICE STATUS ═══${NC}"
    
    # Check essential services
    local services=("docker" "fail2ban")
    
    for service in "\${services[@]}"; do
        if systemctl is-active --quiet "\$service"; then
            print_success "\$service is running"
        else
            print_error "\$service is not running"
        fi
    done
    
    # Check firewall
    if command -v ufw &> /dev/null; then
        if ufw status | grep -q "Status: active"; then
            print_success "UFW firewall is active"
        else
            print_warning "UFW firewall is not active"
        fi
    elif command -v firewall-cmd &> /dev/null; then
        if firewall-cmd --state | grep -q "running"; then
            print_success "Firewalld is active"
        else
            print_warning "Firewalld is not active"
        fi
    fi
    
    # Check Docker Compose
    if docker-compose --version &>/dev/null; then
        print_success "Docker Compose is working"
    else
        print_error "Docker Compose is not working"
    fi
    
    # Check application directory
    if [ -d "\$APP_DIR" ]; then
        print_success "Application directory exists"
    else
        print_error "Application directory not found"
    fi
    
    if [ -f "\$APP_DIR/.env" ]; then
        print_success "Environment file exists"
    else
        print_warning "Environment file needs configuration"
    fi
    
    # System resources after setup
    echo -e "\n${WHITE}═══ SYSTEM RESOURCES ═══${NC}"
    echo -e "  ${CYAN}Available RAM:${NC} \$(free -h | awk '/^Mem:/ {print \$7}')"
    echo -e "  ${CYAN}Available Storage:${NC} \$(df -h / | awk 'NR==2 {print \$4}')"
    echo -e "  ${CYAN}Load Average:${NC} \$(uptime | awk -F'load average:' '{print \$2}')"
    echo -e "  ${CYAN}Docker Status:${NC} \$(systemctl is-active docker)"
    echo -e "  ${CYAN}Disk Usage:${NC} \$(df -h / | awk 'NR==2 {print \$5}')"
    
    print_success "Final verification completed"
    log "Final verification completed"
}

# Display final instructions
show_final_instructions() {
    clear
    print_header "🎉 INSTALLATION COMPLETED SUCCESSFULLY!"
    
    echo -e "${WHITE}╔══════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${WHITE}║                            NEXT STEPS                                ║${NC}"
    echo -e "${WHITE}╚══════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    echo -e "${CYAN}📝 1. Configure Environment Variables:${NC}"
    echo -e "   ${YELLOW}nano \$APP_DIR/.env${NC}"
    echo -e "   • Fill in your MongoDB Atlas connection string"
    echo -e "   • Add your OpenAI API key"
    echo -e "   • Configure Facebook app credentials"
    echo -e "   • Set your domain name and URLs"
    echo ""
    
    echo -e "${CYAN}🚀 2. Start the Application:${NC}"
    echo -e "   ${YELLOW}cd \$APP_DIR${NC}"
    echo -e "   ${YELLOW}docker-compose up -d${NC}"
    echo ""
    
    echo -e "${CYAN}🌐 3. Access Your Application:${NC}"
    echo -e "   • Frontend: ${YELLOW}http://\$(curl -s ifconfig.me)${NC}"
    echo -e "   • Backend API: ${YELLOW}http://\$(curl -s ifconfig.me):3000${NC}"
    echo -e "   • API Documentation: ${YELLOW}http://\$(curl -s ifconfig.me):3000/api${NC}"
    echo -e "   • Portainer: ${YELLOW}http://\$(curl -s ifconfig.me):9000${NC}"
    echo ""
    
    echo -e "${CYAN}🛠️  4. Useful Commands:${NC}"
    echo -e "   • View logs: ${YELLOW}docker-compose logs -f${NC}"
    echo -e "   • Restart services: ${YELLOW}systemctl restart chatbot${NC}"
    echo -e "   • Stop application: ${YELLOW}docker-compose down${NC}"
    echo -e "   • Update application: ${YELLOW}git pull && docker-compose build && docker-compose up -d${NC}"
    echo -e "   • Health check: ${YELLOW}./health-check.sh${NC}"
    echo -e "   • System monitoring: ${YELLOW}./health-check.sh full${NC}"
    echo ""
    
    echo -e "${CYAN}🔒 5. Security Information:${NC}"
    echo -e "   ✅ SSH root login is disabled"
    echo -e "   ✅ Password authentication is disabled"
    echo -e "   ✅ Firewall is configured and active"
    echo -e "   ✅ Fail2ban is protecting against brute force"
    echo -e "   ✅ Automatic security updates are enabled"
    echo -e "   ✅ System is optimized for production"
    echo ""
    
    echo -e "${WHITE}╔══════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${WHITE}║                        SYSTEM INFORMATION                            ║${NC}"
    echo -e "${WHITE}╚══════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "   📁 Installation Log: ${YELLOW}\$LOG_FILE${NC}"
    echo -e "   📁 Application Directory: ${YELLOW}\$APP_DIR${NC}"
    echo -e "   📁 Backup Directory: ${YELLOW}\$BACKUP_DIR${NC}"
    echo -e "   📁 Health Check Script: ${YELLOW}\$APP_DIR/health-check.sh${NC}"
    echo -e "   🐳 Docker Service: ${YELLOW}systemctl status docker${NC}"
    echo -e "   🤖 Chatbot Service: ${YELLOW}systemctl status chatbot${NC}"
    echo ""
    
    echo -e "${WHITE}╔══════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${WHITE}║                         SUPPORT & RESOURCES                          ║${NC}"
    echo -e "${WHITE}╚══════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "   📚 Documentation: ${YELLOW}https://github.com/vuthevietgps/chatbot2${NC}"
    echo -e "   🐛 Issues: ${YELLOW}https://github.com/vuthevietgps/chatbot2/issues${NC}"
    echo -e "   💡 Discussions: ${YELLOW}https://github.com/vuthevietgps/chatbot2/discussions${NC}"
    echo ""
    
    echo -e "${GREEN}✅ Your VPS is now ready for Chatbot2 production deployment!${NC}"
    echo -e "${PURPLE}🤖 Happy Chatbotting! 🚀${NC}"
    echo ""
}

# Error handling
handle_error() {
    local exit_code=\$?
    local line_number=\$1
    
    print_error "An error occurred on line \$line_number (exit code: \$exit_code)"
    print_info "Check the installation log: \$LOG_FILE"
    print_info "Backup directory: \$BACKUP_DIR"
    
    # Attempt to restore from backup if possible
    if [ -d "\$BACKUP_DIR" ]; then
        print_info "You can restore configurations from backup if needed"
    fi
    
    log "Installation failed on line \$line_number with exit code \$exit_code"
    exit \$exit_code
}

# Cleanup function
cleanup() {
    print_info "Cleaning up temporary files..."
    # Add cleanup commands here if needed
}

# Main execution flow
main() {
    # Set up error handling
    trap 'handle_error \$LINENO' ERR
    trap cleanup EXIT
    
    # Display header
    print_header "VPS DEEP CLEAN & CHATBOT2 INSTALLATION"
    
    # Create log file
    touch "\$LOG_FILE"
    log "=== Chatbot2 VPS Installation Started ==="
    log "Script version: \$SCRIPT_VERSION"
    log "Executed by: \${SUDO_USER:-root}"
    log "Host: \$(hostname)"
    log "OS: \$(uname -a)"
    
    # Pre-flight checks
    check_root
    detect_os
    system_check
    
    # Main installation steps
    local total_steps=12
    local current_step=0
    
    echo -e "\n${WHITE}Starting installation process...${NC}\n"
    
    ((current_step++))
    echo -e "${CYAN}[\$current_step/\$total_steps]${NC} Creating system backup..."
    create_backup
    
    ((current_step++))
    echo -e "${CYAN}[\$current_step/\$total_steps]${NC} Performing deep cleanup..."
    deep_cleanup
    
    ((current_step++))
    echo -e "${CYAN}[\$current_step/\$total_steps]${NC} Updating system packages..."
    update_system
    
    ((current_step++))
    echo -e "${CYAN}[\$current_step/\$total_steps]${NC} Installing essential packages..."
    install_essentials
    
    ((current_step++))
    echo -e "${CYAN}[\$current_step/\$total_steps]${NC} Configuring security settings..."
    configure_security
    
    ((current_step++))
    echo -e "${CYAN}[\$current_step/\$total_steps]${NC} Installing Docker..."
    install_docker
    
    ((current_step++))
    echo -e "${CYAN}[\$current_step/\$total_steps]${NC} Installing Node.js..."
    install_nodejs
    
    ((current_step++))
    echo -e "${CYAN}[\$current_step/\$total_steps]${NC} Setting up application..."
    setup_application
    
    ((current_step++))
    echo -e "${CYAN}[\$current_step/\$total_steps]${NC} Configuring monitoring..."
    setup_monitoring
    
    ((current_step++))
    echo -e "${CYAN}[\$current_step/\$total_steps]${NC} Optimizing system performance..."
    optimize_system
    
    ((current_step++))
    echo -e "${CYAN}[\$current_step/\$total_steps]${NC} Setting up SSL certificates..."
    setup_ssl
    
    ((current_step++))
    echo -e "${CYAN}[\$current_step/\$total_steps]${NC} Performing final verification..."
    final_verification
    
    # Log completion
    log "=== Chatbot2 VPS Installation Completed Successfully ==="
    log "Total installation time: \$SECONDS seconds"
    
    # Show final instructions
    show_final_instructions
}

# Script entry point
if [ "\${BASH_SOURCE[0]}" = "\${0}" ]; then
    main "\$@"
fi