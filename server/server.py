from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
import argostranslate.translate
import argostranslate.package

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return response

@app.route("/translate")
def translate_text():
    text = request.args.get("q", "").strip()
    src = request.args.get("from", "en")
    tgt = request.args.get("to", "ro")

    if not text:
        resp = make_response(jsonify({"translated": ""}))
        return add_cors_headers(resp)

    try:
        translation = argostranslate.translate.translate(text, src, tgt)
        resp = make_response(jsonify({"translated": translation}))
        return add_cors_headers(resp)
    except Exception as e:
        error_msg = str(e)
        print(f"Translation error [{src}->{tgt}]: '{text}' → {error_msg}")

        if "NoneType" in error_msg or "get_translation" in error_msg:
            print(f"   → Language pair {src}->{tgt} is probably not installed!")

        # Fallback: return original text
        resp = make_response(jsonify({"translated": text}))
        return add_cors_headers(resp)

if __name__ == "__main__":
    print("✅ Server running on http://localhost:5000")
    print("   (Robust error handling + manual CORS)")
    app.run(port=5000, debug=False)