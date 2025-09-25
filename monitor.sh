#!/bin/bash

# System monitoring script
# Add to crontab: */5 * * * * /opt/chatbot/monitor.sh

LOG_FILE="/opt/chatbot/system.log"
ALERT_EMAIL="admin@yourdomain.com"

log_message() {
    echo "$(date): $1" >> $LOG_FILE
}

# Check container health
check_containers() {
    if ! docker-compose ps | grep -q "Up"; then
        log_message "⚠️  Containers down - restarting"
        docker-compose restart
        
        # Send alert email (if mail is configured)
        # echo "Chatbot containers restarted" | mail -s "System Alert" $ALERT_EMAIL
    fi
}

# Check system resources
check_resources() {
    # CPU usage
    CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
    if (( $(echo "$CPU_USAGE > 80" | bc -l) )); then
        log_message "⚠️  High CPU usage: ${CPU_USAGE}%"
    fi
    
    # Memory usage
    MEM_USAGE=$(free | grep Mem | awk '{printf("%.1f", $3/$2 * 100.0)}')
    if (( $(echo "$MEM_USAGE > 85" | bc -l) )); then
        log_message "⚠️  High memory usage: ${MEM_USAGE}%"
    fi
    
    # Disk usage
    DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    if [ $DISK_USAGE -gt 85 ]; then
        log_message "⚠️  High disk usage: ${DISK_USAGE}%"
    fi
}

# Check application health
check_app_health() {
    if ! curl -f http://localhost:3000/health &> /dev/null; then
        log_message "⚠️  Backend health check failed"
        docker-compose restart backend
    fi
    
    if ! curl -f http://localhost &> /dev/null; then
        log_message "⚠️  Frontend health check failed"
        docker-compose restart frontend
    fi
}

# Clean old logs (keep 7 days)
cleanup_logs() {
    find /opt/chatbot/backend/logs -name "*.log" -mtime +7 -delete
    find /opt/chatbot -name "system.log" -size +100M -exec truncate -s 50M {} \;
}

# Run checks
check_containers
check_resources
check_app_health
cleanup_logs

log_message "✅ System check completed"