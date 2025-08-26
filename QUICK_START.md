# 🚀 Quick Start Guide

## One-Command Setup & Run

To get the COP Intelligence Platform running immediately:

```bash
# 1. Test your system (optional but recommended)
./test-setup.sh

# 2. Run the automated setup
./setup.sh

# 3. Start the platform
./start.sh
```

## Access the Application

After running the commands above:

- **🌐 Frontend**: http://localhost:3000
- **🔧 Backend API**: http://localhost:8080  
- **📁 MinIO Console**: http://localhost:9001
- **👤 Admin Login**: `admin` / `admin123`

## Stop the Platform

```bash
./stop.sh
```

## What the Setup Script Does

The `./setup.sh` script automatically:

1. ✅ Installs missing dependencies (Maven, PostgreSQL, Redis, MinIO)
2. ✅ Sets up the database with PostGIS extensions
3. ✅ Configures MinIO for file storage
4. ✅ Installs frontend and backend dependencies
5. ✅ Builds the Java backend application
6. ✅ Creates environment configuration files
7. ✅ Bootstraps an admin user
8. ✅ Creates startup/shutdown scripts

## Troubleshooting

If you encounter issues:

1. **Check system requirements**: `./test-setup.sh`
2. **View logs**: 
   - Frontend: `tail -f frontend.log`
   - Backend: `tail -f backend.log`
   - MinIO: `tail -f minio.log`
3. **Reset everything**: `./stop.sh && ./setup.sh`

## Manual Setup

If the automated setup doesn't work, see the full [README.md](README.md) for manual installation instructions.

---

**Note**: This platform requires Linux or macOS. For Windows, use WSL2 or a virtual machine.