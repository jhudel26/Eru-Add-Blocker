chrome.storage.local.get('stats', ({ stats = {} }) => {
  document.getElementById('total').textContent = (stats.totalBlocked ?? 0).toLocaleString();
});
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.stats) {
    const total = changes.stats.newValue?.totalBlocked ?? 0;
    document.getElementById('total').textContent = total.toLocaleString();
  }
});
document.getElementById('adminLink').href = chrome.runtime.getURL('admin.html');
