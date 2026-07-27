// content.js
// Coordinator only. All real logic lives in core/, providers/, parsers/.
// Loaded after those files (see manifest.json order).

// Maps the messageType from shared/detector.js to the provider that
// handles it. Adding a new provider = one new line here + a detector
// entry + the provider file itself.
const USubProviderHandlers = {
  VTT_FOUND: (url) => USubHboProvider.handleVttFound(url),
  DASH_SEGMENT_FOUND: (url) => USubElisaProvider.handleSegmentFound(url)
};

(async () => {
  await USubSettings.load();
  USubOverlay.init();

  chrome.runtime.onMessage.addListener((msg) => {
    const handler = USubProviderHandlers[msg.type];
    if (handler) handler(msg.url);
  });
})();
