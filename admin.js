const MIN_LOADING_MS = 1200;

async function loadStats() {
  const loadingScreen = document.getElementById('loadingScreen');
  const app = document.getElementById('app');
  const loadStart = Date.now();

  if (typeof chrome === 'undefined' || !chrome.storage?.local) {
    document.body.innerHTML = '<div class="admin-error"><h1>Open from extension</h1><p>This admin panel must be opened from the extension popup. Click the Eru Add Blocker icon, then <strong>Open Admin Panel</strong>.</p></div>';
    return;
  }

  const { stats = {}, protected: protectedSites = {} } = await chrome.storage.local.get(['stats', 'protected']);

  const total = stats.totalBlocked ?? 0;
  const byDomain = stats.byDomain ?? {};
  const byType = stats.byType ?? {};
  const byRule = stats.byRule ?? {};

  document.getElementById('totalBlocked').textContent = total.toLocaleString();
  document.getElementById('protectedCount').textContent = Object.keys(protectedSites).length;
  document.getElementById('typeCount').textContent = Object.keys(byType).length;

  renderList('topSites', byDomain, (a, b) => b[1] - a[1], 10);
  renderList('protectedSites', protectedSites, (a, b) => b[1] - a[1], 10);
  renderList('adTypes', byType, (a, b) => b[1] - a[1], 10);
  renderList('blockMethods', byRule, (a, b) => b[1] - a[1], 10);

  const elapsed = Date.now() - loadStart;
  const remaining = Math.max(0, MIN_LOADING_MS - elapsed);
  setTimeout(() => {
    loadingScreen?.classList.add('hidden');
    app?.classList.remove('loading-hidden');
    app?.classList.add('loaded');
    app?.setAttribute('aria-hidden', 'false');
  }, remaining);
}

function renderList(id, data, sortFn, limit) {
  const el = document.getElementById(id);
  const entries = Object.entries(data).sort(sortFn).slice(0, limit);

  if (entries.length === 0) {
    el.innerHTML = '<div class="list-empty">No data yet. Browse the web (except YouTube) to collect stats. Stats are populated when ads are blocked or ad slots are detected.</div>';
    return;
  }

  el.innerHTML = entries
    .map(([label, value]) =>
      `<div class="list-item"><span class="label">${escapeHtml(label)}</span><span class="value">${Number(value).toLocaleString()}</span></div>`
    )
    .join('');
}

function escapeHtml(s) {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

document.getElementById('resetBtn').addEventListener('click', async () => {
  if (!confirm('Reset all stats and protected site data?')) return;
  await chrome.storage.local.set({ stats: { totalBlocked: 0, byDomain: {}, byType: {}, byRule: {}, lastReset: Date.now() }, protected: {} });
  loadStats();
});

loadStats();
chrome.storage.onChanged.addListener(() => loadStats());
