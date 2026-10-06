"""Dependency-free local server for the AERIS SIH26247 prototype."""

from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import json
import urllib.parse

from ai_model import TinyThreatClassifier, evidence_for

ROOT = Path(__file__).parent
WEB = ROOT / "web"
SCENARIOS = json.loads((ROOT / "data" / "scenarios.json").read_text(encoding="utf-8"))
AI_MODEL = TinyThreatClassifier.load() if (ROOT / "data" / "threat_role_model.json").exists() else None


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(WEB), **kwargs)

    def _json(self, payload, status=200):
        raw = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/scenarios":
            return self._json({"scenarios": SCENARIOS})
        if parsed.path == "/api/health":
            return self._json({"ok": True, "service": "aeris-local", "offlineReady": True, "aiModel": AI_MODEL is not None})
        if parsed.path == "/api/ai/status":
            return self._json({"available": AI_MODEL is not None, "model": AI_MODEL.name if AI_MODEL else None})
        return super().do_GET()

    def do_POST(self):
        if self.path == "/api/ai/predict":
            if AI_MODEL is None:
                return self._json({"error": "AI model is not trained"}, 503)
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length)
            try:
                payload = json.loads(body.decode("utf-8")) if body else {}
            except json.JSONDecodeError:
                return self._json({"error": "invalid JSON"}, 400)
            threat = payload.get("threat", {})
            context = payload.get("context", {})
            prediction = AI_MODEL.predict(threat, context)
            prediction["evidence"] = evidence_for(threat, prediction)
            return self._json(prediction)
        if self.path != "/api/session":
            return self._json({"error": "not found"}, 404)
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length)
        try:
            payload = json.loads(body.decode("utf-8")) if body else {}
        except json.JSONDecodeError:
            return self._json({"error": "invalid JSON"}, 400)
        return self._json({"accepted": True, "sessionId": "AERIS-LOCAL", "summary": payload}, 202)


if __name__ == "__main__":
    print("AERIS running at http://localhost:8080")
    ThreadingHTTPServer(("127.0.0.1", 8080), Handler).serve_forever()
