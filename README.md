# AERIS — SIH26247

**Adaptive Evaluation & Response Intelligence Simulator**

> AI-enabled drone and counter-drone threat simulation trainer

Prototype by **Zero Coders** · GitHub: [Mithil-7/SIH26247-AERIS](https://github.com/Mithil-7/SIH26247-AERIS)

## Problem statement

- **Problem statement ID:** SIH26247
- **Title:** AI-Enabled Drone & Counter-Drone Threat Simulation Trainer
- **Organization:** Ministry of Defence (MoD)
- **Department:** Defence Services Staff College
- **Category:** Software
- **Theme:** Robotics and Drones
- **Team ID:** 167564
- **Team name:** Zero Coders

The official SIH brief asks for a software simulator that trains personnel to recognise, classify and respond to single-drone and swarm threats across day/night, urban/rural and degraded-sensor scenarios. It calls for scripted or procedurally generated scenarios, decision-tree scoring, after-action review and difficulty randomisation, with minimal specialised hardware.

## What the prototype demonstrates

- Deterministic scenario packs for urban, night and swarm exercises.
- A browser-based radar/telemetry console that works without external APIs.
- Selectable synthetic threats with role classification and response actions.
- Configurable sensor degradation: dropout, noise and delayed-confidence cues.
- Transparent scoring for detection time, classification, escalation and response safety.
- Live event log and end-of-run after-action review (AAR).
- Keyboard shortcuts for fast training runs: `1` Track, `2` Classify, `3` Alert, `4` Intercept.
- Instructor-friendly reset and scenario selection for repeatable trials.

The scenario data is synthetic and non-operational. It is intended to demonstrate the training, measurement and replay loop requested in the problem statement.

## Run locally

Requires Python 3.10+.

```bash
cd SIH26247-AERIS
python3 server.py
```

Open <http://localhost:8080>.

You can also run the browser shell directly from `web/index.html`; the Python server enables the scenario endpoint and health check.

## Publish the repository

The local repository is already configured with this intended remote:
`https://github.com/Mithil-7/SIH26247-AERIS.git`.

After creating that empty repository while signed in to GitHub, publish this committed project with:

```bash
git push -u origin main
```

## Prototype workflow

1. Choose an exercise pack and difficulty.
2. Start the simulation with a configurable sensor-degradation level.
3. Click a track on the radar or select it from the telemetry list.
4. Track → classify → alert → intercept/resolve the threat using the action rail.
5. Review the score, timeline, missed signals and recommendations in the AAR panel.

## Repository map

```text
SIH26247-AERIS/
├── data/scenarios.json        # Synthetic scenario and threat definitions
├── deck/build.js              # SIH proposal deck generator
├── docs/architecture.md       # System architecture and scale-up path
├── docs/evaluation.md         # Evaluation matrix and measurable outcomes
├── docs/problem-statement.md  # Official SIH26247 brief and response map
├── server.py                  # Dependency-free local server/API
├── web/index.html             # Trainer console shell
├── web/styles.css             # Visual system and responsive layout
└── web/app.js                 # Simulation loop, scoring and AAR
```

## Scale-up path

The dependency-free prototype keeps the training contract explicit. A production build can replace the canvas renderer with Unity/OpenXR or a desktop renderer, add a Python/FastAPI scenario service, use ONNX/ML-Agents for adaptive agents, and persist session telemetry in a local or on-premise analytics store. The scenario seed, ground truth and action log remain the evaluation contract.

## Licence

MIT. See [LICENSE](LICENSE).
