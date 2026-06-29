// Shield Ad Blocker — background service worker (MV3)
// Clean glue: no telemetry, no remote servers, no remote-rule updates.
// Responsibilities: blocked-count badge, global on/off + per-site allowlist (declarativeNetRequest),
// and a one-time load of the bundled cosmetic data into chrome.storage.local for the content script.

const RULESET_ID = "ads";
const ALLOWLIST_KEY = "allowlist";
const ENABLED_KEY = "enabled";
const FILTERS_VERSION_KEY = "_filters_version";
const FILTERS_VERSION = 1;          // bump when filters/1.json changes to trigger a reload
const DYN_RULE_BASE = 1000000;      // dynamic allow-rule ids, well above the static set

async function initBadge() {
  try {
    await chrome.declarativeNetRequest.setExtensionActionOptions({
      displayActionCountAsBadgeText: true
    });
  } catch (e) { /* not fatal */ }
}

async function getState() {
  const d = await chrome.storage.local.get({ [ENABLED_KEY]: true, [ALLOWLIST_KEY]: [] });
  return { enabled: d[ENABLED_KEY], allowlist: d[ALLOWLIST_KEY] };
}

function hostnameOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return null; }
}

// Toggle the static ruleset (global switch) and rebuild dynamic allow rules (per-site allowlist).
async function applyState() {
  const { enabled, allowlist } = await getState();

  const current = await chrome.declarativeNetRequest.getEnabledRulesets();
  const isOn = current.includes(RULESET_ID);
  if (enabled && !isOn) {
    await chrome.declarativeNetRequest.updateEnabledRulesets({ enableRulesetIds: [RULESET_ID] });
  } else if (!enabled && isOn) {
    await chrome.declarativeNetRequest.updateEnabledRulesets({ disableRulesetIds: [RULESET_ID] });
  }

  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  const removeRuleIds = existing.map(r => r.id);
  const addRules = enabled
    ? allowlist.map((host, i) => ({
        id: DYN_RULE_BASE + i,
        priority: 100000,                     // beat any static block rule
        action: { type: "allowAllRequests" },
        condition: { requestDomains: [host], resourceTypes: ["main_frame", "sub_frame"] }
      }))
    : [];
  await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds, addRules });
}

// Load the bundled cosmetic/scriptlet data into storage as one key per domain ("f:<domain>"),
// so the content script can look up its page with a fast indexed read. Runs once per version.
async function populateFilters() {
  try {
    const { [FILTERS_VERSION_KEY]: v } = await chrome.storage.local.get(FILTERS_VERSION_KEY);
    if (v === FILTERS_VERSION) return;

    const res = await fetch(chrome.runtime.getURL("filters/1.json"));
    const data = await res.json();

    // Clear any previous f: keys, then write fresh ones in batches.
    const all = await chrome.storage.local.get(null);
    const oldKeys = Object.keys(all).filter(k => k.startsWith("f:"));
    if (oldKeys.length) await chrome.storage.local.remove(oldKeys);

    let batch = {};
    let n = 0;
    for (const [domain, entry] of Object.entries(data)) {
      batch["f:" + domain] = entry;
      if (++n % 3000 === 0) { await chrome.storage.local.set(batch); batch = {}; }
    }
    if (Object.keys(batch).length) await chrome.storage.local.set(batch);
    await chrome.storage.local.set({ [FILTERS_VERSION_KEY]: FILTERS_VERSION });
  } catch (e) {
    // Non-fatal: network blocking still works without cosmetic data.
    console.warn("Shield: filter load failed", e);
  }
}

chrome.runtime.onInstalled.addListener(async () => {
  await initBadge();
  await applyState();
  await populateFilters();
});

chrome.runtime.onStartup.addListener(async () => {
  await initBadge();
  await applyState();
});

// Popup messages.
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    if (msg.type === "getStatus") {
      const { enabled, allowlist } = await getState();
      const host = hostnameOf(msg.url);
      sendResponse({ enabled, host, siteAllowed: host ? allowlist.includes(host) : false });
    } else if (msg.type === "toggleGlobal") {
      const { enabled } = await getState();
      await chrome.storage.local.set({ [ENABLED_KEY]: !enabled });
      await applyState();
      sendResponse({ enabled: !enabled });
    } else if (msg.type === "toggleSite") {
      const { allowlist } = await getState();
      const next = allowlist.includes(msg.host)
        ? allowlist.filter(h => h !== msg.host)
        : [...allowlist, msg.host];
      await chrome.storage.local.set({ [ALLOWLIST_KEY]: next });
      await applyState();
      sendResponse({ siteAllowed: next.includes(msg.host) });
    }
  })();
  return true; // async response
});
