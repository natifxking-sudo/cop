# 🎯 COP Intelligence Collaboration Platform

A comprehensive **Common Operational Picture (COP)** intelligence collaboration platform that fuses **SOCMINT** (Social Media Intelligence), **SIGINT** (Signals Intelligence), and **HUMINT** (Human Intelligence) into a single operational view with role-based dashboards for HQ, Analysts, and Observers.

## 📋 Table of Contents

- [What is COP?](#what-is-cop)
- [Project Overview](#project-overview)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Features](#features)
- [Quick Start](#quick-start)
- [Manual Setup](#manual-setup)
- [Usage Guide](#usage-guide)
- [Development](#development)
- [Troubleshooting](#troubleshooting)

## 🎯 What is COP?

**Common Operational Picture (COP)** is a military and intelligence concept that provides a unified, real-time view of operational data from multiple sources. This platform brings together:

- **SOCMINT**: Social media intelligence gathering and analysis
- **SIGINT**: Signals intelligence from electronic communications
- **HUMINT**: Human intelligence from field operatives and sources

The platform correlates this intelligence into actionable events with confidence scoring, enabling better decision-making for headquarters and field operations.

## 🚀 Project Overview

This is a **full-stack intelligence collaboration platform** designed for:

- **Intelligence Analysts**: Input and analyze intelligence reports
- **HQ Decision Makers**: Review events and make operational decisions
- **Field Observers**: View approved intelligence and operational updates
- **System Administrators**: Manage users, roles, and system configuration

### Key Capabilities

✅ **Multi-Source Intelligence Fusion**: Correlate reports from different intelligence sources  
✅ **Role-Based Access Control**: Secure access based on clearance levels  
✅ **Real-Time Collaboration**: Live updates and notifications  
✅ **Geospatial Intelligence**: Map-based visualization with timeline control  
✅ **Evidence Management**: Secure file storage and metadata tracking  
✅ **Decision Support**: Confidence scoring and fusion algorithms  
✅ **Audit Trail**: Complete logging of all system activities  

## 🛠 Technology Stack

### Frontend (Modern Web Application)
- **Next.js 15**: React framework with server-side rendering
- **TypeScript**: Type-safe JavaScript development
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Radix UI**: Accessible component library
- **MapLibre GL**: Open-source mapping library
- **React Hook Form**: Form handling and validation
- **Zod**: Schema validation

### Backend (Enterprise Java Application)
- **Spring Boot 3**: Java framework for building web applications
- **Spring Security**: Authentication and authorization
- **Spring Data JPA**: Database access layer
- **Liquibase**: Database migration and version control
- **PostgreSQL + PostGIS**: Spatial database with geographic extensions
- **Redis**: Caching and session management
- **MinIO**: S3-compatible object storage

### Infrastructure & Services
- **PostgreSQL**: Primary database with PostGIS spatial extensions
- **Redis**: In-memory data store for caching
- **MinIO**: Object storage for file uploads
- **WebSocket**: Real-time communication
- **JWT**: Token-based authentication

### Development Tools
- **Maven**: Java dependency management and build tool
- **npm**: Node.js package manager
- **ESLint**: Code linting and formatting
- **TypeScript**: Static type checking

## 🏗 Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (Next.js)     │◄──►│   (Spring Boot) │◄──►│   (PostgreSQL)  │
│   Port: 3000    │    │   Port: 8080    │    │   Port: 5432    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   MinIO         │    │   Redis         │    │   File Storage  │
│   (Object Store)│    │   (Cache)       │    │   (Evidence)    │
│   Port: 9000    │    │   Port: 6379    │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Data Flow

1. **Intelligence Input**: Analysts submit reports via the web interface
2. **Data Processing**: Backend validates and stores data in PostgreSQL
3. **Fusion Algorithm**: System correlates reports into events with confidence scores
4. **Real-Time Updates**: WebSocket notifications keep all users synchronized
5. **Decision Support**: HQ reviews events and makes operational decisions
6. **Evidence Management**: Files stored in MinIO with metadata in database

## ✨ Features

### 🎭 Role-Based Dashboards

- **HQ Dashboard**: Event approval, decision management, analyst oversight
- **Analyst Dashboard**: Report submission, evidence upload, collaboration tools
- **Observer Dashboard**: Approved intelligence viewing, operational updates

### 🗺 Geospatial Intelligence

- Interactive maps with multiple layers
- Timeline-based event visualization
- Area of interest (AOI) management
- Spatial correlation algorithms

### 📊 Intelligence Fusion

- Multi-source correlation algorithms
- Confidence scoring based on:
  - Source reliability and credibility
  - Temporal proximity
  - Geographic proximity
  - Source diversity
- Automated event generation

### 🔐 Security & Access Control

- Role-based permissions (HQ, ANALYST_SOCMINT, ANALYST_SIGINT, ANALYST_HUMINT, OBSERVER)
- Clearance level enforcement
- Field-level access control
- Audit logging of all activities

### 📁 Evidence Management

- Secure file upload and storage
- Metadata tracking and search
- Classification-based access control
- Checksum verification for integrity

## 🚀 Quick Start

### One-Command Setup & Run

To get the COP Intelligence Platform running immediately:

```bash
# 1. Test your system (optional but recommended)
./test-setup.sh

# 2. Run the automated setup
./setup.sh

# 3. Start the platform
./start.sh
```

### Access the Application

After running the commands above:

- **🌐 Frontend**: http://localhost:3000
- **🔧 Backend API**: http://localhost:8080  
- **📁 MinIO Console**: http://localhost:9001
- **👤 Admin Login**: `admin` / `admin123`

### Stop the Platform

```bash
./stop.sh
```

### Prerequisites

Before running this project, you need:

- **Linux** or **macOS** operating system
- **Internet connection** for downloading dependencies
- **Administrator privileges** (for installing system packages)

### Automated Setup Details

The easiest way to get started is using our automated setup script:

```bash
# Download and run the setup script
curl -fsSL https://raw.githubusercontent.com/your-repo/cop-platform/main/setup.sh | bash
```

Or if you have the project locally:

```bash
# Make the script executable and run it
chmod +x setup.sh
./setup.sh
```

The setup script will:
1. ✅ Install all required dependencies (Node.js, Java, PostgreSQL, etc.)
2. ✅ Set up the database and create necessary users
3. ✅ Configure MinIO for file storage
4. ✅ Install frontend and backend dependencies
5. ✅ Create environment configuration files
6. ✅ Bootstrap an admin user
7. ✅ Create startup/shutdown scripts

### Start the Platform

After setup, start the platform with:

```bash
./start.sh
```

### Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **MinIO Console**: http://localhost:9001
- **Admin Login**: `admin` / `admin123`

### Stop the Platform

```bash
./stop.sh
```

## 🔧 Manual Setup

If you prefer to set up manually or the automated script doesn't work, follow these steps:

### 1. Install System Dependencies

#### Linux (Ubuntu/Debian)
```bash
# Update package list
sudo apt update

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Java 17
sudo apt-get install -y openjdk-17-jdk

# Install Maven
sudo apt-get install -y maven

# Install PostgreSQL with PostGIS
sudo apt-get install -y postgresql postgresql-contrib postgis

# Install Redis
sudo apt-get install -y redis-server

# Start services
sudo systemctl start postgresql
sudo systemctl enable postgresql
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

#### macOS
```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install dependencies
brew install node@20
brew install openjdk@17
brew install maven
brew install postgresql postgis
brew install redis

# Start services
brew services start postgresql
brew services start redis
```

### 2. Install MinIO

#### Linux
```bash
wget https://dl.min.io/server/minio/release/linux-amd64/minio
chmod +x minio
sudo mv minio /usr/local/bin/
```

#### macOS
```bash
brew install minio/stable/minio
```

### 3. Set Up Database

```bash
# Create database user and database
sudo -u postgres psql -c "CREATE USER cop_user WITH PASSWORD 'cop_password';"
sudo -u postgres psql -c "CREATE DATABASE cop_prod OWNER cop_user;"
sudo -u postgres psql -d cop_prod -c "CREATE EXTENSION IF NOT EXISTS postgis;"
```

### 4. Install Project Dependencies

```bash
# Install frontend dependencies
npm install

# Build backend
cd backend
mvn clean install -DskipTests
cd ..
```

### 5. Configure Environment

Create `.env.local` in the project root:

```env
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
```

### 6. Start Services

```bash
# Start MinIO
mkdir -p ~/minio-data
minio server ~/minio-data --console-address ":9001" &

# Start backend
cd backend
mvn spring-boot:run &

# Start frontend
npm run dev
```

## 📖 Usage Guide

### First Time Setup

1. **Access the Application**: Open http://localhost:3000
2. **Login**: Use `admin` / `admin123`
3. **Create Users**: Go to Admin panel to create analyst accounts
4. **Configure Roles**: Assign appropriate roles to users

### For Intelligence Analysts

1. **Submit Reports**: Use the "New Report" button to submit intelligence
2. **Upload Evidence**: Attach files and documents to reports
3. **Collaborate**: Use chat and notification features
4. **Track Events**: Monitor how your reports contribute to events

### For HQ Decision Makers

1. **Review Events**: Examine fused intelligence events
2. **Make Decisions**: Approve or reject events
3. **Request Information**: Ask analysts for additional details
4. **Monitor Operations**: Track all ongoing intelligence activities

### For Observers

1. **View Approved Intelligence**: Access HQ-approved events
2. **Stay Updated**: Receive notifications about new intelligence
3. **Operational Awareness**: Maintain situational awareness

## 🛠 Development

### Project Structure

```
cop-platform/
├── app/                    # Next.js app directory (pages and API routes)
├── components/             # Reusable React components
├── lib/                    # Utility functions and services
├── hooks/                  # Custom React hooks
├── styles/                 # Global styles and Tailwind config
├── public/                 # Static assets
├── backend/                # Spring Boot application
│   ├── src/main/java/      # Java source code
│   ├── src/main/resources/ # Configuration files
│   └── pom.xml            # Maven dependencies
├── scripts/                # Database scripts and utilities
├── keycloak/               # Keycloak configuration (optional)
└── microservices/          # Microservice implementations
```

### Key Files

- `package.json`: Frontend dependencies and scripts
- `backend/pom.xml`: Backend dependencies and build configuration
- `next.config.mjs`: Next.js configuration
- `tsconfig.json`: TypeScript configuration
- `tailwind.config.js`: Tailwind CSS configuration

### Development Commands

```bash
# Frontend development
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint

# Backend development
cd backend
mvn spring-boot:run  # Start Spring Boot application
mvn test            # Run tests
mvn clean install   # Build and install

# Database
psql -d cop_prod -U cop_user  # Connect to database
```

### Adding New Features

1. **Frontend**: Add components in `components/` directory
2. **API Routes**: Create new routes in `app/api/` directory
3. **Backend**: Add controllers and services in `backend/src/main/java/`
4. **Database**: Create Liquibase migrations in `backend/src/main/resources/db/changelog/`

## 🔍 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Check what's using the port
sudo lsof -i :3000
sudo lsof -i :8080

# Kill the process
sudo kill -9 <PID>
```

#### Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql

# Test connection
psql -d cop_prod -U cop_user -h localhost
```

#### MinIO Issues
```bash
# Check if MinIO is running
pgrep -f "minio server"

# Restart MinIO
pkill -f "minio server"
minio server ~/minio-data --console-address ":9001" &
```

#### Java/Maven Issues
```bash
# Check Java version
java -version

# Check Maven version
mvn --version

# Clean and rebuild
cd backend
mvn clean install
```

### Logs

Check application logs for debugging:

```bash
# Frontend logs
tail -f frontend.log

# Backend logs
tail -f backend.log

# MinIO logs
tail -f minio.log
```

### Reset Everything

To completely reset the platform:

```bash
# Stop all services
./stop.sh

# Drop and recreate database
sudo -u postgres psql -c "DROP DATABASE IF EXISTS cop_prod;"
sudo -u postgres psql -c "CREATE DATABASE cop_prod OWNER cop_user;"
sudo -u postgres psql -d cop_prod -c "CREATE EXTENSION IF NOT EXISTS postgis;"

# Clear MinIO data
rm -rf ~/minio-data

# Re-run setup
./setup.sh
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review the logs for error messages
3. Ensure all dependencies are properly installed
4. Verify database and service connections

For additional help, please open an issue in the project repository.

---

**Note**: This platform is designed for educational and demonstration purposes. For production use, ensure proper security hardening, environment-specific configurations, and compliance with relevant regulations.