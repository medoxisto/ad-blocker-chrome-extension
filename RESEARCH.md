# Research: Test Coverage Branch

## Objective
Achieve 100% test coverage for the ad blocker Chrome extension by extracting pure business logic into testable src/ modules.

## Key Findings

### Architecture
- Chrome Extension MV3 with declarativeNetRequest for network blocking
- Content script runs in ISOLATED world
- Content script drives AdGuard scriptlets in MAIN world
- Pure business logic can be extracted from Chrome API dependencies

### Approach
1. Extract pure functions from content.js and background.js to src/ modules
2. Create Jest tests that mock Chrome APIs
3. Achieve 100% code coverage via unit tests

## Dependencies
- Jest for testing
- Chrome API mocks for extension context

## Constraints
- Must work with Node.js test environment
- No browser-specific APIs in src/ modules
- All side effects (Chrome API calls) must remain in main entry points
