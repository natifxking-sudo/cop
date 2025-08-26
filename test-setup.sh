#!/bin/bash

# Test script to verify basic project setup
echo "🧪 Testing COP Intelligence Platform Setup..."

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Test Node.js
echo "Testing Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js: $NODE_VERSION"
else
    print_error "Node.js not found"
fi

# Test npm
echo "Testing npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_success "npm: $NPM_VERSION"
else
    print_error "npm not found"
fi

# Test Java
echo "Testing Java..."
if command -v java &> /dev/null; then
    JAVA_VERSION=$(java -version 2>&1 | head -n 1)
    print_success "Java: $JAVA_VERSION"
else
    print_error "Java not found"
fi

# Test Maven
echo "Testing Maven..."
if command -v mvn &> /dev/null; then
    MAVEN_VERSION=$(mvn --version | head -n 1)
    print_success "Maven: $MAVEN_VERSION"
else
    print_warning "Maven not found (will be installed by setup script)"
fi

# Test PostgreSQL
echo "Testing PostgreSQL..."
if command -v psql &> /dev/null; then
    PSQL_VERSION=$(psql --version)
    print_success "PostgreSQL: $PSQL_VERSION"
else
    print_warning "PostgreSQL not found (will be installed by setup script)"
fi

# Test Redis
echo "Testing Redis..."
if command -v redis-server &> /dev/null; then
    REDIS_VERSION=$(redis-server --version)
    print_success "Redis: $REDIS_VERSION"
else
    print_warning "Redis not found (will be installed by setup script)"
fi

# Test MinIO
echo "Testing MinIO..."
if command -v minio &> /dev/null; then
    MINIO_VERSION=$(minio --version)
    print_success "MinIO: $MINIO_VERSION"
else
    print_warning "MinIO not found (will be installed by setup script)"
fi

# Test frontend dependencies
echo "Testing frontend dependencies..."
if [ -d "node_modules" ]; then
    print_success "Frontend dependencies installed"
else
    print_warning "Frontend dependencies not installed (will be installed by setup script)"
fi

# Test backend dependencies
echo "Testing backend dependencies..."
if [ -d "backend/target" ]; then
    print_success "Backend built"
else
    print_warning "Backend not built (will be built by setup script)"
fi

# Test environment files
echo "Testing environment files..."
if [ -f ".env.local" ]; then
    print_success "Frontend environment file exists"
else
    print_warning "Frontend environment file not found (will be created by setup script)"
fi

if [ -f "backend/.env" ]; then
    print_success "Backend environment file exists"
else
    print_warning "Backend environment file not found (will be created by setup script)"
fi

# Test startup scripts
echo "Testing startup scripts..."
if [ -f "start.sh" ] && [ -x "start.sh" ]; then
    print_success "Start script exists and is executable"
else
    print_warning "Start script not found (will be created by setup script)"
fi

if [ -f "stop.sh" ] && [ -x "stop.sh" ]; then
    print_success "Stop script exists and is executable"
else
    print_warning "Stop script not found (will be created by setup script)"
fi

echo ""
echo "🎯 Summary:"
echo "If you see mostly ✅ and ⚠️, the setup script should work properly."
echo "If you see ❌, you may need to install those dependencies manually first."
echo ""
echo "To run the full setup: ./setup.sh"
echo "To start the platform: ./start.sh (after setup)"