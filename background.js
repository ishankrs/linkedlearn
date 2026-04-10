const CONCURRENCY = 4;

let job = null;

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "START_JOB") {
    startJob(msg.videos);
    sendResponse({ started: true });
    return false;
  }

  if (msg.type === "VIDEO_DONE") {
    handleVideoDone(sender.tab?.id, msg.title, msg.error);
    sendResponse({ ok: true });
    return false;
  }

  if (msg.type === "GET_JOB_STATUS") {
    sendResponse(job
      ? { done: job.done, failed: job.failed, total: job.total, remaining: job.queue.length }
      : null
    );
    return false;
  }

  if (msg.type === "CANCEL_JOB") {
    cancelJob();
    sendResponse({ cancelled: true });
    return false;
  }

  if (msg.type === "AM_I_JOB_TAB") {
    const tabId = sender.tab?.id;
    const isJobTab = !!(job && tabId && job.activeTabs.has(tabId));
    sendResponse({ isJobTab });
    return false;
  }
});

function startJob(videos) {
  if (job) cancelJob();

  job = {
    queue: [...videos],
    done: 0,
    failed: 0,
    total: videos.length,
    activeTabs: new Set(),
    tabToWindow: {},
    launching: 0,
  };

  console.log(`[LinkedLearn BG] Job: ${videos.length} videos, ${CONCURRENCY} windows`);
  broadcastProgress();
  launchNextBatch();
}

function launchNextBatch() {
  if (!job) return;

  const slotsAvailable = CONCURRENCY - job.activeTabs.size - job.launching;
  const toLaunch = Math.min(slotsAvailable, job.queue.length);

  for (let i = 0; i < toLaunch; i++) {
    const video = job.queue.shift();
    job.launching++;

    const url = `https://www.linkedin.com/learning/${video.courseSlug}/${video.slug}?autoSkip=true&resume=false&u=${video.uParam || ""}`;

    chrome.windows.create({
      url,
      type: "normal",
      width: 800,
      height: 600,
      focused: false,
    }, (win) => {
      if (!job) return;
      job.launching--;

      if (!win?.tabs?.[0]) {
        job.failed++;
        broadcastProgress();
        launchNextBatch();
        return;
      }

      const tabId = win.tabs[0].id;
      job.activeTabs.add(tabId);
      job.tabToWindow[tabId] = win.id;
      console.log(`[LinkedLearn BG] Window ${win.id} → "${video.title}"`);
    });
  }
}

function handleVideoDone(tabId, title, error) {
  if (!job || !tabId || !job.activeTabs.has(tabId)) return;

  job.activeTabs.delete(tabId);

  if (error) {
    job.failed++;
    console.log(`[LinkedLearn BG] ✗ "${title}": ${error}`);
  } else {
    job.done++;
    console.log(`[LinkedLearn BG] ✓ "${title}" (${job.done}/${job.total})`);
  }

  // Close the window
  const winId = job.tabToWindow[tabId];
  delete job.tabToWindow[tabId];
  if (winId) chrome.windows.remove(winId).catch(() => {});

  broadcastProgress();

  if (job.queue.length > 0) {
    launchNextBatch();
  } else if (job.activeTabs.size === 0 && job.launching === 0) {
    broadcastDone();
    job = null;
  }
}

function cancelJob() {
  if (!job) return;
  for (const [tabId, winId] of Object.entries(job.tabToWindow)) {
    chrome.windows.remove(Number(winId)).catch(() => {});
  }
  job = null;
  console.log("[LinkedLearn BG] Cancelled");
}

function broadcastProgress() {
  if (!job) return;
  chrome.runtime.sendMessage({
    type: "PROGRESS",
    done: job.done,
    failed: job.failed,
    total: job.total,
    current: `${job.activeTabs.size} playing, ${job.queue.length} queued`,
  }).catch(() => {});
}

function broadcastDone() {
  if (!job) return;
  chrome.runtime.sendMessage({
    type: "DONE",
    done: job.done,
    failed: job.failed,
    total: job.total,
  }).catch(() => {});
}
