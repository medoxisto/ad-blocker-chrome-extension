/**
 * Popup UI utilities — pure functions for popup logic.
 * No Chrome APIs, no side effects.
 */

const { hostnameOf } = require('./utils');

/**
 * Check if a hostname is valid for toggling.
 * @param {string|null} host
 * @returns {boolean}
 */
function isValidHost(host) {
  return host !== null && host.length > 0;
}

/**
 * Get the reason a site toggle would be disabled.
 * @param {string|null} host
 * @returns {string|null} - Reason string or null if enabled
 */
function getSiteToggleDisabledReason(host) {
  if (!isValidHost(host)) {
    return "Invalid host";
  }
  return null;
}

/**
 * Build the site label for display.
 * @param {string|null} host
 * @returns {string}
 */
function getSiteLabel(host) {
  return host || "Unknown Site";
}

/**
 * Build popup state from extension state and active tab.
 * @param {{ enabled: boolean, allowlist: string[] }} state
 * @param {{ url: string }|null} activeTab
 * @returns {{ enabled: boolean, host: string|null, siteAllowed: boolean, siteToggleDisabled: boolean }}
 */
function buildPopupState(state, activeTab) {
  const host = activeTab ? hostnameOf(activeTab.url) : null;
  const siteAllowed = host ? state.allowlist.includes(host) : false;
  const siteToggleDisabled = !isValidHost(host);

  return {
    enabled: state.enabled,
    host,
    siteAllowed,
    siteToggleDisabled
  };
}

module.exports = {
  isValidHost,
  getSiteToggleDisabledReason,
  getSiteLabel,
  buildPopupState
};
