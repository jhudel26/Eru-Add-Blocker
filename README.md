# Eru Add Blocker

A Chrome extension that blocks ads across the web **except on YouTube and Chatgpt**, with an admin panel for analytics.

## Features

- **Ad blocking** – Blocks 40+ major ad networks (DoubleClick, Google AdSense, Taboola, Outbrain, etc.)
- **YouTube excluded** – Ads on YouTube are not blocked; creators and videos work normally
- **Zero connection impact** – Uses Chrome’s `declarativeNetRequest` API (browser-level filtering), so there are no extra network hops or slowdowns
- **Admin panel** – Dashboard showing:
  - Total ads blocked
  - Sites with the most ads blocked
  - Protected sites (where blocking is active)
  - Types of ads blocked (Display, Native, Retargeting, etc.)
  - Block methods (Script, Banner, Iframe, etc.)

## Installation

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode** (top-right)
3. Click **Load unpacked**
4. Select the `BrowserExtension` folder

## Usage

- **Popup**: Click the extension icon to see total ads blocked and a link to the admin panel
- **Admin panel**: Click **Open Admin Panel** in the popup, or open the extension’s admin page from the extensions page

## Optional: Custom icons

Chrome uses a default icon if none are set. To add custom icons:

1. Open `icons/icon-generator.html` in a browser
2. Right-click each canvas and save as:
   - `icons/icon16.png` (16×16)
   - `icons/icon48.png` (48×48)
   - `icons/icon128.png` (128×128)
3. Add this to `manifest.json` under `"action"` and at the root:

```json
"action": {
  "default_popup": "popup.html",
  "default_icon": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
},
"icons": {
  "16": "icons/icon16.png",
  "48": "icons/icon48.png",
  "128": "icons/icon128.png"
}
```

## Privacy

All stats are stored locally in Chrome. Nothing is sent to external servers.

