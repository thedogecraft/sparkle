#!/bin/bash

echo "====================================="
echo "  Sparkle Test Suite"
echo "====================================="
echo ""

if [ ! -d "node_modules/vitest" ]; then
    echo "⚠️  Test dependencies not found."
    echo ""
    echo "Install with:"
    echo "  npm install"
    echo ""
    exit 1
fi

echo "Running all tests..."
npm test