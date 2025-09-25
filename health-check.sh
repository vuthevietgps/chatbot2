#!/bin/bash

#############################################################################
# QUICK VPS HEALTH CHECK & MONITORING SCRIPT
# Companion script for chatbot deployment monitoring
#############################################################################

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m'

APP_DIR="/opt/chatbot"
LOG_FILE="/var/log/chatbot/health-check.log"

print_header() {
    echo -e "\n${PURPLE}############################################################################${NC}"
    echo -e "${WHITE}  $1${NC}"
    echo -e "${PURPLE}############################################################################${NC}\n"
}

print_success() { echo -e "${GREEN}✅${NC} $1"; }
print_warning() { echo -e "${YELLOW}⚠️${NC} $1"; }
print_error() { echo -e "${RED}❌${NC} $1"; }
print_info() { echo -e "${BLUE}ℹ️${NC} $1"; }

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> $LOG_FILE
}

# System Health Check
check_system_health() {
    print_header "SYSTEM HEALTH CHECK"
    
    # CPU Usage
    CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')
    if (( $(echo "$CPU_USAGE > 80" | bc -l) )); then
        print_error "High CPU usage: ${CPU_USAGE}%"
    else
        print_success "CPU usage: ${CPU_USAGE}%"
    fi
    
    # Memory Usage
    MEM_USAGE=$(free | grep Mem | awk '{printf("%.1f", $3/$2 * 100.0)}')
    if (( $(echo "$MEM_USAGE > 85" | bc -l) )); then
        print_warning "High memory usage: ${MEM_USAGE}%"
    else
        print_success "Memory usage: ${MEM_USAGE}%"
    fi
    
    # Disk Usage
    DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    if [ $DISK_USAGE -gt 80 ]; then
        print_warning "High disk usage: ${DISK_USAGE}%"
    else
        print_success "Disk usage: ${DISK_USAGE}%"
    fi
    
    # Load Average
    LOAD_AVG=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    CORES=$(nproc)
    if (( $(echo "$LOAD_AVG > $CORES" | bc -l) )); then
        print_warning "High load average: $LOAD_AVG (cores: $CORES)"
    else
        print_success "Load average: $LOAD_AVG (cores: $CORES)"
    fi
}

# Docker Health Check
check_docker_health() {
    print_header "DOCKER HEALTH CHECK"
    
    if ! systemctl is-active --quiet docker; then
        print_error "Docker service is not running"
        return 1
    fi
    print_success "Docker service is running"
    
    # Check Docker containers
    if [ -d "$APP_DIR" ] && [ -f "$APP_DIR/docker-compose.yml" ]; then
        cd $APP_DIR
        
        CONTAINERS=$(docker-compose ps -q)
        if [ -z "$CONTAINERS" ]; then
            print_warning "No containers are running"
            return 1
        fi
        
        # Check each container
        docker-compose ps --format "table {{.Name}}\t{{.State}}\t{{.Ports}}" | tail -n +2 | while read line; do
            NAME=$(echo $line | awk '{print $1}')
            STATE=$(echo $line | awk '{print $2}')
            
            if [ "$STATE" = "Up" ]; then
                print_success "Container $NAME is running"
            else
                print_error "Container $NAME is $STATE"
            fi
        done
        
        # Check container health
        UNHEALTHY=$(docker ps --filter "health=unhealthy" -q | wc -l)
        if [ $UNHEALTHY -gt 0 ]; then
            print_error "$UNHEALTHY unhealthy containers found"
            docker ps --filter "health=unhealthy" --format "table {{.Names}}\t{{.Status}}"
        else
            print_success "All containers are healthy"
        fi
    else
        print_warning "Docker Compose file not found at $APP_DIR"
    fi
}

# Network Health Check
check_network_health() {
    print_header "NETWORK HEALTH CHECK"
    
    # Check internet connectivity
    if ping -c 1 google.com &> /dev/null; then
        print_success "Internet connectivity is working"
    else
        print_error "No internet connectivity"
    fi
    
    # Check DNS resolution
    if nslookup google.com &> /dev/null; then
        print_success "DNS resolution is working"
    else
        print_error "DNS resolution failed"
    fi
    
    # Check firewall status
    if command -v ufw &> /dev/null; then
        if ufw status | grep -q "Status: active"; then
            print_success "UFW firewall is active"
        else
            print_warning "UFW firewall is inactive"
        fi
    fi
    
    # Check open ports
    print_info "Checking application ports..."
    if netstat -tlnp | grep -q ":80 "; then
        print_success "Port 80 (HTTP) is open"
    else
        print_warning "Port 80 (HTTP) is not open"
    fi
    
    if netstat -tlnp | grep -q ":443 "; then
        print_success "Port 443 (HTTPS) is open"
    else
        print_warning "Port 443 (HTTPS) is not open"
    fi
    
    if netstat -tlnp | grep -q ":3000 "; then
        print_success "Port 3000 (Backend) is open"
    else
        print_warning "Port 3000 (Backend) is not open"
    fi
}

# Application Health Check
check_application_health() {
    print_header "APPLICATION HEALTH CHECK"
    
    # Check if application directory exists
    if [ -d "$APP_DIR" ]; then
        print_success "Application directory exists: $APP_DIR"
    else
        print_error "Application directory not found: $APP_DIR"
        return 1
    fi
    
    # Check environment file
    if [ -f "$APP_DIR/.env" ]; then
        print_success "Environment file exists"
        
        # Check critical environment variables
        if grep -q "MONGODB_URI=" "$APP_DIR/.env" && ! grep -q "MONGODB_URI=$" "$APP_DIR/.env"; then
            print_success "MongoDB URI is configured"
        else
            print_warning "MongoDB URI needs configuration"
        fi
        
        if grep -q "OPENAI_API_KEY=" "$APP_DIR/.env" && ! grep -q "OPENAI_API_KEY=$" "$APP_DIR/.env"; then
            print_success "OpenAI API key is configured"
        else
            print_warning "OpenAI API key needs configuration"
        fi
    else
        print_error "Environment file not found"
    fi
    
    # Check application endpoints
    print_info "Checking application endpoints..."
    
    # Frontend health check
    if curl -s -o /dev/null -w "%{http_code}" http://localhost | grep -q "200\|301\|302"; then
        print_success "Frontend is responding"
    else
        print_warning "Frontend is not responding"
    fi
    
    # Backend health check
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health | grep -q "200"; then
        print_success "Backend health endpoint is responding"
    else
        print_warning "Backend health endpoint is not responding"
    fi
}

# Security Check
check_security() {
    print_header "SECURITY CHECK"
    
    # Check fail2ban
    if systemctl is-active --quiet fail2ban; then
        print_success "Fail2ban is running"
        
        # Check banned IPs
        BANNED_IPS=$(fail2ban-client status sshd 2>/dev/null | grep "Currently banned" | awk '{print $4}' || echo "0")
        if [ "$BANNED_IPS" != "0" ]; then
            print_info "Currently banned IPs: $BANNED_IPS"
        fi
    else
        print_warning "Fail2ban is not running"
    fi
    
    # Check SSH configuration
    if grep -q "PermitRootLogin no" /etc/ssh/sshd_config; then
        print_success "SSH root login is disabled"
    else
        print_warning "SSH root login might be enabled"
    fi
    
    if grep -q "PasswordAuthentication no" /etc/ssh/sshd_config; then
        print_success "SSH password authentication is disabled"
    else
        print_warning "SSH password authentication might be enabled"
    fi
    
    # Check for security updates
    if command -v apt &> /dev/null; then
        SECURITY_UPDATES=$(apt list --upgradable 2>/dev/null | grep -i security | wc -l)
        if [ $SECURITY_UPDATES -gt 0 ]; then
            print_warning "$SECURITY_UPDATES security updates available"
        else
            print_success "No security updates pending"
        fi
    fi
}

# Log Analysis
analyze_logs() {
    print_header "LOG ANALYSIS"
    
    # Check system logs for errors
    ERROR_COUNT=$(journalctl --since "1 hour ago" --priority=err | wc -l)
    if [ $ERROR_COUNT -gt 10 ]; then
        print_warning "$ERROR_COUNT errors in system logs (last hour)"
    else
        print_success "System logs look healthy"
    fi
    
    # Check Docker logs if containers exist
    if [ -d "$APP_DIR" ] && [ -f "$APP_DIR/docker-compose.yml" ]; then
        cd $APP_DIR
        
        # Check for application errors
        APP_ERRORS=$(docker-compose logs --since=1h 2>&1 | grep -i "error\|exception\|failed" | wc -l)
        if [ $APP_ERRORS -gt 5 ]; then
            print_warning "$APP_ERRORS application errors in logs (last hour)"
            echo "Recent errors:"
            docker-compose logs --since=1h 2>&1 | grep -i "error\|exception\|failed" | tail -5
        else
            print_success "Application logs look healthy"
        fi
    fi
}

# Performance Metrics
show_performance_metrics() {
    print_header "PERFORMANCE METRICS"
    
    # System uptime
    UPTIME=$(uptime -p)
    print_info "System uptime: $UPTIME"
    
    # Network connections
    CONNECTIONS=$(netstat -an | grep ESTABLISHED | wc -l)
    print_info "Active connections: $CONNECTIONS"
    
    # Docker stats (if running)
    if docker ps -q | head -1 | grep -q .; then
        echo -e "\n${WHITE}Container Resource Usage:${NC}"
        docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
    fi
    
    # Disk I/O
    if command -v iostat &> /dev/null; then
        echo -e "\n${WHITE}Disk I/O:${NC}"
        iostat -x 1 1 | tail -n +4
    fi
}

# Quick fixes
auto_fix_issues() {
    print_header "AUTO-FIX COMMON ISSUES"
    
    # Restart unhealthy containers
    if [ -d "$APP_DIR" ] && [ -f "$APP_DIR/docker-compose.yml" ]; then
        cd $APP_DIR
        
        UNHEALTHY=$(docker ps --filter "health=unhealthy" -q)
        if [ ! -z "$UNHEALTHY" ]; then
            print_info "Restarting unhealthy containers..."
            echo $UNHEALTHY | xargs docker restart
        fi
        
        # Restart stopped containers
        STOPPED=$(docker-compose ps --filter "status=exited" -q)
        if [ ! -z "$STOPPED" ]; then
            print_info "Starting stopped containers..."
            docker-compose up -d
        fi
    fi
    
    # Clean Docker system if disk usage is high
    DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    if [ $DISK_USAGE -gt 85 ]; then
        print_info "High disk usage detected. Cleaning Docker system..."
        docker system prune -f
    fi
    
    # Restart services if needed
    if ! systemctl is-active --quiet docker; then
        print_info "Starting Docker service..."
        systemctl start docker
    fi
    
    if ! systemctl is-active --quiet fail2ban; then
        print_info "Starting Fail2ban service..."
        systemctl start fail2ban
    fi
}

# Generate report
generate_report() {
    REPORT_FILE="/tmp/chatbot-health-report-$(date +%Y%m%d-%H%M%S).txt"
    
    {
        echo "CHATBOT SYSTEM HEALTH REPORT"
        echo "Generated: $(date)"
        echo "Host: $(hostname)"
        echo "=============================="
        echo ""
        
        echo "SYSTEM INFORMATION:"
        echo "OS: $(cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2)"
        echo "Kernel: $(uname -r)"
        echo "Uptime: $(uptime -p)"
        echo "CPU Cores: $(nproc)"
        echo "Total RAM: $(free -h | awk '/^Mem:/ {print $2}')"
        echo "Available RAM: $(free -h | awk '/^Mem:/ {print $7}')"
        echo "Disk Usage: $(df -h / | awk 'NR==2 {print $5 " (" $3 " used, " $4 " available)"}')"
        echo ""
        
        echo "RUNNING PROCESSES:"
        ps aux --sort=-%cpu | head -10
        echo ""
        
        echo "NETWORK CONNECTIONS:"
        netstat -tuln | grep LISTEN
        echo ""
        
        if [ -d "$APP_DIR" ]; then
            echo "DOCKER CONTAINERS:"
            cd $APP_DIR && docker-compose ps 2>/dev/null || echo "No containers found"
            echo ""
        fi
        
        echo "RECENT SYSTEM LOGS:"
        journalctl --since "2 hours ago" --priority=warning | tail -20
        
    } > $REPORT_FILE
    
    print_success "Health report generated: $REPORT_FILE"
}

# Main function
main() {
    case "${1:-check}" in
        "check"|"")
            check_system_health
            check_docker_health
            check_network_health
            check_application_health
            check_security
            analyze_logs
            ;;
        "performance"|"perf")
            show_performance_metrics
            ;;
        "fix")
            auto_fix_issues
            ;;
        "report")
            generate_report
            ;;
        "full")
            check_system_health
            check_docker_health
            check_network_health
            check_application_health
            check_security
            analyze_logs
            show_performance_metrics
            generate_report
            ;;
        "help")
            echo "Usage: $0 [command]"
            echo "Commands:"
            echo "  check (default) - Run basic health checks"
            echo "  performance     - Show performance metrics"
            echo "  fix            - Auto-fix common issues"
            echo "  report         - Generate detailed report"
            echo "  full           - Run all checks and generate report"
            echo "  help           - Show this help"
            ;;
        *)
            echo "Unknown command: $1"
            echo "Use '$0 help' for usage information"
            exit 1
            ;;
    esac
}

# Create log directory if not exists
mkdir -p $(dirname $LOG_FILE)

# Run main function
main "$@"

# Log the health check
log "Health check completed: $1"