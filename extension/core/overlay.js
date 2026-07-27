// core/overlay.js
// Owns the on-page overlay element and the timeupdate -> cue lookup -> render
// loop. Providers feed it cues via setCues()/addCues(); this module doesn't
// know or care where the cues came from (VTT, TTML, etc).

const USubOverlay = {
  el: null,
  video: null,
  cues: [],
  currentCueIndex: -1,
  lastSyncTime: 0,
  SYNC_THROTTLE: 150, // ms

  init() {
    this.video = document.querySelector("video");
    if (!this.video) {
      setTimeout(() => this.init(), 500); // retry until player mounts
      return;
    }

    if (!this.el) {
      this.el = document.createElement("div");
      this.el.id = "subtitle-overlay";
      document.body.appendChild(this.el);
    }

    const reattach = () => {
      // Small delay so the browser finishes switching fullscreen modes
      setTimeout(() => {
        if (this.el && !document.body.contains(this.el)) {
          document.body.appendChild(this.el);
        }
        this.el.style.bottom = "8%";
      }, 300);
    };

    document.addEventListener("fullscreenchange", reattach);
    document.addEventListener("webkitfullscreenchange", reattach);
    document.addEventListener("mozfullscreenchange", reattach);

    this.video.addEventListener("timeupdate", () => this.sync());
  },

  // Replace the whole cue list (HBO: one VTT file = one full replace).
  setCues(cues) {
    this.cues = cues;
    this.currentCueIndex = -1;
  },

  // Merge in new cues without dropping existing ones (DASH: many small
  // segments arriving over time). Dedupes on start+end+original text.
  addCues(newCues) {
    for (const cue of newCues) {
      const exists = this.cues.some(
        c => c.start === cue.start && c.end === cue.end && c.original === cue.original
      );
      if (!exists) this.cues.push(cue);
    }
    this.cues.sort((a, b) => a.start - b.start);
  },

  async sync() {
    const now = Date.now();
    if (now - this.lastSyncTime < this.SYNC_THROTTLE) return;
    this.lastSyncTime = now;

    if (!this.video || this.cues.length === 0) return;

    const t = this.video.currentTime;
    const idx = this.cues.findIndex(c => t >= c.start && t <= c.end + 0.1);

    if (idx === this.currentCueIndex) return;
    this.currentCueIndex = idx;

    if (idx === -1) {
      this.el.textContent = "";
      return;
    }

    const cue = this.cues[idx];

    if (!cue.translated) {
      const settings = USubSettings.get();
      try {
        cue.translated = await USubTranslator.translate(cue.original, settings);
      } catch (e) {
        console.warn("[USub] Translation failed, using original:", cue.original);
        cue.translated = cue.original;
      }
    }

    this.el.textContent = cue.translated || cue.original;
  }
};
