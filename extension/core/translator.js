// core/translator.js
// Talks to the local Argos Flask server. Same GET /translate endpoint and
// behavior as the original translator.js - batching comes in a later step.

const USubTranslator = {
  async translate(text, settings) {
    if (!text) return "";

    const { sourceLang, targetLang, serverUrl } = settings;

    if (USubCache.has(sourceLang, targetLang, text)) {
      return USubCache.get(sourceLang, targetLang, text);
    }

    const base = serverUrl || "http://localhost:5000";
    const url = `${base}/translate?from=${sourceLang}&to=${targetLang}&q=${encodeURIComponent(text)}`;

    try {
      const res = await fetch(url, { method: "GET", mode: "cors" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const translated = data.translated || text;
      USubCache.set(sourceLang, targetLang, text, translated);
      return translated;
    } catch (e) {
      console.error("[USub] Translation failed for:", text, e);
      return text; // fallback to original
    }
  },

  // Translates many strings in one request. Skips anything already cached
  // and de-dupes repeated lines (subtitles repeat a lot - "What?", "No.",
  // etc). Returns a Map from original text -> translated text (or the
  // original text itself if translation failed/was skipped).
  async translateBatch(texts, settings) {
    const { sourceLang, targetLang, serverUrl } = settings;
    const base = serverUrl || "http://localhost:5000";

    const misses = [...new Set(
      texts.filter(t => t && !USubCache.has(sourceLang, targetLang, t))
    )];

    if (misses.length > 0) {
      try {
        const res = await fetch(`${base}/translate`, {
          method: "POST",
          mode: "cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ q: misses, from: sourceLang, to: targetLang })
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        const translations = data.translated || [];
        misses.forEach((text, i) => {
          USubCache.set(sourceLang, targetLang, text, translations[i] || text);
        });
      } catch (e) {
        console.error("[USub] Batch translation failed:", e);
        // Leave these uncached - individual translate() calls in
        // core/overlay.js's sync() act as a per-cue fallback.
      }
    }

    const result = new Map();
    for (const t of texts) {
      result.set(
        t,
        USubCache.has(sourceLang, targetLang, t) ? USubCache.get(sourceLang, targetLang, t) : t
      );
    }
    return result;
  }
};
