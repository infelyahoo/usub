// content.js
// Coordinator only. All real logic lives in core/, providers/, parsers/.
// Loaded after those files (see manifest.json order).

(async () => {
  await USubSettings.load();
  USubOverlay.init();

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "VTT_FOUND") {
      USubHboProvider.handleVttFound(msg.url);
    } else if (msg.type === "DASH_SEGMENT_FOUND") {
      USubElisaProvider.handleSegmentFound(msg.url);
    }
  });
})();
