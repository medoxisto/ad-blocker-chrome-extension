# Plan: Test Coverage Branch

## Phase 1: Create Source Modules
1. Extract pure functions from content.js → src/content-utils.js
2. Extract pure functions from background.js → src/background-utils.js
3. Create src/utils.js with shared utilities
4. Create src/popup-utils.js with popup logic

## Phase 2: Create Tests
1. Create tests/src-coverage.test.js
2. Mock Chrome APIs for extension context
3. Achieve 100% coverage on src/ modules

## Phase 3: Verify
1. Run npm install
2. Run jest --coverage
3. Verify 100% coverage threshold passes
4. Commit and push
