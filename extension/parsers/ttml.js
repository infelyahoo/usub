// parsers/ttml.js
// Parses TTML/IMSC1 subtitle XML (the format inside Elisa's stpp.ttml.im1t
// segments) into the same {start, end, original, translated} cue shape the
// VTT parser produces, so core/overlay.js doesn't need to care which
// provider a cue came from.

const USubTtmlParser = {
  parse(xmlText) {
    const cues = [];

    let doc;
    try {
      doc = new DOMParser().parseFromString(xmlText, "application/xml");
    } catch (e) {
      console.error("[USub/TTML] Failed to parse XML", e);
      return cues;
    }

    if (doc.querySelector("parsererror")) {
      console.warn("[USub/TTML] XML parse error, skipping this segment");
      return cues;
    }

    const paragraphs = doc.getElementsByTagName("p");
    for (const p of paragraphs) {
      const start = this.parseTime(p.getAttribute("begin"));
      const end = this.parseTime(p.getAttribute("end"));
      const text = this.extractText(p);

      if (!text || isNaN(start) || isNaN(end)) continue;
      cues.push({ start, end, original: text, translated: null });
    }

    return cues;
  },

  // Walks child nodes so <br/> becomes a space instead of vanishing (plain
  // textContent would just concatenate lines with no separator).
  extractText(el) {
    let text = "";
    for (const node of el.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const name = node.localName || node.tagName;
        text += name === "br" ? " " : this.extractText(node);
      }
    }
    return text.replace(/\s+/g, " ").trim();
  },

  // Supports TTML clock-time ("00:00:01.360") and offset-time ("1.36s").
  // Frame/tick-based offsets (f/t suffix) are returned as-is best-effort,
  // since we don't have the document's tickRate/frameRate here - Elisa's
  // segments observed so far use clock-time, so this is a safe fallback.
  parseTime(t) {
    if (!t) return NaN;
    t = t.trim();

    const offsetMatch = t.match(/^(\d+(?:\.\d+)?)(h|m|s|ms|f|t)$/);
    if (offsetMatch) {
      const value = parseFloat(offsetMatch[1]);
      switch (offsetMatch[2]) {
        case "h": return value * 3600;
        case "m": return value * 60;
        case "s": return value;
        case "ms": return value / 1000;
        default: return value;
      }
    }

    const parts = t.split(":");
    if (parts.length >= 3) {
      const h = parseFloat(parts[0]) || 0;
      const m = parseFloat(parts[1]) || 0;
      const s = parseFloat(parts[2]) || 0;
      return h * 3600 + m * 60 + s;
    }

    return NaN;
  }
};
