from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
import argostranslate.translate
import argostranslate.package

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return response

def translate_one(text, src, tgt):
    """Translate a single string, falling back to the original text on any
    error (missing language pair, model issue, etc). Argos chains pivot
    languages automatically (e.g. fi->en->ro) when no direct pair exists."""
    text = (text or "").strip()
    if not text:
        return ""
    try:
        return argostranslate.translate.translate(text, src, tgt)
    except Exception as e:
        error_msg = str(e)
        print(f"Translation error [{src}->{tgt}]: '{text}' → {error_msg}")
        if "NoneType" in error_msg or "get_translation" in error_msg:
            print(f"   → Language pair {src}->{tgt} is probably not installed!")
        return text

@app.route("/translate", methods=["GET", "POST", "OPTIONS"])
def translate_text():
    if request.method == "OPTIONS":
        resp = make_response("")
        return add_cors_headers(resp)

    if request.method == "POST":
        payload = request.get_json(silent=True) or {}
        texts = payload.get("q", [])
        src = payload.get("from", "en")
        tgt = payload.get("to", "ro")

        # Accept a single string too, for convenience / backward compatibility
        if isinstance(texts, str):
            texts = [texts]

        translations = [translate_one(t, src, tgt) for t in texts]

        resp = make_response(jsonify({"translated": translations}))
        return add_cors_headers(resp)

    # GET: original single-text path, kept working unchanged for anything
    # still calling it this way.
    text = request.args.get("q", "").strip()
    src = request.args.get("from", "en")
    tgt = request.args.get("to", "ro")

    translation = translate_one(text, src, tgt)
    resp = make_response(jsonify({"translated": translation}))
    return add_cors_headers(resp)

if __name__ == "__main__":
    print("✅ Server running on http://localhost:5000")
    print("   (Batch + single-text /translate, robust error handling, manual CORS)")
    app.run(port=5000, debug=False)
