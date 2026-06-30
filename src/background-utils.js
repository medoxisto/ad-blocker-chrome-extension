/**
 * Background service worker utilities — pure functions for extension state.
 * No Chrome APIs, no side effects.
 */

const { buildDynamicRules } = require('./utils');

const RULESET_ID = "ads";
const ALLOWLIST_KEY = "allowlist";
const ENABLED_KEY = "enabled";
const FILTERS_VERSION_KEY = "_filters_version";
const FILTERS_VERSION = 1;
const DYN_RULE_BASE = 1000000;

/**
 * Get enabled/allowlist state from storage data.
 * @param {{ enabled: boolean, allowlist: string[] }} storageData
 * @returns {{ enabled: boolean, allowlist: string[] }}
 */
function getState(storageData) {
  return {
    enabled: storageData[ENABLED_KEY] !== false,
    allowlist: storageData[ALLOWLIST_KEY] || []
  };
}

/**
 * Check if a ruleset is currently enabled.
 * @param {string[]} enabledRulesets - Array of enabled ruleset IDs
 * @param {string} rulesetId - Ruleset ID to check
 * @returns {boolean}
 */
function isRulesetEnabled(enabledRulesets, rulesetId = RULESET_ID) {
  return enabledRulesets.includes(rulesetId);
}

/**
 * Build dynamic allow rules from a allowlist.
 * @param {string[]} allowlist - Array of hostnames to allow
 * @returns {{ id: number, priority: number, action: { type: string }, condition: { requestDomains: string[], resourceTypes: string[] } }[]}
 */
function buildAllowRules(allowlist) {
  return buildDynamicRules(allowlist, DYN_RULE_BASE);
}

/**
 * Determine which ruleset actions to take based on current and desired state.
 * @param {{ enabled: boolean, allowlist: string[] }} state
 * @param {string[]} currentRulesets - Currently enabled rulesets
 * @returns {{ enableRulesetIds: string[], disableRulesetIds: string[], addRules: object[], removeRuleIds: number[] }}
 */
function buildStateChangeActions(state, currentRulesets) {
  const isOn = isRulesetEnabled(currentRulesets);

  const enableRulesetIds = [];
  const disableRulesetIds = [];

  if (state.enabled && !isOn) {
    enableRulesetIds.push(RULESET_ID);
  } else if (!state.enabled && isOn) {
    disableRulesetIds.push(RULESET_ID);
  }

  const existingDynamicRules = []; // Would come from chrome.declarativeNetRequest.getDynamicRules()
  const removeRuleIds = existingDynamicRules.map(r => r.id);
  const addRules = state.enabled ? buildAllowRules(state.allowlist) : [];

  return { enableRulesetIds, disableRulesetIds, addRules, removeRuleIds };
}

/**
 * Parse filters version from storage data.
 * @param {{ [key: string]: any }} storageData
 * @returns {number}
 */
function getFiltersVersion(storageData) {
  return storageData[FILTERS_VERSION_KEY] || 0;
}

/**
 * Check if filters need reload.
 * @param {{ [key: string]: any }} storageData
 * @returns {boolean}
 */
function needsFilterReload(storageData) {
  return getFiltersVersion(storageData) !== FILTERS_VERSION;
}

/**
 * Extract old filter keys from storage data.
 * @param {string[]} allKeys - All keys in storage
 * @returns {string[]}
 */
function getOldFilterKeys(allKeys) {
  return allKeys.filter(k => k.startsWith("f:"));
}

module.exports = {
  RULESET_ID,
  ALLOWLIST_KEY,
  ENABLED_KEY,
  FILTERS_VERSION_KEY,
  FILTERS_VERSION,
  DYN_RULE_BASE,
  getState,
  isRulesetEnabled,
  buildAllowRules,
  buildStateChangeActions,
  getFiltersVersion,
  needsFilterReload,
  getOldFilterKeys
};
