#!/bin/bash

# Final Build Fix Script for QuantumVest
# Resolves all remaining build errors and ensures successful compilation

set -e

echo "🔧 QuantumVest Final Build Fix"
echo "============================="

# 1. Clear all caches and reset
echo "🧹 Clearing caches..."
rm -rf node_modules/.vite 2>/dev/null || true
rm -rf dist 2>/dev/null || true
rm -rf .vite 2>/dev/null || true

# 2. Install dependencies
echo "📦 Installing dependencies..."
npm install

# 3. Fix any remaining @ alias imports
echo "🔗 Fixing any remaining @ alias imports..."
find src/ -name "*.tsx" -o -name "*.ts" | xargs sed -i.bak 's|from "@/components/|from "../components/|g' 2>/dev/null || true
find src/ -name "*.tsx" -o -name "*.ts" | xargs sed -i.bak 's|from "@/|from "../|g' 2>/dev/null || true

# Clean up backup files
find src/ -name "*.bak" -delete 2>/dev/null || true

# 4. Verify critical files exist
echo "📄 Verifying critical files..."
CRITICAL_FILES=(
  "src/main.tsx"
  "src/App.tsx"
  "src/components/ui/button.tsx"
  "src/components/ui/card.tsx"
  "src/components/QuantumVestLandingPage.tsx"
  "src/pages/Index.tsx"
  "src/pages/global-payments-safe.tsx"
  "package.json"
  "tsconfig.json"
  "vite.config.ts"
)

MISSING_FILES=()
for file in "${CRITICAL_FILES[@]}"; do
  if [ ! -f "$file" ]; then
    MISSING_FILES+=("$file")
  fi
done

if [ ${#MISSING_FILES[@]} -ne 0 ]; then
  echo "❌ Missing critical files: ${MISSING_FILES[*]}"
  echo "Please ensure all files are present before building."
  exit 1
fi

# 5. Type check
echo "🔍 Running TypeScript type check..."
npm run type-check

# 6. Build test
echo "🏗️  Testing build process..."
npm run build

echo ""
echo "✅ All build errors resolved!"
echo "🚀 Build completed successfully!"
echo ""
echo "You can now run:"
echo "  npm run dev     (for development)"
echo "  npm run preview (to preview built app)"
echo "  npm run build   (for production build)"
