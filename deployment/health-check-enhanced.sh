#!/bin/bash

# Enhanced Health Check Script for Chatbot System
# Comprehensive monitoring based on real deployment experience
# Monitors containers, system resources, networking, and application health

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
WHITE='\033[1;37m'
NC='\033[0m'

# Configuration
LOG_FILE="/var/log/chatbot-health.log"
APP_DIR="/opt/chatbot"

print_header() {
    echo -e "\n${BLUE}============================================================${NC}"
    echo -e "${WHITE}  $1${NC}"
    echo -e "${BLUE}============================================================${NC}\n"
}

print_status() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"
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

print_info() {
    echo -e "${BLUE}ℹ️${NC} $1"
}

# Logging function
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> $LOG_FILE
}

# Create log directory if it doesn't exist
mkdir -p $(dirname $LOG_FILE)

print_header "CHATBOT SYSTEM HEALTH CHECK"
print_status "Starting comprehensive health check..."

# Initialize counters
PASSED=0
FAILED=0
WARNINGS=0

# Function to update counters
pass() {
    ((PASSED++))
    print_success "$1"
    log_message "PASS: $1"
}

fail() {
    ((FAILED++))
    print_error "$1"
    log_message "FAIL: $1"
}

warn() {
    ((WARNINGS++))
    print_warning "$1"
    log_message "WARN: $1"
}

# System Information
print_status "System Information:"
echo "  Hostname: $(hostname)"
echo "  Uptime: $(uptime -p)"
echo "  Current Time: $(date)"
echo "  System Load: $(uptime | awk -F'load average:' '{print $2}')"

# 1. Docker Service Check
print_status "Checking Docker service..."
if systemctl is-active --quiet docker; then
    pass "Docker service is running"
    DOCKER_VERSION=$(docker --version)
    print_info "Docker version: $DOCKER_VERSION"
else
    fail "Docker service is not running"
    print_info "Attempting to start Docker..."
    systemctl start docker && pass "Docker service started" || fail "Failed to start Docker"
fi

# 2. Container Status Check
print_status "Checking container status..."

# Check if containers exist and are running
BACKEND_STATUS=$(docker inspect -f '{{.State.Status}}' chatbot-backend 2>/dev/null || echo "not_found")
FRONTEND_STATUS=$(docker inspect -f '{{.State.Status}}' chatbot-frontend 2>/dev/null || echo "not_found")

if [ "$BACKEND_STATUS" = "running" ]; then
    pass "Backend container is running"
    
    # Get container info
    BACKEND_UPTIME=$(docker inspect -f '{{.State.StartedAt}}' chatbot-backend)
    print_info "Backend started at: $BACKEND_UPTIME"
    
    # Check container resource usage
    BACKEND_STATS=$(docker stats chatbot-backend --no-stream --format "table {{.CPUPerc}}\t{{.MemUsage}}" | tail -n 1)
    print_info "Backend resources: $BACKEND_STATS"
    
elif [ "$BACKEND_STATUS" = "exited" ]; then
    fail "Backend container has exited"
    EXIT_CODE=$(docker inspect -f '{{.State.ExitCode}}' chatbot-backend)
    print_info "Exit code: $EXIT_CODE"
    print_info "Last 10 log lines:"
    docker logs chatbot-backend --tail=10
else
    fail "Backend container not found"
fi

if [ "$FRONTEND_STATUS" = "running" ]; then
    pass "Frontend container is running"
    
    FRONTEND_UPTIME=$(docker inspect -f '{{.State.StartedAt}}' chatbot-frontend)
    print_info "Frontend started at: $FRONTEND_UPTIME"
    
    FRONTEND_STATS=$(docker stats chatbot-frontend --no-stream --format "table {{.CPUPerc}}\t{{.MemUsage}}" | tail -n 1)
    print_info "Frontend resources: $FRONTEND_STATS"
    
elif [ "$FRONTEND_STATUS" = "exited" ]; then
    fail "Frontend container has exited"
    EXIT_CODE=$(docker inspect -f '{{.State.ExitCode}}' chatbot-frontend)
    print_info "Exit code: $EXIT_CODE"
    print_info "Last 10 log lines:"
    docker logs chatbot-frontend --tail=10
else
    fail "Frontend container not found"
fi

# 3. Network Connectivity Check
print_status "Checking network connectivity..."

# Check Docker network
if docker network ls | grep -q chatbot_chatbot-network; then
    pass "Docker network 'chatbot_chatbot-network' exists"
    
    # Check if containers are connected to network
    BACKEND_NETWORK=$(docker inspect chatbot-backend -f '{{range $net, $conf := .NetworkSettings.Networks}}{{$net}}{{end}}' 2>/dev/null || echo "none")
    FRONTEND_NETWORK=$(docker inspect chatbot-frontend -f '{{range $net, $conf := .NetworkSettings.Networks}}{{$net}}{{end}}' 2>/dev/null || echo "none")
    
    if [[ $BACKEND_NETWORK == *"chatbot_chatbot-network"* ]]; then
        pass "Backend is connected to Docker network"
    else
        fail "Backend is not connected to Docker network"
    fi
    
    if [[ $FRONTEND_NETWORK == *"chatbot_chatbot-network"* ]]; then
        pass "Frontend is connected to Docker network"
    else
        fail "Frontend is not connected to Docker network"
    fi
else
    fail "Docker network 'chatbot_chatbot-network' not found"
fi

# Check internet connectivity
if ping -c 1 8.8.8.8 > /dev/null 2>&1; then
    pass "Internet connectivity is working"
else
    fail "Internet connectivity issue detected"
fi

# 4. Application Health Checks
print_status "Checking application health..."

# Backend health check
if curl -sf http://localhost:3000/health > /dev/null 2>&1; then
    pass "Backend health endpoint is responding"
    
    # Get detailed health response
    HEALTH_RESPONSE=$(curl -s http://localhost:3000/health)
    print_info "Health response: $HEALTH_RESPONSE"
    
    # Check if MongoDB connection is working
    if echo "$HEALTH_RESPONSE" | grep -q "OK"; then
        pass "Backend health status is OK"
    else
        warn "Backend health status is not OK"
    fi
else
    fail "Backend health endpoint is not responding"
    
    # Try to get more info about backend issues
    if [ "$BACKEND_STATUS" = "running" ]; then
        print_info "Backend container is running but not responding. Checking logs:"
        docker logs chatbot-backend --tail=15
    fi
fi

# Frontend accessibility check
if curl -sf http://localhost:4200 > /dev/null 2>&1; then
    pass "Frontend is accessible"
    
    # Check if it returns HTML content
    if curl -s http://localhost:4200 | grep -q "<!doctype html>"; then
        pass "Frontend is serving HTML content"
    else
        warn "Frontend is responding but not serving expected HTML"
    fi
else
    fail "Frontend is not accessible"
    
    if [ "$FRONTEND_STATUS" = "running" ]; then
        print_info "Frontend container is running but not accessible. Checking logs:"
        docker logs chatbot-frontend --tail=15
    fi
fi

# Internal container networking test
if [ "$BACKEND_STATUS" = "running" ] && [ "$FRONTEND_STATUS" = "running" ]; then
    print_status "Testing internal container networking..."
    
    if docker exec chatbot-frontend curl -sf http://chatbot-backend:3000/health > /dev/null 2>&1; then
        pass "Internal container networking is working"
    else
        fail "Internal container networking is not working"
        print_info "This will cause API calls from frontend to backend to fail"
    fi
fi

# API Documentation check
if curl -sf http://localhost:3000/api-docs > /dev/null 2>&1; then
    pass "API documentation is accessible"
else
    warn "API documentation is not accessible"
fi

# 5. System Resource Monitoring
print_status "Checking system resources..."

# Memory usage
TOTAL_MEM=$(free -m | awk '/^Mem:/ {print $2}')
USED_MEM=$(free -m | awk '/^Mem:/ {print $3}')
MEM_PERCENT=$(( USED_MEM * 100 / TOTAL_MEM ))

if [ $MEM_PERCENT -lt 80 ]; then
    pass "Memory usage is healthy (${MEM_PERCENT}%)"
elif [ $MEM_PERCENT -lt 90 ]; then
    warn "Memory usage is high (${MEM_PERCENT}%)"
else
    fail "Memory usage is critical (${MEM_PERCENT}%)"
    print_info "Consider upgrading server memory or optimizing applications"
fi

print_info "Memory: ${USED_MEM}MB / ${TOTAL_MEM}MB (${MEM_PERCENT}%)"

# Disk usage
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -lt 80 ]; then
    pass "Disk usage is healthy (${DISK_USAGE}%)"
elif [ $DISK_USAGE -lt 90 ]; then
    warn "Disk usage is high (${DISK_USAGE}%)"
else
    fail "Disk usage is critical (${DISK_USAGE}%)"
    print_info "Cleaning up Docker system..."
    docker system prune -f > /dev/null 2>&1
    NEW_DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    print_info "Disk usage after cleanup: ${NEW_DISK_USAGE}%"
fi

# Check swap usage if available
if free | grep -q "^Swap:"; then
    SWAP_TOTAL=$(free -m | awk '/^Swap:/ {print $2}')
    SWAP_USED=$(free -m | awk '/^Swap:/ {print $3}')
    
    if [ $SWAP_TOTAL -gt 0 ]; then
        SWAP_PERCENT=$(( SWAP_USED * 100 / SWAP_TOTAL ))
        if [ $SWAP_PERCENT -lt 50 ]; then
            pass "Swap usage is normal (${SWAP_PERCENT}%)"
        else
            warn "High swap usage detected (${SWAP_PERCENT}%)"
        fi
        print_info "Swap: ${SWAP_USED}MB / ${SWAP_TOTAL}MB"
    else
        warn "No swap space configured"
    fi
fi

# CPU load check
LOAD_AVG=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
CPU_CORES=$(nproc)
LOAD_PERCENT=$(echo "$LOAD_AVG * 100 / $CPU_CORES" | bc -l | cut -d. -f1)

if [ $LOAD_PERCENT -lt 70 ]; then
    pass "CPU load is normal (${LOAD_PERCENT}%)"
elif [ $LOAD_PERCENT -lt 90 ]; then
    warn "CPU load is high (${LOAD_PERCENT}%)"
else
    fail "CPU load is critical (${LOAD_PERCENT}%)"
fi

print_info "Load average: $LOAD_AVG (${CPU_CORES} cores available)"

# 6. Security Checks
print_status "Checking security configurations..."

# Firewall check
if command -v ufw &> /dev/null; then
    if ufw status | grep -q "Status: active"; then
        pass "UFW firewall is active"
        
        # Check if required ports are open
        if ufw status | grep -q "3000"; then
            pass "Backend port 3000 is allowed in firewall"
        else
            warn "Backend port 3000 is not explicitly allowed in firewall"
        fi
        
        if ufw status | grep -q "4200"; then
            pass "Frontend port 4200 is allowed in firewall"
        else
            warn "Frontend port 4200 is not explicitly allowed in firewall"
        fi
    else
        warn "UFW firewall is not active"
    fi
else
    warn "UFW firewall is not installed"
fi

# Fail2ban check
if systemctl is-active --quiet fail2ban 2>/dev/null; then
    pass "Fail2ban is running"
else
    warn "Fail2ban is not running"
fi

# 7. Log File Checks
print_status "Checking log files..."

# Check log file sizes
if [ -f "$LOG_FILE" ]; then
    LOG_SIZE=$(du -h "$LOG_FILE" | cut -f1)
    print_info "Health check log size: $LOG_SIZE"
fi

# Check Docker logs
if [ "$BACKEND_STATUS" = "running" ]; then
    BACKEND_LOG_SIZE=$(docker logs chatbot-backend 2>&1 | wc -l)
    if [ $BACKEND_LOG_SIZE -gt 1000 ]; then
        warn "Backend has many log entries (${BACKEND_LOG_SIZE} lines)"
    else
        pass "Backend log size is normal (${BACKEND_LOG_SIZE} lines)"
    fi
fi

if [ "$FRONTEND_STATUS" = "running" ]; then
    FRONTEND_LOG_SIZE=$(docker logs chatbot-frontend 2>&1 | wc -l)
    if [ $FRONTEND_LOG_SIZE -gt 1000 ]; then
        warn "Frontend has many log entries (${FRONTEND_LOG_SIZE} lines)"
    else
        pass "Frontend log size is normal (${FRONTEND_LOG_SIZE} lines)"
    fi
fi

# 8. Automatic Remediation
if [ $FAILED -gt 0 ]; then
    print_status "Attempting automatic remediation..."
    
    # Restart containers if they're not running
    if [ "$BACKEND_STATUS" != "running" ] && [ "$BACKEND_STATUS" != "not_found" ]; then
        print_info "Attempting to restart backend container..."
        docker start chatbot-backend && pass "Backend container restarted" || fail "Failed to restart backend"
    fi
    
    if [ "$FRONTEND_STATUS" != "running" ] && [ "$FRONTEND_STATUS" != "not_found" ]; then
        print_info "Attempting to restart frontend container..."
        docker start chatbot-frontend && pass "Frontend container restarted" || fail "Failed to restart frontend"
    fi
    
    # If containers don't exist, suggest deployment
    if [ "$BACKEND_STATUS" = "not_found" ] || [ "$FRONTEND_STATUS" = "not_found" ]; then
        print_info "Some containers are missing. Consider running: ./app-deploy.sh"
    fi
fi

# Summary
print_header "HEALTH CHECK SUMMARY"

echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${YELLOW}⚠️  Warnings: $WARNINGS${NC}" 
echo -e "${RED}❌ Failed: $FAILED${NC}"

# Overall status
if [ $FAILED -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    print_success "🎉 System is healthy! All checks passed."
    OVERALL_STATUS="HEALTHY"
elif [ $FAILED -eq 0 ]; then
    print_warning "⚠️  System is mostly healthy with some warnings."
    OVERALL_STATUS="WARNING"
else
    print_error "❌ System has issues that need attention."
    OVERALL_STATUS="CRITICAL"
fi

# Log summary
log_message "Health check completed - Status: $OVERALL_STATUS, Passed: $PASSED, Warnings: $WARNINGS, Failed: $FAILED"

# Recommendations
if [ $FAILED -gt 0 ] || [ $WARNINGS -gt 0 ]; then
    echo ""
    print_status "🔧 Recommendations:"
    
    if [ $FAILED -gt 0 ]; then
        echo "  1. Check container logs: docker logs chatbot-backend && docker logs chatbot-frontend"
        echo "  2. Restart containers: docker restart chatbot-backend chatbot-frontend"
        echo "  3. If containers are missing: ./app-deploy.sh"
        echo "  4. Check system resources and clean up if needed"
    fi
    
    if [ $WARNINGS -gt 0 ]; then
        echo "  • Monitor system resources regularly"
        echo "  • Consider system optimization if resource usage is high"
        echo "  • Ensure security services (firewall, fail2ban) are properly configured"
    fi
fi

# Create status file for external monitoring
cat > /tmp/chatbot-health-status.json << EOF
{
    "timestamp": "$(date -Iseconds)",
    "overall_status": "$OVERALL_STATUS",
    "passed": $PASSED,
    "warnings": $WARNINGS,
    "failed": $FAILED,
    "backend_status": "$BACKEND_STATUS",
    "frontend_status": "$FRONTEND_STATUS",
    "system": {
        "memory_usage_percent": $MEM_PERCENT,
        "disk_usage_percent": $DISK_USAGE,
        "cpu_load_percent": $LOAD_PERCENT
    }
}
EOF

print_info "Status exported to: /tmp/chatbot-health-status.json"

# Exit with appropriate code
if [ $FAILED -gt 0 ]; then
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    exit 2
else
    exit 0
fi