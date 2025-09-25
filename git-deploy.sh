#!/bin/bash

#############################################################################
# GIT DEPLOYMENT SCRIPT
# Push Chatbot2 code to GitHub repository
#############################################################################

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m'

# Configuration
REPO_URL="https://github.com/vuthevietgps/chatbot2.git"
REMOTE_NAME="origin"
MAIN_BRANCH="main"

print_header() {
    echo -e "\n${PURPLE}############################################################################${NC}"
    echo -e "${WHITE}  $1${NC}"
    echo -e "${PURPLE}############################################################################${NC}\n"
}

print_success() { echo -e "${GREEN}✅${NC} $1"; }
print_warning() { echo -e "${YELLOW}⚠️${NC} $1"; }
print_error() { echo -e "${RED}❌${NC} $1"; }
print_info() { echo -e "${BLUE}ℹ️${NC} $1"; }
print_step() { echo -e "\n${CYAN}🔧${NC} $1"; }

# Check if we're in the right directory
check_directory() {
    if [ ! -f "package.json" ] && [ ! -d "backend" ] && [ ! -d "frontend" ]; then
        print_error "This doesn't appear to be the chatbot2 project directory"
        print_info "Please run this script from the project root directory"
        exit 1
    fi
    print_success "Project directory verified"
}

# Check Git installation
check_git() {
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed. Please install Git first."
        exit 1
    fi
    print_success "Git is installed: $(git --version)"
}

# Initialize Git repository if needed
init_git_repo() {
    if [ ! -d ".git" ]; then
        print_step "Initializing Git repository..."
        git init
        print_success "Git repository initialized"
    else
        print_success "Git repository already exists"
    fi
}

# Create .gitignore if it doesn't exist
create_gitignore() {
    if [ ! -f ".gitignore" ]; then
        print_step "Creating .gitignore file..."
        
        cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.production
.env.development
.env.staging

# Build outputs
dist/
build/
*.tgz
*.tar.gz

# Logs
logs/
*.log
*.log.*

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# nyc test coverage
.nyc_output

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env
.env.test

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# next.js build output
.next

# nuxt.js build output
.nuxt

# vuepress build output
.vuepress/dist

# Serverless directories
.serverless

# FuseBox cache
.fusebox/

# DynamoDB Local files
.dynamodb/

# TernJS port file
.tern-port

# Stores VSCode versions used for testing VSCode extensions
.vscode-test

# Angular
# See http://help.github.com/ignore-files/ for more about ignoring files.

# compiled output
/tmp
/out-tsc
# Only exists if Bazel was run
/bazel-out

# profiling files
chrome-profiler-events*.json

# IDEs and editors
/.idea
.project
.classpath
.c9/
*.launch
.settings/
*.sublime-workspace

# IDE - VSCode
.vscode/*
!.vscode/settings.json
!.vscode/tasks.json
!.vscode/launch.json
!.vscode/extensions.json
.history/*

# misc
/.sass-cache
/connect.lock
/coverage
/libpeerconnection.log
testem.log
/typings

# System Files
.DS_Store
Thumbs.db

# Docker
docker-compose.override.yml
.docker/

# Backup files
*.backup
*.bak

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Database
*.sqlite
*.db

# Temporary files
*.tmp
*.temp
.temp/
tmp/

# MongoDB
*.mongodb

# Redis
dump.rdb

# SSL certificates
*.pem
*.key
*.crt
*.cert

# Local development
.local/
local/

# Testing
test-results/
playwright-report/
playwright/.cache/

# Sentry
.sentryclirc

# Production builds
www/
public/build/

# Local configuration
config.local.json
EOF
        
        print_success ".gitignore file created"
    else
        print_success ".gitignore file already exists"
    fi
}

# Create environment template
create_env_example() {
    if [ ! -f ".env.example" ]; then
        print_step "Creating .env.example template..."
        
        cat > .env.example << 'EOF'
# ==============================================
# CHATBOT2 ENVIRONMENT CONFIGURATION
# ==============================================

# Database Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chatbot2?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_MAX_TOKENS=1000
OPENAI_TEMPERATURE=0.7

# Facebook Integration
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
FACEBOOK_VERIFY_TOKEN=your-webhook-verify-token
FACEBOOK_GRAPH_API_URL=https://graph.facebook.com/v18.0

# Application Configuration
NODE_ENV=production
PORT=3000
FRONTEND_URL=http://localhost:4200
BACKEND_URL=http://localhost:3000

# CORS Configuration
CORS_ORIGIN=http://localhost:4200,https://your-domain.com

# WebSocket Configuration
WEBSOCKET_PORT=3001

# Redis Configuration (Optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=logs/application.log

# File Upload Configuration
MAX_FILE_SIZE=10MB
UPLOAD_DIR=uploads/

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# Health Check Configuration
HEALTH_CHECK_INTERVAL=30000
HEALTH_CHECK_TIMEOUT=5000

# SSL Configuration (Production)
SSL_CERT_PATH=/etc/ssl/certs/chatbot.crt
SSL_KEY_PATH=/etc/ssl/private/chatbot.key

# Backup Configuration
BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=30

# Monitoring Configuration
MONITORING_ENABLED=true
METRICS_PORT=9090

# Security Configuration
BCRYPT_ROUNDS=12
SESSION_SECRET=your-session-secret-key
COOKIE_SECURE=true
COOKIE_HTTP_ONLY=true
EOF
        
        print_success ".env.example template created"
    else
        print_success ".env.example already exists"
    fi
}

# Add remote repository
add_remote() {
    print_step "Configuring remote repository..."
    
    # Remove existing origin if it exists
    git remote remove origin 2>/dev/null || true
    
    # Add the new remote
    git remote add origin $REPO_URL
    
    # Verify remote
    if git remote -v | grep -q "origin"; then
        print_success "Remote repository configured: $REPO_URL"
    else
        print_error "Failed to configure remote repository"
        exit 1
    fi
}

# Stage files for commit
stage_files() {
    print_step "Staging files for commit..."
    
    # Add all files except those in .gitignore
    git add .
    
    # Show status
    echo -e "\n${WHITE}Files to be committed:${NC}"
    git status --porcelain
    
    print_success "Files staged for commit"
}

# Create commit
create_commit() {
    print_step "Creating commit..."
    
    # Check if there are any changes to commit
    if git diff --cached --quiet; then
        print_warning "No changes to commit"
        return 0
    fi
    
    # Get commit message from user or use default
    if [ -n "$1" ]; then
        COMMIT_MSG="$1"
    else
        COMMIT_MSG="🚀 Initial deployment: Complete Chatbot2 system

✨ Features:
- Multi-tenant chatbot platform
- NestJS backend with MongoDB Atlas
- Angular frontend with Material Design
- OpenAI integration with multiple configurations
- Real-time WebSocket communication
- Role-based access control (Director/Manager/Employee)
- Product Groups and Fanpages management
- Script management with AI assistance
- Docker containerization
- VPS deployment automation
- Health monitoring and maintenance scripts

🛠️ Tech Stack:
- Backend: NestJS, MongoDB, Socket.IO, JWT
- Frontend: Angular 16+, Angular Material, RxJS
- AI: OpenAI GPT-4, custom configurations
- Infrastructure: Docker, Nginx, Redis, Portainer
- Security: Fail2ban, UFW, SSL/TLS, bcrypt

📦 Deployment:
- Automated VPS setup script
- Docker Compose orchestration
- Health monitoring system
- Maintenance automation
- Production-ready configuration

Ready for production deployment! 🎉"
    fi
    
    git commit -m "$COMMIT_MSG"
    print_success "Commit created successfully"
}

# Push to GitHub
push_to_github() {
    print_step "Pushing to GitHub..."
    
    # Get current branch name
    CURRENT_BRANCH=$(git branch --show-current)
    
    # Push to remote repository
    if git push -u origin $CURRENT_BRANCH; then
        print_success "Code successfully pushed to GitHub!"
        print_info "Repository URL: $REPO_URL"
        print_info "Branch: $CURRENT_BRANCH"
    else
        print_error "Failed to push to GitHub"
        
        # Check if authentication is the issue
        print_info "If you're having authentication issues:"
        print_info "1. Make sure you have a GitHub account and access to the repository"
        print_info "2. Configure Git with your credentials:"
        echo -e "   ${YELLOW}git config --global user.name \"Your Name\"${NC}"
        echo -e "   ${YELLOW}git config --global user.email \"your.email@example.com\"${NC}"
        print_info "3. For HTTPS, you may need a Personal Access Token instead of password"
        print_info "4. For SSH, make sure your SSH key is added to GitHub"
        
        exit 1
    fi
}

# Setup GitHub Pages (optional)
setup_github_pages() {
    print_step "Setting up GitHub Pages (optional)..."
    
    read -p "Do you want to enable GitHub Pages for documentation? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Create docs directory if it doesn't exist
        mkdir -p docs
        
        # Create a simple index.html for GitHub Pages
        cat > docs/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chatbot2 - Documentation</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; border-radius: 10px; margin-bottom: 30px; }
        .feature { background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #007bff; }
        .tech-stack { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
        .tech { background: #e9ecef; padding: 15px; border-radius: 5px; text-align: center; }
        .cta { background: #28a745; color: white; padding: 20px; text-align: center; border-radius: 10px; margin: 30px 0; }
        .cta a { color: white; text-decoration: none; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 Chatbot2</h1>
        <p>Intelligent Multi-Tenant Chatbot Platform</p>
    </div>
    
    <h2>🌟 Features</h2>
    <div class="feature">
        <h3>🎯 Multi-Tenant Architecture</h3>
        <p>Support multiple businesses and fanpages with isolated data management and role-based access control.</p>
    </div>
    
    <div class="feature">
        <h3>🤖 AI-Powered Responses</h3>
        <p>OpenAI GPT integration with customizable configurations and context-aware conversation management.</p>
    </div>
    
    <div class="feature">
        <h3>⚡ Real-time Processing</h3>
        <p>WebSocket-powered live conversations with typing indicators and instant message delivery.</p>
    </div>
    
    <div class="feature">
        <h3>🛡️ Enterprise Security</h3>
        <p>JWT authentication, rate limiting, firewall protection, and automated security updates.</p>
    </div>
    
    <h2>🛠️ Technology Stack</h2>
    <div class="tech-stack">
        <div class="tech">
            <strong>Backend</strong><br>
            NestJS, MongoDB, Socket.IO
        </div>
        <div class="tech">
            <strong>Frontend</strong><br>
            Angular, Material Design
        </div>
        <div class="tech">
            <strong>AI</strong><br>
            OpenAI GPT-4, Custom Config
        </div>
        <div class="tech">
            <strong>Infrastructure</strong><br>
            Docker, Nginx, Redis
        </div>
    </div>
    
    <div class="cta">
        <h3>🚀 Ready to Deploy?</h3>
        <p><a href="https://github.com/vuthevietgps/chatbot2">View on GitHub</a> | 
        <a href="https://github.com/vuthevietgps/chatbot2/blob/main/README.md">Documentation</a></p>
    </div>
    
    <footer style="text-align: center; margin-top: 50px; color: #666;">
        <p>Made with ❤️ by VuTheVietGPS</p>
    </footer>
</body>
</html>
EOF
        
        git add docs/
        git commit -m "📚 Add GitHub Pages documentation"
        git push origin $CURRENT_BRANCH
        
        print_success "GitHub Pages setup completed"
        print_info "Your documentation will be available at: https://vuthevietgps.github.io/chatbot2/"
    else
        print_info "Skipping GitHub Pages setup"
    fi
}

# Show final information
show_final_info() {
    print_header "🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!"
    
    echo -e "${WHITE}Repository Information:${NC}"
    echo -e "  📁 Repository: ${YELLOW}$REPO_URL${NC}"
    echo -e "  🌿 Branch: ${YELLOW}$(git branch --show-current)${NC}"
    echo -e "  📝 Last Commit: ${YELLOW}$(git log -1 --format='%h - %s')${NC}"
    echo ""
    
    echo -e "${WHITE}Next Steps:${NC}"
    echo -e "${CYAN}1. VPS Deployment:${NC}"
    echo -e "   ${YELLOW}wget https://raw.githubusercontent.com/vuthevietgps/chatbot2/main/vps-setup.sh${NC}"
    echo -e "   ${YELLOW}chmod +x vps-setup.sh && sudo ./vps-setup.sh${NC}"
    echo ""
    
    echo -e "${CYAN}2. Local Development:${NC}"
    echo -e "   ${YELLOW}git clone $REPO_URL${NC}"
    echo -e "   ${YELLOW}cd chatbot2 && cp .env.example .env${NC}"
    echo -e "   ${YELLOW}docker-compose up -d${NC}"
    echo ""
    
    echo -e "${CYAN}3. Collaboration:${NC}"
    echo -e "   • Share repository URL with team members"
    echo -e "   • Configure branch protection rules"
    echo -e "   • Set up CI/CD workflows"
    echo ""
    
    echo -e "${WHITE}Repository Features:${NC}"
    echo -e "  ✅ Complete source code"
    echo -e "  ✅ Docker configuration"
    echo -e "  ✅ VPS deployment scripts"
    echo -e "  ✅ Health monitoring tools"
    echo -e "  ✅ Environment templates"
    echo -e "  ✅ Documentation"
    echo ""
    
    echo -e "${GREEN}🚀 Your chatbot system is now ready for production deployment!${NC}"
    echo -e "${PURPLE}Happy coding! 🤖${NC}"
}

# Main execution flow
main() {
    print_header "CHATBOT2 GITHUB DEPLOYMENT"
    
    # Get commit message from command line argument
    COMMIT_MESSAGE="$1"
    
    # Execute deployment steps
    check_directory
    check_git
    init_git_repo
    create_gitignore
    create_env_example
    add_remote
    stage_files
    create_commit "$COMMIT_MESSAGE"
    push_to_github
    setup_github_pages
    show_final_info
}

# Handle script arguments
case "${1:-deploy}" in
    "help"|"-h"|"--help")
        echo "Usage: $0 [commit-message]"
        echo "Examples:"
        echo "  $0                           # Deploy with default commit message"
        echo "  $0 \"Fix bug in user auth\"   # Deploy with custom commit message"
        echo "  $0 help                      # Show this help"
        exit 0
        ;;
    *)
        main "$1"
        ;;
esac