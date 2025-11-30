#!/bin/bash
# Auto-restart dev server if it crashes
# Run this from macOS Terminal (not VS Code): ./start-dev.sh

cd "$(dirname "$0")"

echo "🚀 Starting dev server with auto-restart..."
echo "Press Ctrl+C twice quickly to stop."
echo ""

while true; do
    npm run dev
    echo ""
    echo "⚠️  Dev server stopped. Restarting in 2 seconds..."
    echo "   (Press Ctrl+C again within 2 seconds to exit)"
    sleep 2
done
