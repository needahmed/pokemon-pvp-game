#!/bin/bash

# Pokemon PVP Game - Quick Start Script

echo "🎮 Pokemon PVP Game - Starting servers..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  Creating .env file..."
    cat > .env << EOL
PORT=4000
CORS_ORIGIN=http://localhost:3000
DATABASE_URL=mongodb://localhost:27017/pokemon-pvp
EOL
    echo "✅ .env file created"
fi

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "⚠️  Creating .env.local file..."
    cat > .env.local << EOL
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
EOL
    echo "✅ .env.local file created"
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo "⚠️  Installing dependencies..."
    npm install
    echo "✅ Dependencies installed"
fi

echo ""
echo "🚀 Starting backend server on port 4000..."
echo "🚀 Starting frontend on port 3000..."
echo ""
echo "📝 Logs:"
echo "   - Backend: http://localhost:4000"
echo "   - Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Start both servers
npm run dev:all

