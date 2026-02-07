/**
 * Smart Ad Blocker - Background Service Worker
 * Uses declarativeNetRequest (browser-level) - zero connection impact
 * Stats via onRuleMatchedDebug (unpacked) + content script fallback
 */

const EXCLUDED_DOMAINS = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'openai.com', 'chat.openai.com', 'chatgpt.com', 'www.chatgpt.com'];
const DEFAULT_STATS = { totalBlocked: 0, byDomain: {}, byType: {}, byRule: {}, lastReset: Date.now() };

// Map rule IDs to ad type categories
const RULE_TO_TYPE = {
  1: 'Display', 2: 'Display', 3: 'Display', 4: 'Display', 5: 'Display', 6: 'Programmatic',
  7: 'Programmatic', 8: 'Affiliate', 9: 'Retargeting', 10: 'Native', 11: 'Native', 12: 'Native',
  13: 'Display', 14: 'Retargeting', 15: 'Programmatic', 16: 'Programmatic', 17: 'Programmatic',
  18: 'Programmatic', 19: 'Analytics', 20: 'Tracking', 21: 'Verification', 22: 'Verification',
  23: 'Social', 24: 'Social', 25: 'Social', 26: 'Social', 27: 'Programmatic', 28: 'Display',
  29: 'Analytics', 30: 'Tracking', 31: 'Social', 32: 'Social', 33: 'Tracking', 34: 'Programmatic',
  35: 'Programmatic', 36: 'Programmatic', 37: 'Programmatic', 38: 'Display', 39: 'Display', 40: 'Display'
};

const RESOURCE_TO_TYPE = {
  script: 'Script',
  image: 'Banner/Image',
  xmlhttprequest: 'XHR/Tracking',
  sub_frame: 'Iframe/Embed',
  other: 'Other',
  media: 'Video/Audio'
};

async function getStats() {
  const { stats = DEFAULT_STATS } = await chrome.storage.local.get('stats');
  return stats;
}

async function updateStats(match) {
  try {
    const stats = await getStats();
    const initiator = match?.request?.initiator || '';
    const url = match?.request?.url || '';
    const ruleId = match?.rule?.ruleId;
    const resourceType = match?.request?.type || 'other';

    // Skip if initiator is YouTube (shouldn't happen with our rules, but safety check)
    const isYouTube = EXCLUDED_DOMAINS.some(d => initiator.includes(d) || url.includes('youtube'));
    if (isYouTube) return;

    stats.totalBlocked = (stats.totalBlocked || 0) + 1;

    // Extract domain from initiator (e.g., "https://example.com" -> "example.com")
    let domain = 'direct';
    try {
      if (initiator) {
        domain = new URL(initiator).hostname.replace(/^www\./, '');
      } else if (url) {
        domain = new URL(url).hostname.replace(/^www\./, '');
      }
    } catch (_) {}
    stats.byDomain[domain] = (stats.byDomain[domain] || 0) + 1;

    const adType = RULE_TO_TYPE[ruleId] || 'Other';
    stats.byType[adType] = (stats.byType[adType] || 0) + 1;

    const resourceLabel = RESOURCE_TO_TYPE[resourceType] || resourceType;
    if (!stats.byRule[resourceLabel]) stats.byRule[resourceLabel] = 0;
    stats.byRule[resourceLabel]++;

    await chrome.storage.local.set({ stats });
  } catch (e) {
    console.debug('[AdBlocker] Stats update skipped:', e.message);
  }
}

// Track rule matches (works in unpacked extensions)
if (chrome.declarativeNetRequest?.onRuleMatchedDebug) {
  chrome.declarativeNetRequest.onRuleMatchedDebug.addListener(updateStats);
}

// Handle content script stats (fallback when debug API unavailable)
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'AD_STATS' && msg.domain && !EXCLUDED_DOMAINS.some(d => msg.domain.includes(d))) {
    getStats().then(stats => {
      stats.byDomain = stats.byDomain || {};
      stats.byType = stats.byType || {};
      stats.byRule = stats.byRule || {};
      stats.totalBlocked = (stats.totalBlocked || 0) + (msg.count || 1);
      const domain = msg.domain.replace(/^www\./, '');
      stats.byDomain[domain] = (stats.byDomain[domain] || 0) + (msg.count || 1);
      const adType = msg.adType || 'Element';
      stats.byType[adType] = (stats.byType[adType] || 0) + (msg.count || 1);
      stats.byRule['Element/CSS'] = (stats.byRule['Element/CSS'] || 0) + (msg.count || 1);
      return chrome.storage.local.set({ stats });
    });
    return true; // keep channel open for async
  }
});

// Track protected tabs (sites where blocker is active)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' || !tab?.url) return;
  try {
    const url = new URL(tab.url);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
    const host = url.hostname.replace(/^www\./, '');
    if (EXCLUDED_DOMAINS.some(d => host === d)) return;
    const { protected = {} } = await chrome.storage.local.get('protected');
    protected[host] = (protected[host] || 0) + 1;
    await chrome.storage.local.set({ protected });
  } catch (_) {}
});
