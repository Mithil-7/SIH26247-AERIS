"""Train the tiny synthetic threat-role model used by the offline prototype."""

from __future__ import annotations

import json
import random
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from ai_model import CLASSES, FEATURE_NAMES  # noqa: E402


def clip(value: float) -> float:
    return max(0.0, min(1.0, value))


def make_sample(role: str, rng: random.Random) -> list[float]:
    profile = {
        "scout": (0.82, 1.0, 0.80, [1.0, 0.0, 0.0, 0.0]),
        "decoy": (0.54, 0.55, 0.64, [0.0, 1.0, 0.0, 0.0]),
        "cargo": (0.34, 0.25, 0.76, [0.0, 0.0, 1.0, 0.0]),
        "unknown": (0.67, 0.85, 0.45, [0.0, 0.0, 0.0, 1.0]),
    }[role]
    speed, priority, confidence, signatures = profile
    values = [
        clip(rng.gauss(speed, 0.08)),
        clip(rng.gauss(priority, 0.09)),
        clip(rng.gauss(confidence, 0.10)),
        *[clip(rng.gauss(value, 0.08)) for value in signatures],
        1.0 if rng.random() > 0.5 else 0.0,
        1.0 if rng.random() > 0.45 else 0.0,
        1.0,
    ]
    return values


def softmax(logits: list[float]) -> list[float]:
    peak = max(logits)
    values = [__import__("math").exp(value - peak) for value in logits]
    total = sum(values)
    return [value / total for value in values]


def train() -> dict:
    rng = random.Random(26247)
    samples = []
    for class_index, role in enumerate(CLASSES):
        for _ in range(260):
            samples.append((make_sample(role, rng), class_index))
    weights = [[rng.uniform(-0.05, 0.05) for _ in FEATURE_NAMES] for _ in CLASSES]
    learning_rate = 0.08
    for _ in range(2600):
        rng.shuffle(samples)
        for vector, target in samples:
            logits = [sum(weight * value for weight, value in zip(row, vector)) for row in weights]
            probabilities = softmax(logits)
            for class_index, row in enumerate(weights):
                error = probabilities[class_index] - (1.0 if class_index == target else 0.0)
                for feature_index, value in enumerate(vector):
                    row[feature_index] -= learning_rate * error * value / len(samples)
    return {
        "name": "aeris-softmax-v1",
        "classes": CLASSES,
        "features": FEATURE_NAMES,
        "weights": weights,
        "training": {
            "samples": len(samples),
            "epochs": 2600,
            "seed": 26247,
            "purpose": "synthetic non-operational threat-role classification cue",
        },
    }


if __name__ == "__main__":
    output = ROOT / "data" / "threat_role_model.json"
    output.write_text(json.dumps(train(), indent=2) + "\n", encoding="utf-8")
    print(f"wrote {output}")
