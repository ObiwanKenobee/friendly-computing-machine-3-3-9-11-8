#!/bin/bash

# Comprehensive Build Error Checker for QuantumVest
# Identifies and reports all potential build failures

echo "🔍 QuantumVest Build Error Checker"
echo "=================================="

# Check for missing dependencies
echo "📦 Checking package.json dependencies..."
MISSING_DEPS=()

# Critical dependencies
REQUIRED_DEPS=("react" "react-dom" "react-router-dom" "@tanstack/react-query" "lucide-react" "zod" "@radix-ui/react-tooltip")

for dep in "${REQUIRED_DEPS[@]}"; do
  if ! grep -q "\"$dep\"" package.json; then
    MISSING_DEPS+=("$dep")
  fi
done

if [ ${#MISSING_DEPS[@]} -eq 0 ]; then
  echo "✅ All critical dependencies found"
else
  echo "❌ Missing dependencies: ${MISSING_DEPS[*]}"
fi

# Check for @ alias imports
echo ""
echo "🔗 Checking for problematic @ alias imports..."
ALIAS_IMPORTS=$(grep -r "@/" src/ --include="*.tsx" --include="*.ts" || true)
if [ -z "$ALIAS_IMPORTS" ]; then
  echo "✅ No @ alias imports found"
else
  echo "❌ Found @ alias imports (may cause build failures):"
  echo "$ALIAS_IMPORTS"
fi

# Check for missing files referenced in App.tsx
echo ""
echo "📄 Checking for missing component files..."
MISSING_FILES=()

# Extract lazy import paths from App.tsx
IMPORT_PATHS=$(grep -o "import(\"[^\"]*\")" src/App.tsx | sed 's/import("//g' | sed 's/")//g')

for path in $IMPORT_PATHS; do
  # Convert relative path to actual file path
  FULL_PATH="src/${path#./}.tsx"
  if [ ! -f "$FULL_PATH" ]; then
    # Try .ts extension
    FULL_PATH="src/${path#./}.ts"
    if [ ! -f "$FULL_PATH" ]; then
      MISSING_FILES+=("$path")
    fi
  fi
done

if [ ${#MISSING_FILES[@]} -eq 0 ]; then
  echo "✅ All referenced component files exist"
else
  echo "❌ Missing component files:"
  printf '%s\n' "${MISSING_FILES[@]}"
fi

# Check for missing UI components
echo ""
echo "🎨 Checking UI components..."
UI_COMPONENTS=("button" "card" "badge" "progress" "accordion" "dialog" "dropdown-menu" "select" "tabs" "toast" "tooltip")
MISSING_UI=()

for component in "${UI_COMPONENTS[@]}"; do
  if [ ! -f "src/components/ui/$component.tsx" ]; then
    MISSING_UI+=("$component")
  fi
done

if [ ${#MISSING_UI[@]} -eq 0 ]; then
  echo "✅ All UI components exist"
else
  echo "❌ Missing UI components: ${MISSING_UI[*]}"
fi

# Check TypeScript configuration
echo ""
echo "⚙️  Checking TypeScript configuration..."
if [ -f "tsconfig.json" ] && [ -f "tsconfig.app.json" ]; then
  echo "✅ TypeScript configuration files exist"
else
  echo "❌ Missing TypeScript configuration files"
fi

# Check for circular dependencies (basic check)
echo ""
echo "🔄 Checking for potential circular dependencies..."
CIRCULAR_DEPS=$(find src/ -name "*.ts" -o -name "*.tsx" | xargs grep -l "from ['\"].*services.*['\"]" | head -5)
if [ -n "$CIRCULAR_DEPS" ]; then
  echo "⚠️  Potential circular dependencies detected in services"
else
  echo "✅ No obvious circular dependencies detected"
fi

# Check for unused imports
echo ""
echo "🧹 Checking for potential unused imports..."
# This is a basic check - in production you'd use eslint
UNUSED_COUNT=$(find src/ -name "*.tsx" | xargs grep -c "^import.*from" | awk -F: '{sum+=$2} END {print sum}')
echo "ℹ️  Total imports found: $UNUSED_COUNT"

# Final recommendation
echo ""
echo "🚀 Build Recommendations:"
echo "1. Run 'npm install' to ensure all dependencies are installed"
echo "2. Run 'npm run type-check' to verify TypeScript compilation"
echo "3. Run 'npm run build' to test the build process"
echo ""

if [ ${#MISSING_DEPS[@]} -eq 0 ] && [ ${#MISSING_FILES[@]} -eq 0 ] && [ ${#MISSING_UI[@]} -eq 0 ] && [ -z "$ALIAS_IMPORTS" ]; then
  echo "✅ All checks passed! Build should succeed."
  exit 0
else
  echo "❌ Issues found that may cause build failures."
  exit 1
fi
