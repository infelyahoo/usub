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
  }
};
