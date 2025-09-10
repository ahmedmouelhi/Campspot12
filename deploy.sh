#!/bin/bash

# CampSpot Deployment Script
echo "🏕️  Starting CampSpot deployment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Load environment variables
if [ -f .env.production ]; then
    export $(cat .env.production | grep -v '#' | xargs)
    echo "✅ Production environment variables loaded"
else
    echo "⚠️  .env.production file not found. Using default values."
fi

# Build and start containers
echo "🔨 Building Docker containers..."
docker-compose down
docker-compose build --no-cache

echo "🚀 Starting application..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo "✅ Deployment successful!"
    echo "🌐 Frontend: http://localhost"
    echo "🔌 Backend API: http://localhost:5000/api"
    echo "📚 API Documentation: http://localhost/api-docs"
else
    echo "❌ Deployment failed. Check logs with: docker-compose logs"
    exit 1
fi

echo "🎉 CampSpot is now running!"
