chrome.webRequest.onCompleted.addListener(
  (details) => {
    if (details.url.includes(".vtt") && details.tabId !== -1) {
      // Send ONLY to the tab that actually requested the VTT
      chrome.tabs.sendMessage(
        details.tabId,
        { type: "VTT_FOUND", url: details.url }
      ).catch(() => {});
    }
  },
  { urls: ["<all_urls>"] }
);