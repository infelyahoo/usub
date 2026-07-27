let subtitles = [];           // {start, end, originalText, translatedText?}
let video = null;
let overlay = null;
let currentCueIndex = -1;
let lastVttUrl = "";
let translationCache = new Map();  // "original text" → "translated"

chrome.storage.sync.get({sourceLang: "en", targetLang: "ro"}, (res) => {
  settings = res;
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "VTT_FOUND") loadVtt(msg.url);
});

async function loadVtt(url) {
  if (url === lastVttUrl) return;
  lastVttUrl = url;

  try {
    const res = await fetch(url);
    const text = await res.text();
    subtitles = parseVtt(text);        // now synchronous, no translation here
    initOverlay();
    console.log(`Loaded ${subtitles.length} subtitle cues`);
  } catch (e) {
    console.error("Failed to load VTT", e);
  }
}

function parseVtt(vtt) {
  const lines = vtt.split("\n");
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

      const start = toSeconds(startStr);
      const end = toSeconds(endStr);

      if (!isNaN(start) && !isNaN(end)) {
        cues.push({
          start: start,
          end: end,
          original: text,
          translated: null   // will be filled on demand
        });
      }
    }
  }
  return cues;
}

function toSeconds(t) {
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

function initOverlay() {
  video = document.querySelector("video");
  if (!video) {
    setTimeout(initOverlay, 500);   // retry if video not ready yet
    return;
  }

  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "subtitle-overlay";
    document.body.appendChild(overlay);
  }

  // Re-attach overlay whenever fullscreen changes
  const fullscreenHandler = () => {
    // Small delay so Chrome finishes switching modes
    setTimeout(() => {
      if (overlay && !document.body.contains(overlay)) {
        document.body.appendChild(overlay);
      }
      // Force position again
      overlay.style.bottom = "8%";
    }, 300);
  };

  document.addEventListener("fullscreenchange", fullscreenHandler);
  document.addEventListener("webkitfullscreenchange", fullscreenHandler);
  document.addEventListener("mozfullscreenchange", fullscreenHandler);

  video.addEventListener("timeupdate", sync);
}

let lastSyncTime = 0;
const SYNC_THROTTLE = 150; // ms - don't run sync too often

async function sync() {
  const now = Date.now();
  if (now - lastSyncTime < SYNC_THROTTLE) return;
  lastSyncTime = now;

  if (!video || subtitles.length === 0) return;

  const t = video.currentTime;
  const idx = subtitles.findIndex(c => t >= c.start && t <= c.end + 0.1); // small tolerance

  if (idx === currentCueIndex) return;

  currentCueIndex = idx;

  if (idx === -1) {
    overlay.textContent = "";
    return;
  }

  const cue = subtitles[idx];

  // Translate on demand with cache
  if (!cue.translated) {
    if (translationCache.has(cue.original)) {
      cue.translated = translationCache.get(cue.original);
    } else {
      try {
        cue.translated = await translate(cue.original, settings);
        translationCache.set(cue.original, cue.translated);
      } catch (e) {
        console.warn("Translation failed, using original:", cue.original);
        cue.translated = cue.original;
      }
    }
  }

  overlay.textContent = cue.translated || cue.original;
}