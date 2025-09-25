#!/bin/bash

# Make all deployment scripts executable
# Run this script to prepare all deployment files

chmod +x vps-setup-complete.sh
chmod +x app-deploy.sh  
chmod +x env-setup.sh
chmod +x health-check-enhanced.sh

echo "✅ All deployment scripts are now executable!"
echo ""
echo "Usage order:"  
echo "1. ./vps-setup-complete.sh    - Complete VPS setup (run as root)"
echo "2. ./env-setup.sh             - Configure environment variables"
echo "3. ./app-deploy.sh            - Deploy the application"
echo "4. ./health-check-enhanced.sh - Check system health"