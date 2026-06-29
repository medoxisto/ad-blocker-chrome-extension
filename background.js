// Shield Ad Blocker — background service worker (MV3)
// Clean glue: no telemetry, no remote servers, no remote-rule updates.
// Responsibilities: blocked-count badge, global on/off + per-site allowlist (declarativeNetRequest),
// and a one-time load of the bundled cosmetic data into chrome.storage.local for the content script.

const RULESET_ID = "ads";
const ALLOWLIST_KEY = "allowlist";
const ENABLED_KEY = "enabled";
const FILTERS_VERSION_KEY = "_filters_ready_version";
const FILTERS_VERSION = 1;          // bump when filters/1.json changes to trigger a reload. Sync with content.js
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
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    const host = parsed.hostname.replace(/^www\./, "");
    return host || null;
  } catch {
    return null;
  }
}

function candidates(h) {
  const out = new Set();
  const base = h.replace(/^www\./, "");
  for (const v of [h, base]) {
    const parts = v.split(".");
    for (let i = 0; i + 2 <= parts.length; i++) out.add(parts.slice(i).join("."));
  }
  return [...out];
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
        priority: 2000000,                    // beat any static block rule (max static priority is ~1,100,302)
        action: { type: "allowAllRequests" },
        condition: { requestDomains: [host], resourceTypes: ["main_frame", "sub_frame"] }
      }))
    : [];
  await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds, addRules });
}

// Load the bundled cosmetic/scriptlet data into storage as one key per domain ("f:<version>:<domain>"),
// so the content script can look up its page with a fast indexed read. Runs once per version.
async function populateFilters() {
  try {
    const { [FILTERS_VERSION_KEY]: readyVersion } = await chrome.storage.local.get(FILTERS_VERSION_KEY);
    if (readyVersion === FILTERS_VERSION) return;

    const res = await fetch(chrome.runtime.getURL("filters/1.json"));
    const data = await res.json();

    const prefix = `f:${FILTERS_VERSION}:`;
    const keysKey = `f:keys:${FILTERS_VERSION}`;
    const insertedDomains = [];

    // Optional lightweight keep-alive interval during CPU execution
    const keepAlive = setInterval(() => {
      chrome.runtime.getPlatformInfo().catch(() => {});
    }, 10000);

    try {
      let batch = {};
      let n = 0;
      for (const [domain, entry] of Object.entries(data)) {
        batch[prefix + domain] = entry;
        insertedDomains.push(domain);
        if (++n % 3000 === 0) {
          await chrome.storage.local.set(batch);
          batch = {};
        }
      }
      if (Object.keys(batch).length) {
        await chrome.storage.local.set(batch);
      }

      // Store the index of populated keys for this version
      await chrome.storage.local.set({ [keysKey]: insertedDomains });

      // Transactional commit: Mark this version as ready
      await chrome.storage.local.set({ [FILTERS_VERSION_KEY]: FILTERS_VERSION });
    } finally {
      clearInterval(keepAlive);
    }

    // Cleanup old version keys precisely (avoiding storage.local.get(null))
    if (readyVersion && readyVersion !== FILTERS_VERSION) {
      const oldKeysKey = `f:keys:${readyVersion}`;
      const { [oldKeysKey]: oldDomains } = await chrome.storage.local.get(oldKeysKey);
      if (Array.isArray(oldDomains)) {
        const oldPrefix = `f:${readyVersion}:`;
        const removeKeys = oldDomains.map(d => oldPrefix + d);
        // Batch deletion to avoid blocking the LevelDB thread
        const deleteBatchSize = 1000;
        for (let i = 0; i < removeKeys.length; i += deleteBatchSize) {
          await chrome.storage.local.remove(removeKeys.slice(i, i + deleteBatchSize));
        }
      }
      await chrome.storage.local.remove(oldKeysKey);
    }
  } catch (e) {
    // Non-fatal: network blocking still works without cosmetic data.
    console.warn("Shield: filter load failed", e);
  }
}

// Global initialization call ensures populateFilters resumes and completes if interrupted
populateFilters();

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
  const handledTypes = ["getStatus", "toggleGlobal", "toggleSite"];
  if (!handledTypes.includes(msg?.type)) {
    return false; // Let other listeners handle it
  }

  (async () => {
    try {
      if (msg.type === "getStatus") {
        const { enabled, allowlist } = await getState();
        const host = hostnameOf(msg.url);
        const siteAllowed = host ? candidates(host).some(c => allowlist.includes(c)) : false;
        sendResponse({ enabled, host, siteAllowed });
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
    } catch (e) {
      console.error("Message execution error:", e);
      sendResponse({ error: e.message });
    }
  })();
  return true; // async response
});
