# AERIS architecture

## Design goal

AERIS turns a difficult-to-repeat live exercise into a measurable training loop: **scenario → degraded feeds → operator decisions → transparent score → after-action review → replay**.

## Runtime components

1. **Scenario & terrain engine**
   - Loads a seed-controlled exercise pack.
   - Supports day/night, urban/rural/perimeter context and single or swarm tracks.
   - Uses ground-truth tracks that are never exposed to the trainee during a run.

2. **Threat behaviour engine**
   - Assigns each track a role, priority, signature and movement profile.
   - Supports scripted paths for repeatability and procedural variation for anti-rote training.

3. **Sensor degradation layer**
   - Injects dropout, delay, noise and confidence loss into the trainee feed.
   - Keeps ground truth available to the instructor and scoring engine.

4. **Local AI assistance**
   - A small four-class softmax model converts telemetry features into an explainable role cue: scout, decoy, cargo or unknown.
   - The cue is advisory. The trainee remains responsible for the final classification, and the AAR records acceptance or override.
   - The current model is trained on deterministic synthetic, non-operational tracks and can later be replaced by a richer sensor-fusion model.

5. **Operator console**
   - Radar/telemetry view, selected-track details and a small action rail.
   - The interface is intentionally readable in a desktop-only deployment and can become a VR panel later.

6. **Scoring and AAR**
   - Measures time to first detection, role classification, prioritisation, escalation and resolution.
   - Preserves an event timeline so instructors can explain *why* a decision was scored.

7. **Replay and analytics contract**
   - A session stores scenario ID/seed, difficulty, degradation, ground truth, actions and score.
   - This contract enables unit-level comparisons without requiring a cloud service.

## Scale-up path

The browser prototype uses Canvas, local JSON and a Python standard-library server. A production build can move the renderer to Unity/OpenXR or a native desktop shell; use ONNX/ML-Agents for adaptive behaviour; add a FastAPI scenario service; and persist sessions in a local or on-premise analytics store. The simulation contract remains portable across those layers.

## Responsible prototype boundary

The included scenario packs are synthetic and non-operational. They exist to validate interface, repeatability, scoring and after-action review—not to model real-world engagement procedures.
