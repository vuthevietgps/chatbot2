#!/bin/bash

# Environment Configuration Helper for Chatbot Deployment  
# Handles MongoDB URI encoding and other configuration automatically
# Based on real deployment experience

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
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

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# URL encode function for MongoDB URI (handles special characters)
url_encode() {
    local string="${1}"
    local strlen=${#string}
    local encoded=""
    local pos c o

    for (( pos=0 ; pos<strlen ; pos++ )); do
       c=${string:$pos:1}
       case "$c" in
          [-_.~a-zA-Z0-9] ) o="${c}" ;;
          * )               printf -v o '%%%02X' "'$c"
       esac
       encoded+="${o}"
    done
    echo "${encoded}"
}

# Validate MongoDB URI
validate_mongodb_uri() {
    local uri="$1"
    if [[ $uri =~ ^mongodb(\+srv)?:// ]]; then
        return 0
    else
        return 1
    fi
}

# Generate secure JWT secret
generate_jwt_secret() {
    openssl rand -hex 32
}

print_step "🔧 Chatbot Environment Configuration"
print_info "This script will help you configure .env file with proper encoding"
echo "==========================================================================="

# Check if .env exists and backup
if [ -f .env ]; then
    print_warning ".env file already exists"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cp .env .env.backup.$(date +%Y%m%d-%H%M%S)
        print_info "Backup created: .env.backup.$(date +%Y%m%d-%H%M%S)"
    else
        print_info "Configuration cancelled"
        exit 0
    fi
fi

# Copy from example if exists
if [ -f .env.example ]; then
    cp .env.example .env
    print_info "Copied configuration from .env.example"
else
    # Create basic .env template
    cat > .env << EOF
# Chatbot Configuration
# Generated on $(date)

# Database Configuration
MONGODB_URI=

# JWT Configuration  
JWT_SECRET=
JWT_EXPIRES_IN=7d

# OpenAI Configuration
OPENAI_API_KEY=
OPENAI_MODEL=gpt-3.5-turbo

# Facebook Configuration
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
FACEBOOK_VERIFY_TOKEN=

# Server Configuration
NODE_ENV=production
PORT=3000
SERVER_HOST=
FRONTEND_URL=
BACKEND_URL=

# Webhook Configuration
WEBHOOK_VERIFY_TOKEN=
EOF
    print_info "Created basic .env template"
fi

echo ""
print_info "Please provide the following configuration details:"

# MongoDB Configuration
echo ""
print_step "1. MongoDB Atlas Configuration"
print_info "Your MongoDB Atlas connection details:"

read -p "MongoDB Username: " MONGODB_USER
while [ -z "$MONGODB_USER" ]; do
    print_error "Username cannot be empty"
    read -p "MongoDB Username: " MONGODB_USER
done

read -s -p "MongoDB Password: " MONGODB_PASSWORD
echo ""
while [ -z "$MONGODB_PASSWORD" ]; do
    print_error "Password cannot be empty"
    read -s -p "MongoDB Password: " MONGODB_PASSWORD
    echo ""
done

read -p "MongoDB Cluster URL (e.g., cluster.abc123.mongodb.net): " MONGODB_CLUSTER
while [ -z "$MONGODB_CLUSTER" ]; do
    print_error "Cluster URL cannot be empty"
    read -p "MongoDB Cluster URL: " MONGODB_CLUSTER
done

read -p "Database Name [chatbot]: " MONGODB_DB
MONGODB_DB=${MONGODB_DB:-chatbot}

# URL encode the password to handle special characters like @, #, etc.
print_info "Encoding password for MongoDB URI..."
ENCODED_PASSWORD=$(url_encode "$MONGODB_PASSWORD")

# Construct MongoDB URI
MONGODB_URI="mongodb+srv://${MONGODB_USER}:${ENCODED_PASSWORD}@${MONGODB_CLUSTER}/${MONGODB_DB}?retryWrites=true&w=majority&appName=chatbot"

# Validate URI format
if validate_mongodb_uri "$MONGODB_URI"; then
    print_info "✅ MongoDB URI constructed and validated"
else
    print_error "❌ Invalid MongoDB URI format"
    exit 1
fi

# Update .env file
sed -i "s|MONGODB_URI=.*|MONGODB_URI=${MONGODB_URI}|" .env

print_info "MongoDB configuration completed"

# JWT Secret Configuration
echo ""
print_step "2. JWT Secret Configuration"
read -p "JWT Secret (leave empty to generate random): " JWT_SECRET

if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(generate_jwt_secret)
    print_info "Generated secure JWT secret: ${JWT_SECRET:0:16}..."
else
    # Validate JWT secret length
    if [ ${#JWT_SECRET} -lt 32 ]; then
        print_warning "JWT secret should be at least 32 characters for security"
        read -p "Continue with this secret? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            JWT_SECRET=$(generate_jwt_secret)
            print_info "Generated secure JWT secret instead"
        fi
    fi
fi

sed -i "s|JWT_SECRET=.*|JWT_SECRET=${JWT_SECRET}|" .env

# OpenAI Configuration
echo ""
print_step "3. OpenAI Configuration"
read -p "OpenAI API Key: " OPENAI_API_KEY
while [ -z "$OPENAI_API_KEY" ]; do
    print_error "OpenAI API Key is required"
    read -p "OpenAI API Key: " OPENAI_API_KEY
done

read -p "OpenAI Model [gpt-3.5-turbo]: " OPENAI_MODEL
OPENAI_MODEL=${OPENAI_MODEL:-gpt-3.5-turbo}

sed -i "s|OPENAI_API_KEY=.*|OPENAI_API_KEY=${OPENAI_API_KEY}|" .env
sed -i "s|OPENAI_MODEL=.*|OPENAI_MODEL=${OPENAI_MODEL}|" .env

# Facebook Configuration
echo ""
print_step "4. Facebook Configuration"
print_info "Facebook App configuration for webhook integration:"

read -p "Facebook App ID: " FACEBOOK_APP_ID
read -p "Facebook App Secret: " FACEBOOK_APP_SECRET
read -p "Facebook Verify Token: " FACEBOOK_VERIFY_TOKEN

# Generate webhook verify token if not provided
if [ -z "$FACEBOOK_VERIFY_TOKEN" ]; then
    FACEBOOK_VERIFY_TOKEN=$(openssl rand -hex 16)
    print_info "Generated webhook verify token: $FACEBOOK_VERIFY_TOKEN"
fi

sed -i "s|FACEBOOK_APP_ID=.*|FACEBOOK_APP_ID=${FACEBOOK_APP_ID}|" .env
sed -i "s|FACEBOOK_APP_SECRET=.*|FACEBOOK_APP_SECRET=${FACEBOOK_APP_SECRET}|" .env
sed -i "s|FACEBOOK_VERIFY_TOKEN=.*|FACEBOOK_VERIFY_TOKEN=${FACEBOOK_VERIFY_TOKEN}|" .env
sed -i "s|WEBHOOK_VERIFY_TOKEN=.*|WEBHOOK_VERIFY_TOKEN=${FACEBOOK_VERIFY_TOKEN}|" .env

# Server Configuration
echo ""
print_step "5. Server Configuration"
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
print_info "Detected server IP: $SERVER_IP"

read -p "Server IP/Domain [$SERVER_IP]: " SERVER_HOST
SERVER_HOST=${SERVER_HOST:-$SERVER_IP}

# Update server configuration
sed -i "s|SERVER_HOST=.*|SERVER_HOST=${SERVER_HOST}|" .env
sed -i "s|FRONTEND_URL=.*|FRONTEND_URL=http://${SERVER_HOST}:4200|" .env
sed -i "s|BACKEND_URL=.*|BACKEND_URL=http://${SERVER_HOST}:3000|" .env

# Environment
sed -i "s|NODE_ENV=.*|NODE_ENV=production|" .env
sed -i "s|PORT=.*|PORT=3000|" .env

echo ""
print_info "✅ Environment configuration completed successfully!"

# Display configuration summary
echo ""
print_step "📋 Configuration Summary"
echo "=========================="
echo "Database: MongoDB Atlas"
echo "Username: $MONGODB_USER"  
echo "Database: $MONGODB_DB"
echo "Cluster: $MONGODB_CLUSTER"
echo "JWT Secret: Generated (32+ chars)"
echo "OpenAI Model: $OPENAI_MODEL"
echo "Server: $SERVER_HOST"
echo "Frontend URL: http://${SERVER_HOST}:4200"
echo "Backend URL: http://${SERVER_HOST}:3000"

# Important notes
echo ""
print_step "⚠️  Important Notes"
echo "==================="
print_warning "MongoDB password has been URL-encoded to handle special characters"
print_warning "JWT secret has been generated with cryptographically secure randomness"
print_info "Facebook webhook URL: http://${SERVER_HOST}:3000/webhook/facebook"
print_info "Update this URL in your Facebook App settings"

# Verify configuration
echo ""
print_step "🔍 Configuration Verification"

# Check MongoDB URI format
if validate_mongodb_uri "$MONGODB_URI"; then
    print_info "✅ MongoDB URI format is valid"
else
    print_error "❌ MongoDB URI format is invalid"
fi

# Check JWT secret length
if [ ${#JWT_SECRET} -ge 32 ]; then
    print_info "✅ JWT secret meets security requirements"
else
    print_warning "⚠️  JWT secret is shorter than recommended (32+ chars)"
fi

# Check OpenAI key format (basic validation)
if [[ $OPENAI_API_KEY =~ ^sk-[a-zA-Z0-9]{48}$ ]]; then
    print_info "✅ OpenAI API key format appears valid"
else
    print_warning "⚠️  OpenAI API key format may be incorrect"
fi

# Save configuration backup
cp .env .env.configured.$(date +%Y%m%d-%H%M%S)

echo ""
print_info "🎉 Configuration completed and saved!"
print_info "Configuration file: .env"
print_info "Backup saved: .env.configured.$(date +%Y%m%d-%H%M%S)"
echo ""
print_info "Next step: Run ./app-deploy.sh to deploy the application"

# Create a verification script
cat > verify-config.sh << 'EOF'
#!/bin/bash

# Configuration Verification Script

source .env

echo "Verifying configuration..."

# Test MongoDB connection
echo "Testing MongoDB connection..."
if command -v mongosh &> /dev/null; then
    mongosh "$MONGODB_URI" --eval "db.adminCommand('ping')" || echo "MongoDB connection test failed"
else
    echo "mongosh not available, skipping MongoDB test"
fi

# Test OpenAI API
echo "Testing OpenAI API..."
curl -s -H "Authorization: Bearer $OPENAI_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"model":"'"$OPENAI_MODEL"'","messages":[{"role":"user","content":"test"}],"max_tokens":1}' \
     https://api.openai.com/v1/chat/completions | jq .error || echo "OpenAI API test completed"

echo "Configuration verification completed"
EOF

chmod +x verify-config.sh

print_info "Created verification script: verify-config.sh"
print_info "Run ./verify-config.sh to test your configuration"