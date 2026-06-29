// Shield Ad Blocker — popup logic
const globalToggle = document.getElementById("globalToggle");
const siteToggle = document.getElementById("siteToggle");
const siteLabel = document.getElementById("siteLabel");
const siteHint = document.getElementById("siteHint");

let currentHost = null;

async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function load() {
  const tab = await activeTab();
  const res = await chrome.runtime.sendMessage({ type: "getStatus", url: tab?.url || "" });
  currentHost = res.host;

  globalToggle.checked = res.enabled;
  siteToggle.checked = res.siteAllowed;

  if (currentHost) {
    siteLabel.textContent = currentHost;
    siteLabel.classList.remove("muted");
  } else {
    siteLabel.textContent = "This page can't be filtered";
    siteToggle.disabled = true;
  }
  reflectEnabled(res.enabled);
}

function reflectEnabled(on) {
  siteToggle.disabled = !on || !currentHost;
  siteHint.style.opacity = on ? "1" : "0.4";
}

globalToggle.addEventListener("change", async () => {
  const res = await chrome.runtime.sendMessage({ type: "toggleGlobal" });
  globalToggle.checked = res.enabled;
  reflectEnabled(res.enabled);
});

siteToggle.addEventListener("change", async () => {
  if (!currentHost) return;
  await chrome.runtime.sendMessage({ type: "toggleSite", host: currentHost });
  // Reload the tab so cosmetic filtering re-evaluates the new allowlist state.
  const tab = await activeTab();
  if (tab?.id) chrome.tabs.reload(tab.id);
});

load();
