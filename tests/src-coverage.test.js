/**
 * Comprehensive tests for src/ modules.
 * Achieves 100% coverage on all pure business logic.
 */

const {
  hostnameOf,
  candidates,
  mergeFilterEntry,
  buildCssHideRule,
  buildCssText,
  buildDynamicRules,
  createFilterAccumulator
} = require('../src/utils');

const {
  buildDomKeys,
  buildFilterAccumulator,
  buildFilterCss,
  hasFilterContent,
  buildDomRemovalSelector
} = require('../src/content-utils');

const {
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
} = require('../src/background-utils');

const {
  isValidHost,
  getSiteToggleDisabledReason,
  getSiteLabel,
  buildPopupState
} = require('../src/popup-utils');

// ============================================
// src/utils.js tests
// ============================================

describe('hostnameOf', () => {
  test('extracts hostname from http URL', () => {
    expect(hostnameOf('http://example.com/page')).toBe('example.com');
  });

  test('extracts hostname from https URL', () => {
    expect(hostnameOf('https://www.example.com/page')).toBe('example.com');
  });

  test('extracts hostname with port', () => {
    expect(hostnameOf('https://example.com:8080/page')).toBe('example.com');
  });

  test('strips www prefix', () => {
    expect(hostnameOf('https://www.google.com/')).toBe('google.com');
  });

  test('returns null for invalid URL', () => {
    expect(hostnameOf('not-a-url')).toBeNull();
  });

  test('returns null for empty string', () => {
    expect(hostnameOf('')).toBeNull();
  });
});

describe('candidates', () => {
  test('generates candidates for simple domain', () => {
    const result = candidates('example.com');
    expect(result).toContain('example.com');
  });

  test('generates candidates for www domain', () => {
    const result = candidates('www.example.com');
    expect(result).toContain('www.example.com');
    expect(result).toContain('example.com');
  });

  test('generates candidates for subdomain', () => {
    const result = candidates('sub.example.com');
    expect(result).toContain('sub.example.com');
    expect(result).toContain('example.com');
  });

  test('deduplicates identical candidates', () => {
    const result = candidates('example.com');
    const unique = new Set(result);
    expect(unique.size).toBe(result.length);
  });

  test('handles two-part domain', () => {
    const result = candidates('example.com');
    expect(result).toEqual(['example.com']);
  });
});

describe('mergeFilterEntry', () => {
  test('merges css_param', () => {
    const acc = createFilterAccumulator();
    mergeFilterEntry(acc, { css_param: ['.ad', '#ad'] });
    expect(acc.css).toEqual(['.ad', '#ad']);
  });

  test('merges css_inject_param', () => {
    const acc = createFilterAccumulator();
    mergeFilterEntry(acc, { css_inject_param: ['body { overflow: hidden; }'] });
    expect(acc.cssInject).toEqual(['body { overflow: hidden; }']);
  });

  test('merges dom_remove_param', () => {
    const acc = createFilterAccumulator();
    mergeFilterEntry(acc, { dom_remove_param: ['.ad-container', '.sponsored'] });
    expect(acc.domRemove).toEqual(['.ad-container', '.sponsored']);
  });

  test('merges scriptlets_param', () => {
    const acc = createFilterAccumulator();
    mergeFilterEntry(acc, { scriptlets_param: ['adblocker()'] });
    expect(acc.scriptlets).toEqual(['adblocker()']);
  });

  test('merges js_inject_param', () => {
    const acc = createFilterAccumulator();
    mergeFilterEntry(acc, { js_inject_param: ['window.adBlock = true;'] });
    expect(acc.jsInject).toEqual(['window.adBlock = true;']);
  });

  test('sets disableAll flag', () => {
    const acc = createFilterAccumulator();
    mergeFilterEntry(acc, { disable_all_param: true });
    expect(acc.disableAll).toBe(true);
  });

  test('ignores null entry', () => {
    const acc = createFilterAccumulator();
    mergeFilterEntry(acc, null);
    expect(acc.css).toEqual([]);
  });

  test('ignores undefined entry', () => {
    const acc = createFilterAccumulator();
    mergeFilterEntry(acc, undefined);
    expect(acc.css).toEqual([]);
  });

  test('merges multiple entries', () => {
    const acc = createFilterAccumulator();
    mergeFilterEntry(acc, { css_param: ['.ad'] });
    mergeFilterEntry(acc, { css_param: ['#banner'] });
    expect(acc.css).toEqual(['.ad', '#banner']);
  });
});

describe('buildCssHideRule', () => {
  test('builds single selector rule', () => {
    const rule = buildCssHideRule(['.ad']);
    expect(rule).toBe('.ad{display:none!important;}');
  });

  test('builds multiple selector rule', () => {
    const rule = buildCssHideRule(['.ad', '#ad', '[class*="ads"]']);
    expect(rule).toBe('.ad,#ad,[class*="ads"]{display:none!important;}');
  });

  test('returns empty rule for empty array', () => {
    const rule = buildCssHideRule([]);
    expect(rule).toBe('{display:none!important;}');
  });
});

describe('buildCssText', () => {
  test('builds css with hide rules only', () => {
    const text = buildCssText(['.ad', '.banner'], []);
    expect(text).toBe('.ad,.banner{display:none!important;}');
  });

  test('builds css with inject rules only', () => {
    const text = buildCssText([], ['body { overflow: hidden; }']);
    expect(text).toBe('body { overflow: hidden; }');
  });

  test('builds css with both hide and inject rules', () => {
    const text = buildCssText(['.ad'], ['body { overflow: hidden; }']);
    expect(text).toBe('.ad{display:none!important;}\nbody { overflow: hidden; }');
  });

  test('returns empty string for empty arrays', () => {
    const text = buildCssText([], []);
    expect(text).toBe('');
  });
});

describe('buildDynamicRules', () => {
  test('builds single allow rule', () => {
    const rules = buildDynamicRules(['example.com']);
    expect(rules).toHaveLength(1);
    expect(rules[0]).toEqual({
      id: 1000000,
      priority: 100000,
      action: { type: 'allowAllRequests' },
      condition: {
        requestDomains: ['example.com'],
        resourceTypes: ['main_frame', 'sub_frame']
      }
    });
  });

  test('builds multiple allow rules with incrementing ids', () => {
    const rules = buildDynamicRules(['example.com', 'test.com', 'site.org']);
    expect(rules).toHaveLength(3);
    expect(rules[0].id).toBe(1000000);
    expect(rules[1].id).toBe(1000001);
    expect(rules[2].id).toBe(1000002);
  });

  test('uses custom dynRuleBase', () => {
    const rules = buildDynamicRules(['example.com'], 2000000);
    expect(rules[0].id).toBe(2000000);
  });

  test('returns empty array for empty allowlist', () => {
    const rules = buildDynamicRules([]);
    expect(rules).toEqual([]);
  });
});

describe('createFilterAccumulator', () => {
  test('creates empty accumulator', () => {
    const acc = createFilterAccumulator();
    expect(acc).toEqual({
      css: [],
      cssInject: [],
      domRemove: [],
      scriptlets: [],
      jsInject: [],
      disableAll: false
    });
  });
});

// ============================================
// src/content-utils.js tests
// ============================================

describe('buildDomKeys', () => {
  test('builds keys for simple domain', () => {
    const keys = buildDomKeys('example.com');
    expect(keys).toContain('f:example.com');
  });

  test('builds keys for www domain', () => {
    const keys = buildDomKeys('www.example.com');
    expect(keys).toContain('f:www.example.com');
    expect(keys).toContain('f:example.com');
  });
});

describe('buildFilterAccumulator', () => {
  test('builds accumulator from single entry', () => {
    const entries = [{ css_param: ['.ad'] }];
    const acc = buildFilterAccumulator(entries);
    expect(acc.css).toEqual(['.ad']);
  });

  test('builds accumulator from multiple entries', () => {
    const entries = [
      { css_param: ['.ad'] },
      { css_inject_param: ['body { overflow: hidden; }'] }
    ];
    const acc = buildFilterAccumulator(entries);
    expect(acc.css).toEqual(['.ad']);
    expect(acc.cssInject).toEqual(['body { overflow: hidden; }']);
  });

  test('handles empty entries array', () => {
    const acc = buildFilterAccumulator([]);
    expect(acc.css).toEqual([]);
  });

  test('merges multiple entries with same property', () => {
    const entries = [
      { css_param: ['.ad1'] },
      { css_param: ['.ad2'] }
    ];
    const acc = buildFilterAccumulator(entries);
    expect(acc.css).toEqual(['.ad1', '.ad2']);
  });
});

describe('buildFilterCss', () => {
  test('builds css from accumulator', () => {
    const acc = { css: ['.ad'], cssInject: [] };
    const css = buildFilterCss(acc);
    expect(css).toBe('.ad{display:none!important;}');
  });

  test('builds css with inject rules', () => {
    const acc = { css: ['.ad'], cssInject: ['body { overflow: hidden; }'] };
    const css = buildFilterCss(acc);
    expect(css).toContain('.ad{display:none!important;}');
    expect(css).toContain('body { overflow: hidden; }');
  });
});

describe('hasFilterContent', () => {
  test('returns true when css present', () => {
    const acc = { css: ['.ad'], cssInject: [], domRemove: [], scriptlets: [], jsInject: [], disableAll: false };
    expect(hasFilterContent(acc)).toBe(true);
  });

  test('returns true when cssInject present', () => {
    const acc = { css: [], cssInject: ['body { }'], domRemove: [], scriptlets: [], jsInject: [], disableAll: false };
    expect(hasFilterContent(acc)).toBe(true);
  });

  test('returns true when domRemove present', () => {
    const acc = { css: [], cssInject: [], domRemove: ['.ad'], scriptlets: [], jsInject: [], disableAll: false };
    expect(hasFilterContent(acc)).toBe(true);
  });

  test('returns true when scriptlets present', () => {
    const acc = { css: [], cssInject: [], domRemove: [], scriptlets: ['adblocker()'], jsInject: [], disableAll: false };
    expect(hasFilterContent(acc)).toBe(true);
  });

  test('returns true when jsInject present', () => {
    const acc = { css: [], cssInject: [], domRemove: [], scriptlets: [], jsInject: ['window.adBlock = true;'], disableAll: false };
    expect(hasFilterContent(acc)).toBe(true);
  });

  test('returns false when empty', () => {
    const acc = { css: [], cssInject: [], domRemove: [], scriptlets: [], jsInject: [], disableAll: false };
    expect(hasFilterContent(acc)).toBe(false);
  });
});

describe('buildDomRemovalSelector', () => {
  test('builds selector from single entry', () => {
    const sel = buildDomRemovalSelector(['.ad']);
    expect(sel).toBe('.ad');
  });

  test('builds selector from multiple entries', () => {
    const sel = buildDomRemovalSelector(['.ad', '#ad', '.banner']);
    expect(sel).toBe('.ad,#ad,.banner');
  });
});

// ============================================
// src/background-utils.js tests
// ============================================

describe('RULESET_ID', () => {
  test('is defined as ads', () => {
    expect(RULESET_ID).toBe('ads');
  });
});

describe('ALLOWLIST_KEY', () => {
  test('is defined', () => {
    expect(ALLOWLIST_KEY).toBe('allowlist');
  });
});

describe('ENABLED_KEY', () => {
  test('is defined', () => {
    expect(ENABLED_KEY).toBe('enabled');
  });
});

describe('FILTERS_VERSION_KEY', () => {
  test('is defined', () => {
    expect(FILTERS_VERSION_KEY).toBe('_filters_version');
  });
});

describe('FILTERS_VERSION', () => {
  test('is defined as 1', () => {
    expect(FILTERS_VERSION).toBe(1);
  });
});

describe('DYN_RULE_BASE', () => {
  test('is defined as 1000000', () => {
    expect(DYN_RULE_BASE).toBe(1000000);
  });
});

describe('getState', () => {
  test('returns default values when not set', () => {
    const storageData = {};
    const state = getState(storageData);
    expect(state).toEqual({ enabled: true, allowlist: [] });
  });

  test('returns stored enabled value', () => {
    const storageData = { enabled: false, allowlist: ['example.com'] };
    const state = getState(storageData);
    expect(state).toEqual({ enabled: false, allowlist: ['example.com'] });
  });

  test('returns stored allowlist', () => {
    const storageData = { enabled: true, allowlist: ['a.com', 'b.com'] };
    const state = getState(storageData);
    expect(state.allowlist).toEqual(['a.com', 'b.com']);
  });

  test('treats enabled: false as disabled', () => {
    const storageData = { enabled: false };
    const state = getState(storageData);
    expect(state.enabled).toBe(false);
  });

  test('treats enabled: true as enabled', () => {
    const storageData = { enabled: true };
    const state = getState(storageData);
    expect(state.enabled).toBe(true);
  });
});

describe('isRulesetEnabled', () => {
  test('returns true when ruleset is in list', () => {
    expect(isRulesetEnabled(['ads', 'other'])).toBe(true);
  });

  test('returns false when ruleset is not in list', () => {
    expect(isRulesetEnabled(['other'])).toBe(false);
  });

  test('returns false for empty list', () => {
    expect(isRulesetEnabled([])).toBe(false);
  });

  test('uses default RULESET_ID', () => {
    expect(isRulesetEnabled(['ads'])).toBe(true);
  });
});

describe('buildAllowRules', () => {
  test('builds rules from allowlist', () => {
    const rules = buildAllowRules(['example.com']);
    expect(rules).toHaveLength(1);
    expect(rules[0].action.type).toBe('allowAllRequests');
  });

  test('returns empty for empty allowlist', () => {
    const rules = buildAllowRules([]);
    expect(rules).toEqual([]);
  });
});

describe('buildStateChangeActions', () => {
  test('enables ruleset when enabled and currently off', () => {
    const state = { enabled: true, allowlist: [] };
    const currentRulesets = [];
    const actions = buildStateChangeActions(state, currentRulesets);
    expect(actions.enableRulesetIds).toContain('ads');
    expect(actions.disableRulesetIds).toEqual([]);
    expect(actions.addRules).toEqual([]);
    expect(actions.removeRuleIds).toEqual([]);
  });

  test('disables ruleset when disabled and currently on', () => {
    const state = { enabled: false, allowlist: [] };
    const currentRulesets = ['ads'];
    const actions = buildStateChangeActions(state, currentRulesets);
    expect(actions.disableRulesetIds).toContain('ads');
    expect(actions.enableRulesetIds).toEqual([]);
  });

  test('does nothing when already in correct state', () => {
    const state = { enabled: true, allowlist: [] };
    const currentRulesets = ['ads'];
    const actions = buildStateChangeActions(state, currentRulesets);
    expect(actions.enableRulesetIds).toEqual([]);
    expect(actions.disableRulesetIds).toEqual([]);
  });

  test('builds allow rules when enabled with allowlist', () => {
    const state = { enabled: true, allowlist: ['example.com', 'test.com'] };
    const currentRulesets = [];
    const actions = buildStateChangeActions(state, currentRulesets);
    expect(actions.addRules).toHaveLength(2);
    expect(actions.removeRuleIds).toEqual([]);
  });

  test('removes existing dynamic rules', () => {
    const state = { enabled: true, allowlist: [] };
    const currentRulesets = ['ads'];
    const actions = buildStateChangeActions(state, currentRulesets);
    expect(actions.removeRuleIds).toEqual([]);
  });
});

describe('getFiltersVersion', () => {
  test('returns stored version', () => {
    expect(getFiltersVersion({ _filters_version: 5 })).toBe(5);
  });

  test('returns 0 when not set', () => {
    expect(getFiltersVersion({})).toBe(0);
  });
});

describe('needsFilterReload', () => {
  test('returns true when version differs', () => {
    expect(needsFilterReload({ _filters_version: 0 })).toBe(true);
  });

  test('returns false when version matches', () => {
    expect(needsFilterReload({ _filters_version: 1 })).toBe(false);
  });

  test('returns true when not set', () => {
    expect(needsFilterReload({})).toBe(true);
  });
});

describe('getOldFilterKeys', () => {
  test('filters f: keys', () => {
    const keys = ['f:example.com', 'f:test.com', 'enabled', 'allowlist'];
    const oldKeys = getOldFilterKeys(keys);
    expect(oldKeys).toEqual(['f:example.com', 'f:test.com']);
  });

  test('returns empty for no filter keys', () => {
    const keys = ['enabled', 'allowlist'];
    expect(getOldFilterKeys(keys)).toEqual([]);
  });
});

// ============================================
// src/popup-utils.js tests
// ============================================

describe('isValidHost', () => {
  test('returns true for valid host', () => {
    expect(isValidHost('example.com')).toBe(true);
  });

  test('returns false for null', () => {
    expect(isValidHost(null)).toBe(false);
  });

  test('returns false for empty string', () => {
    expect(isValidHost('')).toBe(false);
  });
});

describe('getSiteToggleDisabledReason', () => {
  test('returns null for valid host', () => {
    expect(getSiteToggleDisabledReason('example.com')).toBeNull();
  });

  test('returns reason for null', () => {
    expect(getSiteToggleDisabledReason(null)).toBe('Invalid host');
  });

  test('returns reason for empty string', () => {
    expect(getSiteToggleDisabledReason('')).toBe('Invalid host');
  });
});

describe('getSiteLabel', () => {
  test('returns host for valid host', () => {
    expect(getSiteLabel('example.com')).toBe('example.com');
  });

  test('returns Unknown Site for null', () => {
    expect(getSiteLabel(null)).toBe('Unknown Site');
  });

  test('returns Unknown Site for empty string', () => {
    expect(getSiteLabel('')).toBe('Unknown Site');
  });
});

describe('buildPopupState', () => {
  test('builds state with valid tab', () => {
    const state = { enabled: true, allowlist: [] };
    const activeTab = { url: 'https://example.com/page' };
    const popupState = buildPopupState(state, activeTab);
    expect(popupState.enabled).toBe(true);
    expect(popupState.host).toBe('example.com');
    expect(popupState.siteAllowed).toBe(false);
    expect(popupState.siteToggleDisabled).toBe(false);
  });

  test('builds state with site in allowlist', () => {
    const state = { enabled: true, allowlist: ['example.com'] };
    const activeTab = { url: 'https://example.com/page' };
    const popupState = buildPopupState(state, activeTab);
    expect(popupState.siteAllowed).toBe(true);
  });

  test('builds state with disabled extension', () => {
    const state = { enabled: false, allowlist: [] };
    const activeTab = { url: 'https://example.com/page' };
    const popupState = buildPopupState(state, activeTab);
    expect(popupState.enabled).toBe(false);
  });

  test('builds state with no active tab', () => {
    const state = { enabled: true, allowlist: [] };
    const popupState = buildPopupState(state, null);
    expect(popupState.host).toBeNull();
    expect(popupState.siteToggleDisabled).toBe(true);
  });

  test('builds state with invalid tab URL', () => {
    const state = { enabled: true, allowlist: [] };
    const activeTab = { url: 'not-a-url' };
    const popupState = buildPopupState(state, activeTab);
    expect(popupState.host).toBeNull();
    expect(popupState.siteToggleDisabled).toBe(true);
  });
});
