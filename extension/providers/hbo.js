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

      // Pre-translate the whole file in one batch request instead of
      // waiting for each cue to hit on-demand during playback.
      this.translateAll(cues);
    } catch (e) {
      console.error("[USub/HBO] Failed to load VTT", e);
    }
  },

  async translateAll(cues) {
    if (cues.length === 0) return;
    const settings = USubSettings.get();
    const map = await USubTranslator.translateBatch(cues.map(c => c.original), settings);
    for (const cue of cues) {
      if (!cue.translated) cue.translated = map.get(cue.original);
    }
    console.log(`[USub/HBO] Pre-translated ${cues.length} cues`);
  }
};
