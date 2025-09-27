#!/bin/bash

# VizFlow Setup Script
echo "🚀 Setting up VizFlow - Data Processing & Visualization Platform"
echo "=================================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v16 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16 or higher is required. Current version: $(node --version)"
    exit 1
fi

echo "✅ Node.js $(node --version) detected"

# Setup Backend
echo ""
echo "📦 Setting up Backend..."
cd backend

if [ -f "package.json" ]; then
    echo "Installing backend dependencies..."
    npm install
    
    # Copy environment file
    if [ ! -f ".env" ]; then
        cp .env.example .env
        echo "⚠️  Please update the .env file with your MongoDB URI and other configurations"
    fi
    
    echo "✅ Backend setup complete"
else
    echo "❌ Backend package.json not found"
    exit 1
fi

# Setup Frontend
cd ../frontend
echo ""
echo "🎨 Setting up Frontend..."

if [ -f "package.json" ]; then
    echo "Installing frontend dependencies..."
    npm install
    echo "✅ Frontend setup complete"
else
    echo "❌ Frontend package.json not found"
    exit 1
fi

# Back to root
cd ..

echo ""
echo "🎉 Setup Complete!"
echo "==================="
echo ""
echo "📝 Next Steps:"
echo "1. Update backend/.env with your MongoDB URI"
echo "2. Start the backend: cd backend && npm run dev"
echo "3. Start the frontend: cd frontend && npm start"
echo ""
echo "🌐 URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:5000"
echo "   API Docs: http://localhost:5000/"
echo ""
echo "📖 For detailed instructions, see README.md"