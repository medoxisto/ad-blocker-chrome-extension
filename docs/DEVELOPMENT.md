# Development

## Setup

```bash
npm install
```

## Running Tests

```bash
npm test
```

## Project Structure

```
src/           - Pure business logic (testable in Node.js)
background.js   - Service worker
content.js     - Content script
popup/         - Popup UI
filters/       - Filter data
rules/         - Network rules
tests/         - Jest tests
```

## Chrome API Testing

Chrome APIs only exist in Chromium, not Node.js. Pure business logic is extracted to `src/` modules for testability.
