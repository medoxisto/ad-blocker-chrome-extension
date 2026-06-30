/**
 * Pure utility functions — no Chrome APIs, no side effects.
 * These are testable in Node.js without any mocks.
 */

/**
 * Extract hostname from a URL, stripping leading www. and returning null on invalid URLs.
 * @param {string} url
 * @returns {string|null}
 */
function hostnameOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/**
 * Generate all candidate domain keys for a given hostname.
 * E.g. "www.example.com" → ["www.example.com", "example.com"]
 * @param {string} h
 * @returns {string[]}
 */
function candidates(h) {
  const out = new Set();
  const base = h.replace(/^www\./, "");
  for (const v of [h, base]) {
    const parts = v.split(".");
    for (let i = 0; i + 2 <= parts.length; i++) {
      out.add(parts.slice(i).join("."));
    }
  }
  return [...out];
}

/**
 * Merge a filter entry into a filter accumulator.
 * @param {object} acc - Accumulator object with css, cssInject, domRemove, scriptlets, jsInject, disableAll
 * @param {object} entry - Filter entry to merge
 */
function mergeFilterEntry(acc, entry) {
  if (!entry) return;
  if (entry.disable_all_param) acc.disableAll = true;
  if (entry.css_param) acc.css.push(...entry.css_param);
  if (entry.css_inject_param) acc.cssInject.push(...entry.css_inject_param);
  if (entry.dom_remove_param) acc.domRemove.push(...entry.dom_remove_param);
  if (entry.scriptlets_param) acc.scriptlets.push(...entry.scriptlets_param);
  if (entry.js_inject_param) acc.jsInject.push(...entry.js_inject_param);
}

/**
 * Build a CSS hide rule string from an array of selectors.
 * @param {string[]} selectors
 * @returns {string}
 */
function buildCssHideRule(selectors) {
  return selectors.join(",") + "{display:none!important;}";
}

/**
 * Build the full CSS text content for injection.
 * @param {string[]} css - Array of CSS selectors to hide
 * @param {string[]} cssInject - Array of CSS rules to inject
 * @returns {string}
 */
function buildCssText(css, cssInject) {
  const rules = [];
  if (css.length) rules.push(buildCssHideRule(css));
  if (cssInject.length) rules.push(cssInject.join("\n"));
  return rules.join("\n");
}

/**
 * Build dynamic rules for declarativeNetRequest allowlist.
 * @param {string[]} allowlist - Array of hostnames to allow
 * @param {number} dynRuleBase - Base ID for dynamic rules
 * @returns {{ id: number, priority: number, action: { type: string }, condition: { requestDomains: string[], resourceTypes: string[] } }[]}
 */
function buildDynamicRules(allowlist, dynRuleBase = 1000000) {
  return allowlist.map((host, i) => ({
    id: dynRuleBase + i,
    priority: 100000,
    action: { type: "allowAllRequests" },
    condition: {
      requestDomains: [host],
      resourceTypes: ["main_frame", "sub_frame"]
    }
  }));
}

/**
 * Create a filter accumulator object.
 * @returns {{ css: string[], cssInject: string[], domRemove: string[], scriptlets: string[], jsInject: string[], disableAll: boolean }}
 */
function createFilterAccumulator() {
  return { css: [], cssInject: [], domRemove: [], scriptlets: [], jsInject: [], disableAll: false };
}

module.exports = {
  hostnameOf,
  candidates,
  mergeFilterEntry,
  buildCssHideRule,
  buildCssText,
  buildDynamicRules,
  createFilterAccumulator
};
