# FAQ

## How does it block ads?

Uses Chrome's declarativeNetRequest API to block network requests to known ad domains, and content scripts to hide cosmetic ad elements.

## Does it collect data?

No. Zero telemetry, no accounts, no tracking.

## How do I allowlist a site?

Click the extension icon and toggle "allow on this site".

## Why some ads still show?

Some ads are loaded dynamically. The extension uses cosmetic filters, but some sites may require updated filter rules.
