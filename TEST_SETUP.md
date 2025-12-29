# Test Setup Guide for Sparkle

This guide will help you set up and run the comprehensive unit tests for the Sparkle application.

## Overview

The test suite includes comprehensive tests for:
- **Zustand Store**: `sidebarStore` state management
- **React Components**: Dropdown, Greeting, InfoCard, TitleBar, Button, Card
- **Edge Cases**: Long text, special characters, unicode, rapid interactions
- **Accessibility**: ARIA attributes, keyboard navigation, screen readers
- **User Interactions**: Clicks, keyboard events, focus management

## Setup Instructions

### 1. Install Testing Dependencies

Add the following dependencies to your `package.json` under `devDependencies`:

```json
{
  "devDependencies": {
    "@testing-library/react": "^16.1.0",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/user-event": "^14.5.2",
    "@vitest/ui": "^2.1.8",
    "vitest": "^2.1.8",
    "jsdom": "^25.0.1",
    "happy-dom": "^15.11.7"
  }
}
```

### 2. Add Test Scripts

Add these scripts to your `package.json` under `scripts`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

### 3. Install Dependencies

```bash
npm install
```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests in UI Mode
```bash
npm run test:ui
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Specific Test File
```bash
npx vitest src/renderer/src/__tests__/store/sidebarStore.test.js
```

### Run Tests in Watch Mode
```bash
npx vitest --watch
```

## Test Structure