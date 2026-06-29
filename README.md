# Ad Blocker — Block Ads, Pop-ups & YouTube Ads (Free, Open Source, Undetectable)

A free, lightweight, open-source **ad blocker for Chrome** that blocks ads, pop-ups, banners, trackers and **YouTube ads** — and is built to keep working on sites that try to detect ad blockers and show you the *"please disable your ad blocker"* wall.

No account. No sign-up. No data collected. Just install it and the ads are gone.

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](LICENSE)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-green.svg)](manifest.json)
[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-Install-orange.svg)](https://chromewebstore.google.com/detail/ad-blocker-%E2%80%94-block-ads-po/cfcfhjclnllekcnfeoaaiicbjlmjmojk)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/medoxisto/ad-blocker-chrome-extension/pulls)

> **[➜ Install free from the Chrome Web Store](https://chromewebstore.google.com/detail/ad-blocker-%E2%80%94-block-ads-po/cfcfhjclnllekcnfeoaaiicbjlmjmojk)**

---

## Features

- 🚫 **Block ads** — display ads, banners, video ads and sponsored content across the web.
- 📺 **Block YouTube ads** — pre-roll, mid-roll and the non-skippable ones. No more "skip ad" countdown.
- 🪟 **Pop-up blocker** — stops pop-ups, pop-unders and those fake "you won a prize" overlays.
- 🔀 **Redirect blocker** — kills the redirect chains that bounce you through sketchy pages before you land.
- 🕵️ **Tracker blocking** — blocks third-party trackers and analytics that follow you around.
- 👻 **Hard to detect** — keeps working on many sites that normally detect ad blockers and gate their content.
- ⚡ **Fast & lightweight** — uses Chrome's native `declarativeNetRequest`, so blocking happens without slowing pages down.
- 🔒 **Private by design** — no account, no telemetry, no remote servers. Your browsing never leaves your device.

## Why another ad blocker?

Most popular ad blockers work great until a website puts up the *"we noticed you're using an ad blocker"* wall and refuses to load. That happens more and more — news sites, blogs, streaming sites.

The common myth is that sites recognize *which* extension you have. In reality, **anti-adblock systems usually detect the side effects of blocking**: did the ad script load, did the expected ad container exist, did certain page APIs behave normally?

This extension is built to deal with that by doing its work **early — at `document_start`, before the page's own scripts run** — so by the time a site checks "did the ad load?", things already look normal. It's not magic and no blocker wins 100% of the time, but this approach gets past a lot of the walls that catch the big-name blockers.

## How it works

The extension blocks at two layers:

| Layer | What it does | File |
|-------|--------------|------|
| **Network** | Drops known ad/tracker requests using Chrome's MV3 rule engine | [`rules/network_rules.json`](rules/network_rules.json) |
| **Content (MAIN world)** | Patches page behavior before the site's scripts execute | [`scriptlets.js`](scriptlets.js) |
| **Content (ISOLATED world)** | Hides leftover ad containers and manages your allowlist | [`content.js`](content.js) |

Both content scripts inject at `document_start` so the blocking logic runs **before** page scripts — that timing is the whole trick. See [`manifest.json`](manifest.json) for the exact `run_at` / `world` setup.

## Install

### From the Chrome Web Store (recommended)
**[Add to Chrome — it's free](https://chromewebstore.google.com/detail/ad-blocker-%E2%80%94-block-ads-po/cfcfhjclnllekcnfeoaaiicbjlmjmojk)**

### From source (for developers)
1. Download or clone this repo.
2. Open `chrome://extensions` in Chrome.
3. Turn on **Developer mode** (top-right).
4. Click **Load unpacked** and select the project folder.

Works on Chrome and other Chromium browsers (Edge, Brave, Opera, Vivaldi).

## FAQ

**How do I block ads in Chrome for free?**
Install this extension from the Chrome Web Store. It blocks ads automatically on every site — no setup and no payment.

**How do I block YouTube ads?**
Just install it. It removes pre-roll, mid-roll and skippable/non-skippable YouTube ads, and it's built to avoid YouTube's "ad blockers are not allowed" pop-up.

**Why do websites detect my ad blocker, and does this one get around it?**
Sites detect the *side effects* of blocking, not your extension's name. Because this one runs at `document_start` before the page's detection code, it gets past many of the walls that catch other ad blockers. No blocker is 100% undetectable forever, but this one holds up on a lot of sites that block the big names.

**Is it really free?**
Yes — completely free, open source (GPL-3.0), no account, no "pro" upsell.

**Does it collect my data?**
No. No accounts, no analytics, no remote servers. The only thing stored is your on/off toggle and your allowlist, kept locally on your device. See [PRIVACY.md](PRIVACY.md).

**What's the best free ad blocker for Chrome?**
Try this one and decide for yourself — that's the point of it being free and open source.

## Privacy

No data collection, no tracking, no phoning home. Full details in [PRIVACY.md](PRIVACY.md).

## Contributing

Found a site where ads slip through, or a false positive that breaks a page? **[Open an issue](https://github.com/medoxisto/ad-blocker-chrome-extension/issues)** with the URL. PRs welcome.

## License

Licensed under [GPL-3.0](LICENSE). Free to use, study, modify and share.

---

*Keywords: ad blocker, adblock, block ads, free ad blocker, best ad blocker, YouTube ad blocker, block YouTube ads, pop-up blocker, redirect blocker, ad blocker for Chrome, Chrome ad blocker extension, undetectable ad blocker, anti-adblock bypass, tracker blocker.*
