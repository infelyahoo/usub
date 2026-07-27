// parsers/vtt.js
// WebVTT parsing, extracted from the original content.js with no logic
// changes - same behavior as before, just isolated so a future TTML
// parser (parsers/ttml.js) can sit next to it cleanly.

const USubVttParser = {
  parse(vttText) {
    const lines = vttText.split("\n");
    const cues = [];

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes("-->")) {
        const parts = lines[i].split(" --> ");
        if (parts.length < 2) continue;

        const startStr = parts[0].trim();
        let endStr = parts[1].trim().split(/\s+/)[0];

        let text = "";
        i++;
        while (i < lines.length && lines[i].trim() !== "") {
          text += lines[i++] + " ";
        }
        text = text.replace(/<[^>]+>/g, "").trim();
        if (!text) continue;

        const start = this.toSeconds(startStr);
        const end = this.toSeconds(endStr);

        if (!isNaN(start) && !isNaN(end)) {
          cues.push({ start, end, original: text, translated: null });
        }
      }
    }
    return cues;
  },

  toSeconds(t) {
    if (!t) return NaN;
    const parts = t.split(":").map(p => p.trim());
    let h = 0, m = 0, s = 0, ms = 0;

    if (parts.length === 3) {
      h = parseFloat(parts[0]) || 0;
      m = parseFloat(parts[1]) || 0;
      const sp = parts[2].split(".");
      s = parseFloat(sp[0]) || 0;
      ms = sp[1] ? parseFloat(sp[1]) : 0;
    } else if (parts.length === 2) {
      m = parseFloat(parts[0]) || 0;
      const sp = parts[1].split(".");
      s = parseFloat(sp[0]) || 0;
      ms = sp[1] ? parseFloat(sp[1]) : 0;
    }
    return h * 3600 + m * 60 + s + ms / 1000;
  }
};
