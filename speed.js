// Runs in the MAIN world (page context), before LinkedIn's player code loads.
// This patches the native playbackRate so no player framework can cap it.
(function () {
  "use strict";

  const RATE_KEY = "__linkedlearn_rate";
  const nativeDesc = Object.getOwnPropertyDescriptor(
    HTMLMediaElement.prototype,
    "playbackRate"
  );
  if (!nativeDesc) return;

  const nativeGet = nativeDesc.get;
  const nativeSet = nativeDesc.set;

  Object.defineProperty(HTMLMediaElement.prototype, "playbackRate", {
    get() {
      return nativeGet.call(this);
    },
    set(val) {
      // If our extension set a forced rate, enforce it
      const forced = this[RATE_KEY];
      if (forced && val < forced) {
        nativeSet.call(this, forced);
        return;
      }
      nativeSet.call(this, val);
    },
    configurable: true,
    enumerable: true,
  });

  // Listen for speed commands from the content script via custom events
  window.addEventListener("linkedlearn-set-speed", (e) => {
    const rate = e.detail?.rate || 10;
    const videos = document.querySelectorAll("video");
    videos.forEach((v) => {
      v[RATE_KEY] = rate;
      nativeSet.call(v, rate);
    });
    console.log(`[LinkedLearn/speed] Forced playbackRate=${rate}x on ${videos.length} video(s)`);
  });

  window.addEventListener("linkedlearn-clear-speed", () => {
    const videos = document.querySelectorAll("video");
    videos.forEach((v) => {
      delete v[RATE_KEY];
    });
    console.log("[LinkedLearn/speed] Speed override cleared");
  });
})();
