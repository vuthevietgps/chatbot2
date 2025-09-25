# Chatbot VPS Deployment Guide

## Complete Production Deployment Based on Real Experience

This guide contains battle-tested deployment scripts based on successful production deployment to Ubuntu 24.04 VPS.

### 🚀 Quick Start

1. **Prepare Scripts**
   ```bash
   cd deployment
   chmod +x make-scripts-executable.sh
   ./make-scripts-executable.sh
   ```

2. **Setup VPS** (run as root)
   ```bash
   sudo ./vps-setup-complete.sh
   ```

3. **Configure Environment**
   ```bash
   ./env-setup.sh
   ```

4. **Deploy Application**
   ```bash
   ./app-deploy.sh
   ```

5. **Monitor Health**
   ```bash
   ./health-check-enhanced.sh
   ```

### 📋 Scripts Overview

#### 1. `vps-setup-complete.sh`
**Complete VPS setup with all dependencies**
- System updates and essential packages
- Docker CE installation with production configuration
- Node.js 20.x LTS installation
- UFW firewall configuration
- Fail2ban security setup
- Swap space creation (2GB for memory management)
- Performance optimizations
- Systemd service creation

**Key Features Based on Experience:**
- ✅ Handles 3.8GB RAM VPS requirements
- ✅ Creates swap space for stability
- ✅ Optimized Docker daemon configuration
- ✅ Production-ready security settings

#### 2. `env-setup.sh`
**Interactive environment configuration**
- MongoDB Atlas connection with automatic URL encoding
- JWT secret generation
- OpenAI API configuration
- Facebook webhook setup
- Server host configuration

**Key Features:**
- ✅ **Automatic MongoDB password encoding** (handles @, #, etc.)
- ✅ Secure JWT secret generation
- ✅ Configuration validation
- ✅ Backup creation

#### 3. `app-deploy.sh`
**Application deployment with container orchestration**
- Docker image building with optimizations
- Container network management
- Health checks and verification
- Automatic restart policies

**Key Features Based on Deployment Experience:**
- ✅ Handles Angular budget limits automatically
- ✅ Optimized Dockerfile for backend
- ✅ Container networking configuration
- ✅ Health verification with retries

#### 4. `health-check-enhanced.sh`
**Comprehensive system monitoring**
- Container status monitoring
- System resource checks
- Network connectivity tests
- Application health verification
- Automatic remediation attempts

**Key Features:**
- ✅ Docker container health checks
- ✅ Internal container networking tests
- ✅ System resource monitoring
- ✅ Security configuration verification
- ✅ Automatic issue remediation

### 🔧 Key Lessons Learned

#### MongoDB Connection Issues
**Problem:** Password with special characters (@, #) caused connection failures
**Solution:** Automatic URL encoding in `env-setup.sh`
```bash
# Before: mongodb+srv://user:pass@word#123@cluster...
# After:  mongodb+srv://user:pass%40word%23123@cluster...
```

#### Angular Build Issues  
**Problem:** Bundle size exceeded budget limits in production
**Solution:** Automatic budget adjustment in deployment
```json
"maximumWarning": "5mb",
"maximumError": "10mb"
```

#### Docker Networking
**Problem:** Frontend container couldn't reach backend
**Solution:** Proper Docker network configuration
```bash
docker network create chatbot_chatbot-network
# Both containers connect to this network
```

#### Backend Dockerfile Issues
**Problem:** Nest CLI not found during build
**Solution:** Install all dependencies first, then build
```dockerfile
RUN npm ci                    # All dependencies
RUN npm run build            # Build with dev dependencies
RUN npm prune --production   # Remove dev dependencies
```

### 🛡️ Security Features

- **UFW Firewall:** Only essential ports open (22, 80, 443, 3000, 4200)
- **Fail2ban:** Brute force protection
- **Docker Security:** Non-root users in containers
- **SSL Ready:** Prepared for Let's Encrypt certificates
- **Auto Updates:** Unattended security updates

### 📊 System Requirements

**Minimum (tested):**
- RAM: 3.8GB (with 2GB swap space)
- Storage: 35GB available
- OS: Ubuntu 22.04+ / 24.04 LTS
- Network: Stable internet connection

**Recommended:**
- RAM: 8GB+
- Storage: 50GB+ SSD
- CPU: 2+ cores

### 🔍 Monitoring & Maintenance

#### Daily Health Checks
```bash
./health-check-enhanced.sh
```

#### View Logs
```bash
docker logs chatbot-backend -f
docker logs chatbot-frontend -f
```

#### Restart Services
```bash
systemctl restart chatbot
# or
docker restart chatbot-backend chatbot-frontend
```

#### Update Application
```bash
git pull
./app-deploy.sh
```

### 🌐 Access URLs

After successful deployment:
- **Frontend:** `http://YOUR_SERVER_IP:4200`
- **Backend API:** `http://YOUR_SERVER_IP:3000`
- **API Documentation:** `http://YOUR_SERVER_IP:3000/api-docs`
- **Health Check:** `http://YOUR_SERVER_IP:3000/health`

### 🔧 Troubleshooting

#### Backend Won't Start
1. Check MongoDB URI encoding: `cat .env | grep MONGODB_URI`
2. Verify container logs: `docker logs chatbot-backend`
3. Test MongoDB connection manually
4. Check system resources: `./health-check-enhanced.sh`

#### Frontend Not Accessible
1. Check nginx configuration in container
2. Verify container networking: `docker network ls`
3. Test internal connectivity: `docker exec chatbot-frontend curl http://chatbot-backend:3000/health`

#### High Resource Usage
1. Check container stats: `docker stats`
2. Clean Docker system: `docker system prune -f`
3. Review application logs for errors
4. Consider vertical scaling (more RAM/CPU)

### 📁 File Structure

```
deployment/
├── vps-setup-complete.sh      # Complete VPS setup
├── env-setup.sh               # Environment configuration
├── app-deploy.sh              # Application deployment
├── health-check-enhanced.sh   # System monitoring
├── make-scripts-executable.sh # Script preparation
└── DEPLOYMENT_GUIDE.md        # This guide
```

### 🎯 Production Checklist

Before going live:
- [ ] VPS setup completed
- [ ] Environment variables configured
- [ ] Application deployed and healthy
- [ ] Firewall rules verified
- [ ] SSL certificate installed (optional)
- [ ] Domain DNS configured
- [ ] Facebook webhook URL updated
- [ ] Monitoring setup working
- [ ] Backup strategy implemented

### 📞 Support

If you encounter issues:
1. Run health check: `./health-check-enhanced.sh`
2. Check logs: `docker logs chatbot-backend`
3. Verify configuration: `cat .env`
4. Review this guide for common issues
5. Check container networking: `docker network ls`

### 🔄 Updates & Maintenance

**Weekly:**
- Run health checks
- Review logs for errors
- Update system packages
- Clean Docker system

**Monthly:**
- Review security logs
- Update application dependencies
- Backup configuration files
- Performance optimization review

---

**🎉 Congratulations!** You now have a production-ready Chatbot deployment with all lessons learned from real-world experience integrated into the scripts.

**Happy Chatbotting! 🤖**