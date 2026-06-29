// Shield Ad Blocker — cosmetic + scriptlet driver (isolated world, document_start)
// Reads only local data. Sends nothing anywhere.
//
// Network blocking is handled by declarativeNetRequest. This layer:
//   - hides leftover ad elements per-domain (css_param / css_inject_param / dom_remove_param)
//   - drives the MAIN-world scriptlets (scriptlets_param) that neutralize pop-ups,
//     anti-adblock walls and YouTube video ads.
//
// IMPORTANT — handshake: the MAIN-world scriptlet bundle dispatches "request-invoke-scriptlets"
// as soon as it loads, then waits for us to answer with an "invoke-scriptlet" event carrying the
// per-domain args. We must attach that listener SYNCHRONOUSLY (before any await) or we lose the race.

(() => {
  const host = location.hostname.replace(/\.$/, "");
  if (!host) return;

  const FILTERS_VERSION = 1; // Sync with background.js

  // Cache native DOM APIs to protect the main-world handshake from page interception
  const nativeAddEventListener = EventTarget.prototype.addEventListener;
  const nativeDispatchEvent = EventTarget.prototype.dispatchEvent;
  const nativeCustomEvent = window.CustomEvent;

  // 1) Establish a secure randomized token with the MAIN world
  const secretToken = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  let tokenTemp = secretToken;

  Object.defineProperty(window, "__shield_token", {
    get() {
      const val = tokenTemp;
      tokenTemp = undefined; // Self-deleting on first access
      try { delete window.__shield_token; } catch(_) {}
      return val;
    },
    configurable: true
  });

  function candidates(h) {
    const out = new Set();
    const base = h.replace(/^www\./, "");
    for (const v of [h, base]) {
      const parts = v.split(".");
      for (let i = 0; i + 2 <= parts.length; i++) out.add(parts.slice(i).join("."));
    }
    return [...out];
  }

  const domKeys = candidates(host).map(d => `f:${FILTERS_VERSION}:${d}`);

  // Merged page data resolves once storage is read.
  let resolveData;
  const dataPromise = new Promise(r => (resolveData = r));

  // Fire the scriptlet args exactly once (whichever trigger wins).
  let dispatched = false;
  function sendScriptlets(scriptlets) {
    if (dispatched) return;
    dispatched = true;
    if (scriptlets && scriptlets.length) {
      try {
        const event = new nativeCustomEvent("invoke-" + secretToken, {
          detail: { filter_args: scriptlets }
        });
        nativeDispatchEvent.call(document, event);
      } catch (_) {}
    }
  }

  // 2) Answer the MAIN-world handshake (attach BEFORE the async storage read).
  nativeAddEventListener.call(document, "request-invoke-" + secretToken, () => {
    dataPromise.then(d => { if (d) sendScriptlets(d.scriptlets); });
  });

  // 3) Read settings + this page's filter entries.
  chrome.storage.local.get(["enabled", "allowlist", "_filters_ready_version", ...domKeys]).then(store => {
    const isAllowlisted = candidates(host).some(c => (store.allowlist || []).includes(c));
    if (store.enabled === false || isAllowlisted) {
      resolveData(null); // disabled here → never send args, scriptlets stay idle
      return;
    }

    // Verify transactional ready state to ensure integrity
    if (store._filters_ready_version !== FILTERS_VERSION) {
      resolveData(null);
      return;
    }

    const acc = { css: [], cssInject: [], domRemove: [], scriptlets: [], jsInject: [], disableAll: false };
    for (const k of domKeys) {
      const e = store[k];
      if (!e) continue;
      if (e.disable_all_param) acc.disableAll = true;
      if (e.css_param) acc.css.push(...e.css_param);
      if (e.css_inject_param) acc.cssInject.push(...e.css_inject_param);
      if (e.dom_remove_param) acc.domRemove.push(...e.dom_remove_param);
      if (e.scriptlets_param) acc.scriptlets.push(...e.scriptlets_param);
      if (e.js_inject_param) acc.jsInject.push(...e.js_inject_param);
    }
    if (acc.disableAll) { resolveData(null); return; }

    resolveData(acc);
    sendScriptlets(acc.scriptlets); // proactive: covers the case the request already fired

    // Inline JS injections (best effort; site CSP may block).
    for (const code of acc.jsInject) {
      try {
        const s = document.createElement("script");
        s.textContent = code;
        (document.head || document.documentElement).appendChild(s);
        s.remove();
      } catch (_) {}
    }

    // Cosmetic CSS.
    if (acc.css.length || acc.cssInject.length) {
      const rules = [];
      if (acc.css.length) rules.push(acc.css.join(",") + "{display:none!important;}");
      if (acc.cssInject.length) rules.push(acc.cssInject.join("\n"));
      const style = document.createElement("style");
      style.textContent = rules.join("\n");
      (document.head || document.documentElement).appendChild(style);
    }

    // Hard-remove nodes, now and as they appear (runs indefinitely for infinite scroll).
    if (acc.domRemove.length) {
      const sel = acc.domRemove.join(",");
      const sweep = () => { try { document.querySelectorAll(sel).forEach(n => n.remove()); } catch (_) {} };
      sweep();
      let scheduled = false;
      const obs = new MutationObserver(() => {
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(() => { scheduled = false; sweep(); });
      });
      const start = () => obs.observe(document.documentElement, { childList: true, subtree: true });
      if (document.documentElement) start();
      else document.addEventListener("readystatechange", start, { once: true });
    }
  }).catch(() => resolveData(null));
})();
