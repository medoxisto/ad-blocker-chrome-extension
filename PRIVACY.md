# Privacy Policy — Shield Ad Blocker

**Effective date:** 2026-06-24

Shield Ad Blocker does **not** collect, transmit, sell, or share any personal or
browsing data. There are no accounts, no analytics, no remote servers, and no
network requests made by the extension to any first- or third-party endpoint.

## What is stored
The extension stores two settings **locally on your device** using `chrome.storage.local`:
- whether protection is globally on or off;
- the list of website hostnames you chose to allow ads on (your allowlist).

This data never leaves your browser and is removed when you uninstall the extension.

## Permissions and why they are used
- **declarativeNetRequest** — block ad/tracker network requests using a bundled rule list. Chrome applies these rules internally; the extension does not see your browsing history.
- **storage** — save your on/off and allowlist settings locally.
- **scripting / host access (`<all_urls>`)** — run the cosmetic content script that hides leftover ad containers on the pages you visit. It reads only your local settings and sends nothing anywhere.

## Contact
For questions about this policy, contact: <your-email@example.com>
