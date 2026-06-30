/**
 * Content script utilities — pure functions for cosmetic filtering.
 * No Chrome APIs, no side effects.
 */

const { candidates, mergeFilterEntry, buildCssText, createFilterAccumulator } = require('./utils');

/**
 * Build domain keys for looking up filter data in storage.
 * @param {string} host - Hostname
 * @returns {string[]}
 */
function buildDomKeys(host) {
  return candidates(host).map(d => "f:" + d);
}

/**
 * Build a filter accumulator from stored filter entries.
 * @param {object[]} entries - Array of filter entries from storage
 * @returns {{ css: string[], cssInject: string[], domRemove: string[], scriptlets: string[], jsInject: string[], disableAll: boolean }}
 */
function buildFilterAccumulator(entries) {
  const acc = createFilterAccumulator();
  for (const entry of entries) {
    mergeFilterEntry(acc, entry);
  }
  return acc;
}

/**
 * Build CSS text from an accumulator.
 * @param {{ css: string[], cssInject: string[] }} acc
 * @returns {string}
 */
function buildFilterCss(acc) {
  return buildCssText(acc.css, acc.cssInject);
}

/**
 * Check if an accumulator has any filter content to apply.
 * @param {{ css: string[], cssInject: string[], domRemove: string[], scriptlets: string[], jsInject: string[], disableAll: boolean }} acc
 * @returns {boolean}
 */
function hasFilterContent(acc) {
  return acc.css.length > 0 ||
    acc.cssInject.length > 0 ||
    acc.domRemove.length > 0 ||
    acc.scriptlets.length > 0 ||
    acc.jsInject.length > 0;
}

/**
 * Build a CSS selector string for DOM removal.
 * @param {string[]} domRemove - Array of DOM removal selectors
 * @returns {string}
 */
function buildDomRemovalSelector(domRemove) {
  return domRemove.join(",");
}

module.exports = {
  buildDomKeys,
  buildFilterAccumulator,
  buildFilterCss,
  hasFilterContent,
  buildDomRemovalSelector
};
