#!/bin/bash

# COP Intelligence Platform Setup Script
# This script sets up the entire project without Docker

set -e  # Exit on any error

echo "🚀 Setting up COP Intelligence Platform..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root"
   exit 1
fi

# Detect OS
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
else
    print_error "Unsupported operating system: $OSTYPE"
    exit 1
fi

print_status "Detected OS: $OS"

# Check and install Node.js
check_nodejs() {
    if ! command -v node &> /dev/null; then
        print_warning "Node.js not found. Installing..."
        if [[ "$OS" == "linux" ]]; then
            # Install Node.js on Linux
            curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
            sudo apt-get install -y nodejs
        elif [[ "$OS" == "macos" ]]; then
            # Install Node.js on macOS
            if ! command -v brew &> /dev/null; then
                print_error "Homebrew not found. Please install Homebrew first: https://brew.sh/"
                exit 1
            fi
            brew install node@20
        fi
    else
        NODE_VERSION=$(node --version)
        print_success "Node.js found: $NODE_VERSION"
    fi
}

# Check and install Java
check_java() {
    if ! command -v java &> /dev/null; then
        print_warning "Java not found. Installing..."
        if [[ "$OS" == "linux" ]]; then
            sudo apt-get update
            sudo apt-get install -y openjdk-17-jdk
        elif [[ "$OS" == "macos" ]]; then
            brew install openjdk@17
            sudo ln -sfn /opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk-17.jdk
        fi
    else
        JAVA_VERSION=$(java -version 2>&1 | head -n 1)
        print_success "Java found: $JAVA_VERSION"
    fi
}

# Check and install Maven
check_maven() {
    if ! command -v mvn &> /dev/null; then
        print_warning "Maven not found. Installing..."
        if [[ "$OS" == "linux" ]]; then
            sudo apt-get install -y maven
        elif [[ "$OS" == "macos" ]]; then
            brew install maven
        fi
    else
        MAVEN_VERSION=$(mvn --version | head -n 1)
        print_success "Maven found: $MAVEN_VERSION"
    fi
}

# Check and install PostgreSQL
check_postgresql() {
    if ! command -v psql &> /dev/null; then
        print_warning "PostgreSQL not found. Installing..."
        if [[ "$OS" == "linux" ]]; then
            sudo apt-get update
            sudo apt-get install -y postgresql postgresql-contrib postgis
            sudo systemctl start postgresql
            sudo systemctl enable postgresql
        elif [[ "$OS" == "macos" ]]; then
            brew install postgresql postgis
            brew services start postgresql
        fi
    else
        print_success "PostgreSQL found"
    fi
}

# Check and install Redis
check_redis() {
    if ! command -v redis-server &> /dev/null; then
        print_warning "Redis not found. Installing..."
        if [[ "$OS" == "linux" ]]; then
            sudo apt-get install -y redis-server
            sudo systemctl start redis-server
            sudo systemctl enable redis-server
        elif [[ "$OS" == "macos" ]]; then
            brew install redis
            brew services start redis
        fi
    else
        print_success "Redis found"
    fi
}

# Check and install MinIO
check_minio() {
    if ! command -v minio &> /dev/null; then
        print_warning "MinIO not found. Installing..."
        if [[ "$OS" == "linux" ]]; then
            wget https://dl.min.io/server/minio/release/linux-amd64/minio
            chmod +x minio
            sudo mv minio /usr/local/bin/
            
            # Install MinIO client
            wget https://dl.min.io/client/mc/release/linux-amd64/mc
            chmod +x mc
            sudo mv mc /usr/local/bin/
        elif [[ "$OS" == "macos" ]]; then
            brew install minio/stable/minio
            brew install minio/stable/mc
        fi
    else
        print_success "MinIO found"
    fi
}

# Setup PostgreSQL database
setup_database() {
    print_status "Setting up PostgreSQL database..."
    
    # Create database and user
    if [[ "$OS" == "linux" ]]; then
        sudo -u postgres psql -c "CREATE USER cop_user WITH PASSWORD 'cop_password';" || true
        sudo -u postgres psql -c "CREATE DATABASE cop_prod OWNER cop_user;" || true
        sudo -u postgres psql -d cop_prod -c "CREATE EXTENSION IF NOT EXISTS postgis;" || true
    elif [[ "$OS" == "macos" ]]; then
        psql postgres -c "CREATE USER cop_user WITH PASSWORD 'cop_password';" || true
        psql postgres -c "CREATE DATABASE cop_prod OWNER cop_user;" || true
        psql -d cop_prod -c "CREATE EXTENSION IF NOT EXISTS postgis;" || true
    fi
    
    print_success "Database setup complete"
}

# Setup MinIO
setup_minio() {
    print_status "Setting up MinIO..."
    
    # Create MinIO data directory
    mkdir -p ~/minio-data
    
    # Start MinIO in background
    nohup minio server ~/minio-data --console-address ":9001" > minio.log 2>&1 &
    MINIO_PID=$!
    echo $MINIO_PID > minio.pid
    
    # Wait for MinIO to start
    sleep 5
    
    # Create bucket
    mc alias set myminio http://localhost:9000 cop_minio_user cop_minio_password
    mc mb myminio/cop-files || true
    
    print_success "MinIO setup complete"
}

# Install frontend dependencies
setup_frontend() {
    print_status "Setting up frontend dependencies..."
    npm install
    print_success "Frontend dependencies installed"
}

# Build backend
setup_backend() {
    print_status "Building backend..."
    cd backend
    mvn clean install -DskipTests
    cd ..
    print_success "Backend built successfully"
}

# Create environment files
create_env_files() {
    print_status "Creating environment files..."
    
    # Frontend .env.local
    cat > .env.local << EOF
# Database
DATABASE_URL=postgres://cop_user:cop_password@localhost:5432/cop_prod

# JWT (for development only)
JWT_SECRET=your-256-bit-secret-key-here-change-in-production
JWT_EXPIRES_IN=24h

# MinIO
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=cop_minio_user
MINIO_SECRET_KEY=cop_minio_password
MINIO_BUCKET=cop-files

# API URLs
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:3000

# Keycloak (optional for development)
NEXT_PUBLIC_KEYCLOAK_URL=http://localhost:8085
NEXT_PUBLIC_KEYCLOAK_REALM=cop
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=cop-frontend
EOF

    # Backend environment
    cat > backend/.env << EOF
# Database
DB_USERNAME=cop_user
DB_PASSWORD=cop_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# MinIO
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=cop_minio_user
MINIO_SECRET_KEY=cop_minio_password
MINIO_BUCKET=cop-files

# JWT
JWT_SECRET=your-256-bit-secret-key-here-change-in-production

# Keycloak
KEYCLOAK_ISSUER_URI=http://localhost:8085/realms/cop
EOF

    print_success "Environment files created"
}

# Bootstrap admin user
bootstrap_admin() {
    print_status "Bootstrapping admin user..."
    export DATABASE_URL="postgres://cop_user:cop_password@localhost:5432/cop_prod"
    export ADMIN_USERNAME="admin"
    export ADMIN_PASSWORD="admin123"
    node scripts/bootstrap-admin.mjs
    print_success "Admin user created: admin/admin123"
}

# Create startup script
create_startup_script() {
    print_status "Creating startup script..."
    
    cat > start.sh << 'EOF'
#!/bin/bash

# COP Intelligence Platform Startup Script

set -e

echo "🚀 Starting COP Intelligence Platform..."

# Start MinIO if not running
if ! pgrep -f "minio server" > /dev/null; then
    echo "Starting MinIO..."
    nohup minio server ~/minio-data --console-address ":9001" > minio.log 2>&1 &
    echo $! > minio.pid
    sleep 3
fi

# Start backend
echo "Starting backend..."
cd backend
nohup mvn spring-boot:run > ../backend.log 2>&1 &
echo $! > ../backend.pid
cd ..

# Wait for backend to start
sleep 10

# Start frontend
echo "Starting frontend..."
nohup npm run dev > frontend.log 2>&1 &
echo $! > frontend.pid

echo "✅ Platform started successfully!"
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:8080"
echo "MinIO Console: http://localhost:9001"
echo "Admin user: admin/admin123"
echo ""
echo "Logs:"
echo "  Frontend: tail -f frontend.log"
echo "  Backend: tail -f backend.log"
echo "  MinIO: tail -f minio.log"
echo ""
echo "To stop: ./stop.sh"
EOF

    chmod +x start.sh
    
    # Create stop script
    cat > stop.sh << 'EOF'
#!/bin/bash

echo "🛑 Stopping COP Intelligence Platform..."

# Stop frontend
if [ -f frontend.pid ]; then
    kill $(cat frontend.pid) 2>/dev/null || true
    rm frontend.pid
fi

# Stop backend
if [ -f backend.pid ]; then
    kill $(cat backend.pid) 2>/dev/null || true
    rm backend.pid
fi

# Stop MinIO
if [ -f minio.pid ]; then
    kill $(cat minio.pid) 2>/dev/null || true
    rm minio.pid
fi

echo "✅ Platform stopped"
EOF

    chmod +x stop.sh
    
    print_success "Startup scripts created"
}

# Main setup process
main() {
    print_status "Starting setup process..."
    
    check_nodejs
    check_java
    check_maven
    check_postgresql
    check_redis
    check_minio
    
    setup_database
    setup_minio
    setup_frontend
    setup_backend
    create_env_files
    bootstrap_admin
    create_startup_script
    
    print_success "Setup complete! 🎉"
    echo ""
    echo "Next steps:"
    echo "1. Run: ./start.sh"
    echo "2. Open: http://localhost:3000"
    echo "3. Login with: admin/admin123"
    echo ""
    echo "To stop the platform: ./stop.sh"
}

# Run main function
main "$@"