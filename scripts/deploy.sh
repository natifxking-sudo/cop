#!/bin/bash

# COP Platform Deployment Script

set -e

echo "🚀 Starting COP Platform deployment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed."
    exit 1
fi

# Create necessary directories
mkdir -p logs
mkdir -p data/postgres
mkdir -p data/redis
mkdir -p data/minio

# Set proper permissions
chmod 755 logs
chmod 755 data

# Pull latest images
echo "📦 Pulling latest images..."
docker-compose pull

# Build and start services
echo "🏗️ Building and starting services..."
docker-compose up --build -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check service health
echo "🔍 Checking service health..."
docker-compose ps

# Show logs
echo "📋 Recent logs:"
docker-compose logs --tail=50

echo "✅ COP Platform deployment completed!"
echo ""
echo "🌐 Services available at:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8080"
echo "   MinIO Console: http://localhost:9001"
echo "   PostgreSQL: localhost:5432"
echo "   Redis: localhost:6379"
echo ""
echo "📊 Health checks:"
echo "   Backend: http://localhost:8080/actuator/health"
echo "   Frontend: http://localhost:3000/api/health"
echo ""
echo "🔧 To stop services: docker-compose down"
echo "🗑️ To remove all data: docker-compose down -v"
