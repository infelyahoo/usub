// providers/hbo.js
// HBO Max / Max.com: background.js watches webRequest for *.vtt and messages
// this tab. This provider fetches and parses it, then replaces the overlay's
// cue list wholesale (HBO delivers one complete VTT file per episode/video).

const USubHboProvider = {
  lastUrl: "",

  async handleVttFound(url) {
    if (url === this.lastUrl) return;
    this.lastUrl = url;

    try {
      const res = await fetch(url);
      const text = await res.text();
      const cues = USubVttParser.parse(text);
      USubOverlay.setCues(cues);
      console.log(`[USub/HBO] Loaded ${cues.length} subtitle cues`);
    } catch (e) {
      console.error("[USub/HBO] Failed to load VTT", e);
    }
  }
};
