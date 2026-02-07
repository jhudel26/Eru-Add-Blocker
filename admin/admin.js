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

  animateValue('totalBlocked', total);
  animateValue('protectedCount', Object.keys(protectedSites).length);
  animateValue('typeCount', Object.keys(byType).length);

  renderList('topSites', byDomain, (a, b) => b[1] - a[1], 10);
  renderList('protectedSites', protectedSites, (a, b) => b[1] - a[1], 10);
  renderList('adTypes', byType, (a, b) => b[1] - a[1], 10);
  renderList('blockMethods', byRule, (a, b) => b[1] - a[1], 10);

  const elapsed = Date.now() - loadStart;
  const alreadyLoaded = loadingScreen?.classList.contains('hidden');
  const remaining = alreadyLoaded ? 0 : Math.max(0, MIN_LOADING_MS - elapsed);
  setTimeout(() => {
    loadingScreen?.classList.add('hidden');
    app?.classList.remove('loading-hidden');
    app?.classList.add('loaded');
    app?.setAttribute('aria-hidden', 'false');
  }, remaining);
}

function animateValue(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  const current = parseInt(el.textContent.replace(/,/g, '')) || 0;
  if (current === target) {
    el.textContent = target.toLocaleString();
    return;
  }
  const duration = 400;
  const start = performance.now();
  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const easeOut = 1 - Math.pow(1 - progress, 2);
    const value = Math.round(current + (target - current) * easeOut);
    el.textContent = value.toLocaleString();
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function renderList(id, data, sortFn, limit) {
  const el = document.getElementById(id);
  const entries = Object.entries(data).sort(sortFn).slice(0, limit);
  const maxVal = entries[0]?.[1] ?? 1;

  if (entries.length === 0) {
    el.innerHTML = '<div class="list-empty">No data yet. Browse the web (except YouTube & ChatGPT) to collect stats.</div>';
    return;
  }

  el.innerHTML = entries
    .map(([label, value]) => {
      const pct = Math.min(100, (value / maxVal) * 100);
      return `<div class="list-item" data-copy="${escapeHtml(label)} · ${Number(value).toLocaleString()}" title="Click to copy">
        <span class="list-item-bar" style="width:${pct}%"></span>
        <span class="label">${escapeHtml(label)}</span>
        <span class="value">${Number(value).toLocaleString()}</span>
      </div>`;
    })
    .join('');

  el.querySelectorAll('.list-item').forEach(item => {
    item.addEventListener('click', () => copyToClipboard(item.dataset.copy, item));
  });
}

function copyToClipboard(text, el) {
  navigator.clipboard?.writeText(text).then(() => {
    el?.classList.add('copied');
    setTimeout(() => el?.classList.remove('copied'), 600);
  });
}

function escapeHtml(s) {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('resetBtn')?.addEventListener('click', async () => {
    if (!confirm('Reset all stats and protected site data?')) return;
    await chrome.storage.local.set({ stats: { totalBlocked: 0, byDomain: {}, byType: {}, byRule: {}, lastReset: Date.now() }, protected: {} });
    loadStats();
  });

  document.getElementById('refreshBtn')?.addEventListener('click', () => {
    const btn = document.getElementById('refreshBtn');
    btn?.classList.add('spinning');
    loadStats();
    setTimeout(() => btn?.classList.remove('spinning'), 500);
  });

  document.querySelectorAll('.panel-header').forEach(header => {
    header.addEventListener('click', () => {
      const panel = header.closest('.panel');
      panel?.classList.toggle('collapsed');
      const toggle = header.querySelector('.panel-toggle');
      if (toggle) toggle.textContent = panel?.classList.contains('collapsed') ? '+' : '−';
    });
  });

  document.querySelector('.info-toggle')?.addEventListener('click', () => {
    document.querySelector('.info-content')?.classList.toggle('collapsed');
  });

  const collapsed = JSON.parse(localStorage.getItem('eru-collapsed') || '{}');
  document.querySelectorAll('.panel').forEach(p => {
    if (collapsed[p.dataset.panel]) {
      p.classList.add('collapsed');
      p.querySelector('.panel-toggle').textContent = '+';
    }
  });

  function saveCollapsedState() {
    const state = {};
    document.querySelectorAll('.panel.collapsed').forEach(p => { state[p.dataset.panel] = true; });
    localStorage.setItem('eru-collapsed', JSON.stringify(state));
  }

  document.querySelectorAll('.panel').forEach(p => {
    const observer = new MutationObserver(saveCollapsedState);
    observer.observe(p, { attributes: true, attributeFilter: ['class'] });
  });
});

loadStats();
chrome.storage.onChanged.addListener(() => loadStats());
