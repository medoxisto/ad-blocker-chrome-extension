# Ad Blocker — Block Ads, Pop-ups & YouTube Ads

A free, lightweight Chrome extension (Manifest V3) that blocks ads, pop-ups, banners, trackers and YouTube ads.

- **Free** — no account, no email, no data collected.
- **Open source** — GPL-3.0.
- **Manifest V3** — uses `declarativeNetRequest` for network blocking.

## How it works

The extension blocks at two layers:

- **Network layer:** `declarativeNetRequest` rule lists (`rules/network_rules.json`) drop known ad/tracker requests.
- **Content layer:** content scripts injected at `document_start`. One runs in the page's `MAIN` world and one in the `ISOLATED` world, so blocking logic runs before the page's own scripts execute.

## Install (from source)

1. Clone or download this repo.
2. Go to `chrome://extensions`.
3. Enable **Developer mode** (top right).
4. Click **Load unpacked** and select this folder.

## Chrome Web Store

https://chromewebstore.google.com/detail/ad-blocker-%E2%80%94-block-ads-po/cfcfhjclnllekcnfeoaaiicbjlmjmojk

## Permissions

- `declarativeNetRequest` — block ad/tracker network requests.
- `storage` / `unlimitedStorage` — store filter state locally.

No browsing data leaves your machine. See [PRIVACY.md](PRIVACY.md).

## License

[GPL-3.0](LICENSE).
