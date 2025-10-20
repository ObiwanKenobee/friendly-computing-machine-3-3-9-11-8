#!/bin/bash

# QuantumVest Build Fix Script
# Resolves import resolution issues and clears build cache

set -e

echo "🔧 Fixing build issues for QuantumVest platform..."

# Clear all caches
echo "📂 Clearing build caches..."
rm -rf node_modules/.vite
rm -rf dist
rm -rf .vite
rm -rf node_modules/.cache

# Clear npm cache
echo "🗑️  Clearing npm cache..."
npm cache clean --force

# Reinstall dependencies
echo "📦 Reinstalling dependencies..."
rm -rf node_modules
npm install

# Verify critical files exist
echo "✅ Verifying critical files..."
if [ ! -f "src/pages/global-payments.tsx" ]; then
    echo "❌ Missing global-payments.tsx file"
    exit 1
fi

if [ ! -f "src/pages/regional-payments.tsx" ]; then
    echo "❌ Missing regional-payments.tsx file"
    exit 1
fi

echo "✅ All critical files verified"

# Run type check
echo "🔍 Running type check..."
npm run type-check

# Try build
echo "🏗️  Attempting build..."
npm run build

echo "✅ Build successful!"
echo ""
echo "🚀 You can now run:"
echo "  npm run dev (for development)"
echo "  npm run preview (to preview built app)"
echo ""
