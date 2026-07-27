// shared/detector.js
// Single source of truth for "what kind of subtitle traffic is this URL,
// and which provider handles it". Both background.js (service worker,
// loaded via importScripts) and content.js (page context, loaded as a
// regular content script) use this same registry, so adding a new
// streaming service means adding one entry here rather than editing
// matching logic in two different files.
//
// To add a new provider: add an entry below, add a providers/<id>.js file
// exposing a handler, and add one line to USubProviderHandlers in
// content.js mapping messageType -> handler.

const USubDetector = {
  providers: [
    {
      id: "hbo",
      // HBO Max: single WebVTT file per video
      test: (url) => url.includes(".vtt"),
      messageType: "VTT_FOUND"
    },
    {
      id: "elisa",
      // Elisa Viihde: fragmented MP4/TTML DASH text segments. Video/audio
      // .dash segments don't contain "textstream_", so this only matches
      // subtitle track requests.
      test: (url) => url.includes(".dash") && url.includes("textstream_"),
      messageType: "DASH_SEGMENT_FOUND"
    }
  ],

  // Returns the first matching provider entry, or null if this URL isn't
  // subtitle traffic we recognize.
  detect(url) {
    return this.providers.find(p => p.test(url)) || null;
  }
};

// Allow the same file to be required() in a Node test harness.
if (typeof module !== "undefined" && module.exports) {
  module.exports = USubDetector;
}
