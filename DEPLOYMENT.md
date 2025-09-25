# 🚀 Chatbot2 Production Deployment Guide

## 📋 Quick Deployment Commands

### Option 1: Automated VPS Setup (Recommended)
```bash
# Download and run the comprehensive VPS setup script
wget https://raw.githubusercontent.com/vuthevietgps/chatbot2/main/vps-deep-clean.sh
chmod +x vps-deep-clean.sh
sudo ./vps-deep-clean.sh
```

### Option 2: Manual Deployment
```bash
# Clone repository
git clone https://github.com/vuthevietgps/chatbot2.git
cd chatbot2

# Configure environment
cp .env.example .env
nano .env

# Start with Docker
docker-compose up -d
```

## 🔧 Pre-Deployment Checklist

### VPS Requirements
- [ ] **OS**: Ubuntu 20.04+ LTS / CentOS 8+ / Debian 11+
- [ ] **RAM**: 4GB minimum (8GB recommended)
- [ ] **Storage**: 50GB minimum
- [ ] **CPU**: 2 cores minimum
- [ ] **Network**: Public IP with domain pointing to server

### Required Credentials
- [ ] **MongoDB Atlas**: Connection string
- [ ] **OpenAI**: API key
- [ ] **Facebook**: App ID, App Secret, Verify Token
- [ ] **Domain**: SSL-ready domain name (optional)

## 🌐 What the VPS Script Does

### 🧹 Deep Cleanup
- Removes unnecessary packages and services
- Cleans temporary files and caches
- Optimizes disk space
- Resets network configurations

### 🛡️ Security Hardening
- Configures Fail2Ban for brute force protection
- Sets up UFW firewall with essential ports
- Secures SSH (disables root login, password auth)
- Enables automatic security updates

### 📦 Software Installation
- Docker & Docker Compose
- Node.js 18 LTS & npm
- Essential development tools
- Health monitoring tools

### ⚡ Performance Optimization
- Kernel parameter tuning
- File descriptor limits
- Memory management optimization
- Docker daemon optimization

### 🔍 Monitoring Setup
- Health check automation
- Log rotation configuration
- System maintenance cron jobs
- Service status monitoring

## 📊 Post-Deployment Verification

### Check Services Status
```bash
# System services
sudo systemctl status docker
sudo systemctl status fail2ban
sudo ufw status

# Application services
cd /opt/chatbot
docker-compose ps
./health-check.sh
```

### Access Points
- **Frontend**: `http://your-domain.com`
- **Backend API**: `http://your-domain.com:3000`
- **API Docs**: `http://your-domain.com:3000/api`
- **Portainer**: `http://your-domain.com:9000`

## 🛠️ Management Commands

### Application Management
```bash
cd /opt/chatbot

# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart services
docker-compose restart

# View logs
docker-compose logs -f

# Update application
git pull
docker-compose build
docker-compose up -d
```

### System Management
```bash
# Health check
./health-check.sh

# Full system report
./health-check.sh full

# Auto-fix issues
./health-check.sh fix

# Generate report
./health-check.sh report
```

### Service Management
```bash
# Chatbot service
sudo systemctl start chatbot
sudo systemctl stop chatbot
sudo systemctl restart chatbot
sudo systemctl status chatbot

# Docker service
sudo systemctl restart docker
sudo systemctl status docker
```

## 🔒 Security Best Practices

### SSH Access
- Use SSH keys instead of passwords
- Change default SSH port if needed
- Monitor SSH login attempts

### Firewall Configuration
```bash
# Check firewall status
sudo ufw status verbose

# Allow additional ports (if needed)
sudo ufw allow [port]/tcp

# Check blocked attempts
sudo fail2ban-client status sshd
```

### SSL Certificates
```bash
# Check certificate status
sudo certbot certificates

# Renew certificates manually
sudo certbot renew

# Test renewal process
sudo certbot renew --dry-run
```

## 📈 Monitoring & Maintenance

### Daily Checks
- System resource usage
- Application health status
- Error logs review
- Backup verification

### Weekly Tasks
- Security updates review
- Performance metrics analysis
- Database optimization
- Log file cleanup

### Monthly Tasks
- Full system backup
- Security audit
- Dependency updates
- Performance tuning review

## 🚨 Troubleshooting

### Common Issues

#### Application Won't Start
```bash
# Check Docker status
sudo systemctl status docker

# Check container logs
docker-compose logs backend
docker-compose logs frontend

# Restart Docker service
sudo systemctl restart docker
```

#### High Memory Usage
```bash
# Check memory usage
free -h
docker stats

# Clean Docker system
docker system prune -f

# Restart containers
docker-compose restart
```

#### Database Connection Issues
```bash
# Test MongoDB connection
docker-compose exec backend npm run test:db

# Check network connectivity
ping your-mongodb-cluster.mongodb.net

# Verify environment variables
cat .env | grep MONGODB_URI
```

#### SSL Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Test domain resolution
nslookup your-domain.com

# Renew certificates
sudo certbot renew --force-renewal
```

## 📱 Mobile & API Testing

### Frontend Testing
- Test responsive design on mobile devices
- Verify all dashboard functionalities
- Check real-time features

### API Testing
- Test authentication endpoints
- Verify CRUD operations
- Check WebSocket connections
- Test Facebook webhook integration

### Performance Testing
```bash
# Load testing with Apache Bench
ab -n 1000 -c 10 http://your-domain.com/

# Monitor during load test
htop
docker stats
```

## 🔄 Backup & Recovery

### Manual Backup
```bash
# Database backup (if using local MongoDB)
docker-compose exec mongodb mongodump --out /backup

# Application files backup
tar -czf chatbot-backup-$(date +%Y%m%d).tar.gz /opt/chatbot

# Environment backup
cp /opt/chatbot/.env /backup/env-backup-$(date +%Y%m%d)
```

### Restore Process
```bash
# Restore application
tar -xzf chatbot-backup-YYYYMMDD.tar.gz -C /

# Restore environment
cp /backup/env-backup-YYYYMMDD /opt/chatbot/.env

# Restart services
cd /opt/chatbot
docker-compose up -d
```

## 📞 Support & Resources

### Documentation
- [GitHub Repository](https://github.com/vuthevietgps/chatbot2)
- [API Documentation](http://your-domain.com:3000/api)
- [Deployment Scripts](https://github.com/vuthevietgps/chatbot2/tree/main)

### Community
- [GitHub Issues](https://github.com/vuthevietgps/chatbot2/issues)
- [GitHub Discussions](https://github.com/vuthevietgps/chatbot2/discussions)

### Log Files
- Application logs: `/opt/chatbot/logs/`
- System logs: `/var/log/chatbot/`
- Installation log: `/var/log/chatbot-install.log`
- Docker logs: `docker-compose logs`

---

## 🎉 Success Checklist

After deployment, verify these items:

- [ ] ✅ Frontend loads without errors
- [ ] ✅ Backend API responds to health check
- [ ] ✅ Database connection is working
- [ ] ✅ WebSocket real-time features work
- [ ] ✅ User authentication functions properly
- [ ] ✅ OpenAI integration responds correctly
- [ ] ✅ Facebook webhook receives messages
- [ ] ✅ SSL certificate is valid (if configured)
- [ ] ✅ Monitoring scripts are running
- [ ] ✅ Backup systems are configured
- [ ] ✅ Security services are active
- [ ] ✅ Performance metrics are normal

**🚀 Your Chatbot2 system is now production-ready!**

---

*Made with ❤️ by [VuTheVietGPS](https://github.com/vuthevietgps)*