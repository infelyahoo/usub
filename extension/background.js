chrome.webRequest.onCompleted.addListener(
  (details) => {
    if (details.tabId === -1) return;

    if (details.url.includes(".vtt")) {
      chrome.tabs.sendMessage(
        details.tabId,
        { type: "VTT_FOUND", url: details.url }
      ).catch(() => {});
      return;
    }

    // Elisa/DASH subtitle segments: e.g.
    // ...-textstream_fin=1000-780000.dash (media) or
    // ...-textstream_fin=1000.dash (init segment, no subtitle payload).
    // Video/audio .dash segments don't contain "textstream_" so this
    // leaves those alone.
    if (details.url.includes(".dash") && details.url.includes("textstream_")) {
      chrome.tabs.sendMessage(
        details.tabId,
        { type: "DASH_SEGMENT_FOUND", url: details.url }
      ).catch(() => {});
    }
  },
  { urls: ["<all_urls>"] }
);
