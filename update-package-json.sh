#!/bin/bash

echo "Updating package.json with test dependencies..."

# Backup original
cp package.json package.json.backup

# Add test scripts and dependencies using jq
jq '.scripts += {
  "test": "vitest",
  "test:ui": "vitest --ui",
  "test:coverage": "vitest --coverage",
  "test:watch": "vitest --watch",
  "test:run": "vitest run"
} | .devDependencies += {
  "vitest": "^2.1.8",
  "@testing-library/react": "^16.1.0",
  "@testing-library/jest-dom": "^6.6.3",
  "@testing-library/user-event": "^14.5.2",
  "@vitest/ui": "^2.1.8",
  "@vitest/coverage-v8": "^2.1.8",
  "jsdom": "^25.0.1"
}' package.json > package.json.tmp && mv package.json.tmp package.json

echo "✓ Package.json updated successfully"
echo "✓ Backup saved as package.json.backup"
echo ""
echo "Run 'npm install' to install new dependencies"