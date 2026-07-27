async function translate(text, settings) {
  if (!text) return "";
  
  const url = `http://localhost:5000/translate?from=${settings.sourceLang}&to=${settings.targetLang}&q=${encodeURIComponent(text)}`;
  
  try {
    const res = await fetch(url, { 
      method: "GET",
      mode: "cors" 
    });
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    
    const data = await res.json();
    return data.translated || text;
  } catch (e) {
    console.error("Translation failed for:", text, e);
    return text;   // fallback to original
  }
}