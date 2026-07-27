// core/settings.js
// Holds user settings (languages, server URL) loaded from chrome.storage.

const USubSettings = {
  data: { sourceLang: "en", targetLang: "ro", serverUrl: "http://localhost:5000" },

  async load() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(this.data, (res) => {
        this.data = res;
        resolve(res);
      });
    });
  },

  get() {
    return this.data;
  }
};
