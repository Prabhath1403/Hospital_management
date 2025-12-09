#!/bin/bash
# Quick Start Script for Wednesday Healthcare Management System
# This script automates the setup process

echo "=========================================="
echo "Wednesday - Healthcare Management System"
echo "Quick Start Script"
echo "=========================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Navigate to infra directory
cd "$(dirname "$0")/infra" || exit 1

echo "🔧 Checking for .env file..."
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    cp .env.example .env 2>/dev/null || echo "Create .env manually using the template"
fi

echo ""
echo "🚀 Starting services..."
echo "This may take 1-2 minutes for first run..."
echo ""

docker-compose up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

echo ""
echo "=========================================="
echo "✅ Setup Complete!"
echo "=========================================="
echo ""
echo "Access the application:"
echo "  📱 Frontend: http://localhost:5173"
echo "  🔌 Backend API: http://localhost:8000"
echo "  📚 API Docs: http://localhost:8000/docs"
echo "  🐰 RabbitMQ: http://localhost:15672 (guest/guest)"
echo ""
echo "Useful commands:"
echo "  View logs: docker logs infra-backend-1"
echo "  Stop services: docker-compose down"
echo "  Restart: docker-compose restart"
echo ""
