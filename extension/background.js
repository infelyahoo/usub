chrome.webRequest.onCompleted.addListener(
  (details) => {
    if (details.url.includes(".vtt") && details.tabId !== -1) {
      // Send ONLY to the tab that actually requested the VTT
      chrome.tabs.sendMessage(
        details.tabId,
        { type: "VTT_FOUND", url: details.url }
      ).catch(() => {});
    }

    // DASH/Elisa segment matching (textstream_fin=1000-*.dash) will be
    // added here in the next step, sending a DASH_SEGMENT_FOUND message.
  },
  { urls: ["<all_urls>"] }
);
