// providers/elisa.js
// Elisa Viihde: background.js watches webRequest for DASH text-track
// segments (textstream_<lang>=1000-*.dash) and messages this tab per
// segment. Unlike HBO's single VTT file, subtitles arrive as many small
// time-boxed fragments over the course of playback, so we accumulate cues
// via USubOverlay.addCues() rather than replacing the list each time.

const USubElisaProvider = {
  seenUrls: new Set(),

  // MPD lang attribute -> textstream_<code> URL fragment, e.g.
  // lang="fi" AdaptationSet -> Representation id="textstream_fin=1000"
  langMap: { fi: "fin", sv: "swe" },

  async handleSegmentFound(url) {
    if (this.seenUrls.has(url)) return;

    const settings = USubSettings.get();
    const wantedCode = this.langMap[settings.sourceLang];

    // If we know which language the user wants and this segment isn't it
    // (e.g. Swedish track while sourceLang is Finnish), skip it. If the
    // source language has no known DASH code, fall through and try anyway.
    if (wantedCode && !url.includes(`textstream_${wantedCode}`)) return;

    this.seenUrls.add(url);

    try {
      const res = await fetch(url);
      const buffer = await res.arrayBuffer();

      const mdat = USubMp4Extractor.findBox(buffer, "mdat");
      if (!mdat || mdat.byteLength === 0) {
        // Init segment: MP4 headers only, no subtitle payload - expected.
        return;
      }

      const xmlText = this.extractXml(mdat);
      if (!xmlText) return;

      const cues = USubTtmlParser.parse(xmlText);
      if (cues.length > 0) {
        USubOverlay.addCues(cues);
        console.log(`[USub/Elisa] +${cues.length} cues (total ${USubOverlay.cues.length})`);
      }
    } catch (e) {
      console.error("[USub/Elisa] Failed to process DASH segment", url, e);
    }
  },

  extractXml(mdatBuffer) {
    const text = new TextDecoder("utf-8").decode(mdatBuffer);
    const start = text.indexOf("<?xml");
    const end = text.indexOf("</tt>");
    if (start === -1 || end === -1) return null;
    return text.slice(start, end + "</tt>".length);
  }
};
