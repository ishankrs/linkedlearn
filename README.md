# LinkedLearn — Auto Complete

> One-click complete all videos in a LinkedIn Learning course.

LinkedLearn is a Chrome extension that automates LinkedIn Learning video completion. Navigate to any course page, open the popup, and let it handle the rest — it plays every video at high speed across parallel browser windows so you get credit for each one in seconds.

## Features

- **Instant course detection** — automatically reads the course page you're on and fetches the full outline via LinkedIn's API
- **Completion-aware** — shows Total / Done / Left counts so you see exactly where you stand
- **Complete Remaining** — only processes videos you haven't finished yet
- **Force re-mark** — optionally re-completes every video, even ones already marked done
- **Parallel playback** — opens up to 4 windows simultaneously for fast throughput
- **10x speed** — mutes audio and drives playback at 10x so each video finishes in seconds
- **Live progress** — real-time progress bar, counter, and elapsed timer in the popup
- **Cancel anytime** — stop the job mid-run; all spawned windows are cleaned up automatically

## How It Works

1. You open the extension popup while on a `linkedin.com/learning/…` course page.
2. The content script reads your session cookies and calls LinkedIn's learning API to fetch the course outline and per-video completion status.
3. When you click **Complete Remaining**, the service worker queues every unfinished video and opens up to 4 Chrome windows in parallel.
4. In each window a content script finds the `<video>` element, mutes it, and plays it at 10x speed. A MAIN-world script patches `playbackRate` so LinkedIn's player can't cap the speed.
5. Once a video fires the `ended` event, the window closes and the next queued video takes its slot.
6. When all videos are done, the popup shows a success screen with a **Reload Page** button to refresh the course page and see updated progress.

No external servers or third-party APIs are involved — everything runs locally through your existing LinkedIn session.

## Installation

1. Clone or download this repository:
   ```bash
   git clone https://github.com/<your-username>/linkedlearn.git
   ```
2. Open Chrome and go to `chrome://extensions/`.
3. Enable **Developer mode** (toggle in the top-right corner).
4. Click **Load unpacked** and select the `linkedlearn` folder.
5. Pin the extension to your toolbar for easy access.

## Usage

1. Go to any LinkedIn Learning course page (e.g. `linkedin.com/learning/some-course`).
2. Click the **LinkedLearn** icon in the toolbar.
3. Review the course stats (Total / Done / Left).
4. Click **Complete Remaining** to finish only unwatched videos, or **Complete All** to re-mark everything.
5. Watch the progress bar — cancel anytime if needed.
6. When done, click **Reload Page** to see your updated completion on LinkedIn.

## Project Structure

```
linkedlearn/
├── manifest.json    # MV3 extension config
├── background.js    # Service worker — job queue, concurrency, window lifecycle
├── content.js       # Content script — API calls, cookie/CSRF handling, video automation
├── speed.js         # MAIN-world script — patches playbackRate to bypass speed caps
├── popup.html       # Extension popup markup
├── popup.js         # Popup logic — UI state, messaging, progress updates
├── popup.css        # Popup styles — dark theme, progress bar, stats layout
└── icons/           # Toolbar and extension icons (16/48/128px)
```

## Permissions

| Permission | Reason |
|---|---|
| `activeTab` | Read the URL of the current tab to detect the course |
| `tabs` | Query and message the active tab from the popup |
| `scripting` | Reserved for future use |
| `storage` | Reserved for future use |
| `https://www.linkedin.com/*` | Run content scripts and make API requests on LinkedIn |

## Tech Stack

- **Chrome Extension Manifest V3** with a service worker background
- **Vanilla JavaScript** — no frameworks, no bundler, no npm dependencies
- **HTML/CSS** popup with a dark theme

## Disclaimer

This project is **not affiliated with, endorsed by, or associated with LinkedIn or Microsoft** in any way. LinkedIn and LinkedIn Learning are trademarks of LinkedIn Corporation and/or Microsoft Corporation.

This extension automates video playback to register completion through LinkedIn's normal tracking. It does not call any hidden or undocumented "mark complete" endpoints — it simply plays each video in a real browser tab using your logged-in session. Use responsibly and be aware that automated course completion may conflict with LinkedIn Learning's Terms of Service or your organization's learning policies.

## License

MIT
