"""Small dependency-free local classifier used by the AERIS trainer."""

from __future__ import annotations

import json
import math
from pathlib import Path


ROOT = Path(__file__).parent
MODEL_PATH = ROOT / "data" / "threat_role_model.json"
FEATURE_NAMES = [
    "speed",
    "priority",
    "confidence",
    "micro_uas",
    "spoofed_track",
    "commercial_quad",
    "low_observable",
    "night",
    "swarm",
    "bias",
]
CLASSES = ["scout", "decoy", "cargo", "unknown"]
PRIORITY = {"low": 0.25, "medium": 0.55, "high": 1.0}
SIGNATURES = {
    "micro-UAS": "micro_uas",
    "spoofed-track": "spoofed_track",
    "commercial-quad": "commercial_quad",
    "low-observable": "low_observable",
}


def _clip(value: float, low: float = 0.0, high: float = 1.0) -> float:
    return max(low, min(high, float(value)))


def _softmax(logits: list[float]) -> list[float]:
    peak = max(logits)
    values = [math.exp(value - peak) for value in logits]
    total = sum(values) or 1.0
    return [value / total for value in values]


class TinyThreatClassifier:
    """A small multiclass softmax model trained on synthetic AERIS tracks."""

    def __init__(self, payload: dict):
        self.name = payload.get("name", "aeris-softmax-v1")
        self.classes = payload["classes"]
        self.features = payload["features"]
        self.weights = payload["weights"]
        self.training = payload.get("training", {})

    @classmethod
    def load(cls, path: Path = MODEL_PATH) -> "TinyThreatClassifier":
        return cls(json.loads(path.read_text(encoding="utf-8")))

    def vectorize(self, threat: dict, context: dict | None = None) -> list[float]:
        context = context or {}
        values = {name: 0.0 for name in self.features}
        values["speed"] = _clip(threat.get("speed", 0.5))
        values["priority"] = PRIORITY.get(threat.get("priority", "medium"), 0.55)
        values["confidence"] = _clip(threat.get("confidence", 0.5))
        signature_key = SIGNATURES.get(threat.get("signature", ""))
        if signature_key in values:
            values[signature_key] = 1.0
        values["night"] = 1.0 if context.get("night") else 0.0
        values["swarm"] = 1.0 if context.get("swarm") else 0.0
        values["bias"] = 1.0
        return [values[name] for name in self.features]

    def predict(self, threat: dict, context: dict | None = None) -> dict:
        vector = self.vectorize(threat, context)
        logits = [sum(weight * value for weight, value in zip(row, vector)) for row in self.weights]
        probabilities = _softmax(logits)
        ranked = sorted(zip(self.classes, probabilities), key=lambda item: item[1], reverse=True)
        label, confidence = ranked[0]
        return {
            "label": label,
            "confidence": round(confidence, 4),
            "probabilities": {name: round(probability, 4) for name, probability in ranked},
            "features": {name: round(value, 3) for name, value in zip(self.features, vector) if value},
            "model": self.name,
        }


def evidence_for(threat: dict, prediction: dict) -> list[str]:
    """Return human-readable cues alongside the model output."""
    cues = []
    signature = threat.get("signature", "unknown signature")
    cues.append(signature)
    cues.append(f"{threat.get('priority', 'medium')} priority")
    cues.append(f"speed {float(threat.get('speed', 0.5)):.2f}")
    if prediction["features"].get("night"):
        cues.append("night context")
    if prediction["features"].get("swarm"):
        cues.append("swarm context")
    return cues
