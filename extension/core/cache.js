// core/cache.js
// In-memory translation cache, keyed by "source|target|text".

const USubCache = {
  map: new Map(),

  key(source, target, text) {
    return `${source}|${target}|${text}`;
  },

  has(source, target, text) {
    return this.map.has(this.key(source, target, text));
  },

  get(source, target, text) {
    return this.map.get(this.key(source, target, text));
  },

  set(source, target, text, translated) {
    this.map.set(this.key(source, target, text), translated);
  }
};
