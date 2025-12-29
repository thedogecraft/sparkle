# Sparkle Test Suite

Comprehensive unit and integration tests for Sparkle v2..HEAD changes.

## Quick Start

### 1. Install Dependencies

```bash
./update-package-json.sh
npm install
```

### 2. Run Tests

```bash
npm test
```

## Test Coverage

### Modified Files Tested

1. **sidebarStore.js** (NEW) - 75+ assertions
   - Store state management
   - Toggle and setCollapsed functions
   - LocalStorage persistence
   - State synchronization

2. **dropdown.jsx** (MODIFIED) - 100+ assertions
   - Portal rendering
   - Click-outside behavior
   - Keyboard accessibility
   - Window resize/scroll handling

3. **nav.jsx** (MODIFIED) - 120+ assertions
   - Sidebar integration
   - Navigation routing
   - Active tab highlighting
   - Restart button functionality

4. **registry.json & registry-scripts.json** (MODIFIED) - 60+ assertions
   - Schema validation
   - Version timestamp checks
   - Cross-file consistency
   - Data integrity

## Test Commands

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:ui       # Interactive UI
npm run test:coverage # Generate coverage report
npm run test:run      # CI mode (run once)
```

## Test File Structure