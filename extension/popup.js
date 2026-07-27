document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get({sourceLang: 'en', targetLang: 'ro'}, (res) => {
    document.getElementById('src').value = res.sourceLang;
    document.getElementById('tgt').value = res.targetLang;
  });
});

document.getElementById('save').onclick = () => {
  const src = document.getElementById('src').value;
  const tgt = document.getElementById('tgt').value;
  chrome.storage.sync.set({sourceLang: src, targetLang: tgt}, () => {
    alert('Settings saved!');
  });
};