// content.js
// Coordinator only. All real logic lives in core/, providers/, parsers/.
// Loaded after those files (see manifest.json order).

(async () => {
  await USubSettings.load();
  USubOverlay.init();

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "VTT_FOUND") {
      USubHboProvider.handleVttFound(msg.url);
    }
    // DASH_SEGMENT_FOUND will be added here in the Elisa/DASH step.
  });
})();
