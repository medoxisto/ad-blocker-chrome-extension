# Security

## No Data Collection

This extension:
- Does not collect any user data
- Does not send any telemetry
- Does not track browsing history
- Uses only local storage for settings

## Permissions

- `declarativeNetRequest` - Block network requests
- `storage` - Store extension settings locally

## Content Security

- Content scripts run in ISOLATED world
- Scriptlets run in MAIN world with CSP restrictions
- No eval() or inline scripts in extension code
