# Eru Add Blocker

A Chrome extension that blocks ads across the web **except on YouTube and ChatGPT**, with a full-screen admin dashboard for analytics.

## Features

- **Ad blocking** – Blocks 40+ major ad networks (DoubleClick, Google AdSense, Taboola, Outbrain, Criteo, etc.)
- **YouTube & ChatGPT excluded** – Ads on YouTube and ChatGPT are not blocked; both work normally
- **Zero connection impact** – Uses Chrome's `declarativeNetRequest` API (browser-level filtering), so there are no extra network hops or slowdowns
- **Admin panel** – Full-viewport dashboard with:
  - **Total ads blocked** – Running count of blocked requests
  - **Sites with most ads blocked** – Top domains by ad count
  - **Protected sites (visits)** – Sites where blocking is active, with page-load visit counts
  - **Ad types blocked** – Display, Native, Retargeting, Programmatic, etc.
  - **Block methods** – Script, Banner/Image, Iframe, XHR, etc.
- **About section** – Info on exclusions, performance, and privacy

## Installation

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `BrowserExtension` folder

## Usage

- **Popup** – Click the extension icon to see total ads blocked and a link to the admin panel
- **Admin panel** – Click **Admin Panel** in the popup (must be opened from the extension; do not open `admin.html` as a file)

## Project Structure

| File / Folder      | Purpose                                              |
|--------------------|------------------------------------------------------|
| `manifest.json`    | Extension manifest (Manifest V3)                     |
| `rules.json`       | Static ad-blocking rules (40 networks, exclusions)   |
| `background.js`    | Service worker: stats tracking, protected-site logic |
| `content.js`       | Detects ad slots for stats (non-YouTube/ChatGPT)     |
| `popup.html/css/js`| Extension popup UI                                   |
| `admin.html/css/js`| Full-screen admin dashboard                          |
| `icons/`           | Extension icons (16, 32, 48, 128px)                  |
| `_metadata/`       | Chrome-generated rule index (auto-created, can ignore) |

## Privacy

All stats are stored locally in Chrome. Nothing is sent to external servers.
