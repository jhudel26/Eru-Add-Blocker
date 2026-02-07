/**
 * Content script - detects ad containers for stats (fallback when debug API unavailable)
 * Runs at load + after short delay to catch dynamic ads
 */
(function () {
  if (/\b(youtube\.com|youtu\.be|openai\.com|chatgpt\.com)\b/.test(location.hostname)) return;

  const adSelectors = [
    '[id*="google_ads"]',
    '[class*="adsbygoogle"]',
    '[id*="ad-container"]',
    '[class*="ad-container"]',
    '[data-ad]',
    '[id*="ad-"]',
    'ins.adsbygoogle',
    '.advertisement',
    '[class*="ad-slot"]',
    'iframe[src*="doubleclick"]',
    'iframe[src*="googlesyndication"]'
  ];

  function countAds() {
    let count = 0;
    try {
      adSelectors.forEach(sel => {
        try {
          count += document.querySelectorAll(sel).length;
        } catch (_) {}
      });
    } catch (_) {}
    return count;
  }

  function reportStats() {
    const count = countAds();
    if (count > 0 && typeof chrome !== 'undefined' && chrome.runtime?.id) {
      const host = location.hostname.replace(/^www\./, '');
      chrome.runtime.sendMessage({ type: 'AD_STATS', domain: host, count, adType: 'Element' });
    }
  }

  reportStats();
  setTimeout(reportStats, 2000);
})();
