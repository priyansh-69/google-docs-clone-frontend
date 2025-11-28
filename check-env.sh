#!/bin/bash

echo "🔍 Checking Environment Variables..."
echo ""

# Check if .env exists
if [ -f ".env" ]; then
    echo "✅ .env file found"
    echo "📄 Contents:"
    cat .env
    echo ""
else
    echo "❌ .env file NOT found!"
    echo "Create it with:"
    echo "echo 'REACT_APP_API_BASE_URL=https://google-docs-clone-backend-production-9892.up.railway.app' > .env"
    echo ""
fi

# Check if React is reading it
echo "🧪 Testing if React can read the variable..."
echo "Run: npm start"
echo "Then open browser console and type: console.log(process.env.REACT_APP_API_BASE_URL)"
echo ""

echo "📋 Expected value:"
echo "REACT_APP_API_BASE_URL=https://google-docs-clone-backend-production-9892.up.railway.app"
