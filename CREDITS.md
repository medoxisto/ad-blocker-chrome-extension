# Credits & Licensing

Shield Ad Blocker is licensed under **GPL-3.0** (see `LICENSE`).

## Original code (© the Shield authors, GPL-3.0)
- `manifest.json`, `background.js`, `content.js`, `popup/*`, `icons/*`

## Third-party open-source components

| Component | Files | Project | License |
|---|---|---|---|
| Scriptlet engine | `scriptlets.js` | [@adguard/scriptlets](https://github.com/AdguardTeam/Scriptlets) | GPL-3.0 |
| Redirect resources | `redirects/*.js` | [@adguard/scriptlets](https://github.com/AdguardTeam/Scriptlets) | GPL-3.0 |
| Network blocking rules | `rules/network_rules.json` | [AdGuard Filters](https://github.com/AdguardTeam/FiltersRegistry) / [EasyList](https://easylist.to) | GPL-3.0 / CC BY-SA 3.0 |
| Cosmetic / element-hiding rules | `filters/1.json` | [AdGuard Filters](https://github.com/AdguardTeam/FiltersRegistry) / [EasyList](https://easylist.to) | GPL-3.0 / CC BY-SA 3.0 |

`scriptlets.js` is generated from the upstream `@adguard/scriptlets` core library
(unmodified scriptlet function bodies) with a thin dispatcher written by the Shield authors.

This product is not affiliated with or endorsed by AdGuard or the EasyList authors.
