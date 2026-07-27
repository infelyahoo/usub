importScripts("shared/detector.js");

chrome.webRequest.onCompleted.addListener(
  (details) => {
    if (details.tabId === -1) return;

    const provider = USubDetector.detect(details.url);
    if (!provider) return; // not subtitle traffic we recognize - ignore

    chrome.tabs.sendMessage(
      details.tabId,
      { type: provider.messageType, url: details.url }
    ).catch(() => {});
  },
  { urls: ["<all_urls>"] }
);
