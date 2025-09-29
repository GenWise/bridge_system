#!/bin/bash

# Uma + PS Bridge System Launch Script

echo "🃏 Uma + PS Bridge System"
echo "========================="
echo ""

# Check if Python 3 is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    echo "Please install Python 3 and try again."
    exit 1
fi

# Get the directory where this script is located
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$DIR"

# Check if all required files exist
REQUIRED_FILES=("index.html" "app.js" "styles.css" "data.json" "server.py")
for file in "${REQUIRED_FILES[@]}"; do
    if [[ ! -f "$file" ]]; then
        echo "❌ Required file missing: $file"
        exit 1
    fi
done

echo "✅ All required files found"
echo ""

# Find an available port
PORT=8000
while lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; do
    PORT=$((PORT + 1))
done

echo "🚀 Starting server on port $PORT..."
echo ""

# Start the server
python3 server.py --port $PORT

echo ""
echo "👋 Server stopped. Thanks for using Uma + PS Bridge System!"