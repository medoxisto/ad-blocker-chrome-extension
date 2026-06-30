# Architecture

## Overview

This extension uses a two-layer ad blocking approach:

1. **Network Layer** - Chrome's declarativeNetRequest API blocks requests at the network level
2. **Content Layer** - Content scripts inject CSS and run scriptlets to hide cosmetic ads

## Components

### src/ (Pure Business Logic)
- `utils.js` - URL parsing, filter merging, CSS building
- `content-utils.js` - Content filtering logic
- `background-utils.js` - Extension state management
- `popup-utils.js` - Popup UI logic

These modules are testable in Node.js without Chrome APIs.

### Source Files
- `background.js` - Service worker entry point
- `content.js` - Content script (ISOLATED world)
- `scriptlets.js` - AdGuard scriptlets (MAIN world)
- `popup/popup.js` - Extension popup UI

## Data Flow

1. Extension installs → `populateFilters()` loads filter data into storage
2. Page loads → Content script reads filters from storage
3. Filters matched → CSS injected, scriptlets dispatched
4. User toggles → `applyState()` updates declarativeNetRequest rules
