# Official SIH26247 brief

Source: [Smart India Hackathon 2026 Problem Statements](https://sih.gov.in/sih2026PS) · **SIH26247**

## Metadata

- **Organization:** Ministry of Defence (MoD)
- **Department:** Defence Services Staff College
- **Category:** Software
- **Theme:** Robotics and Drones
- **Title:** AI-Enabled Drone & Counter-Drone Threat Simulation Trainer

## Background

Recent conflicts have shown that low-cost commercial and military-grade drones, employed individually and in swarms, have become a decisive battlefield factor. Existing training relies on classroom instruction and limited live-fire drills, which are costly, weather-dependent and do not scale to give troops adequate repetitions.

## Detailed description

A software-based simulation platform is required to train personnel in recognizing, classifying and responding to drone/swarm threats across varied and realistic scenarios: day/night, degraded sensors, urban/rural terrain, and single-drone and swarm attacks. The tool should be usable at unit level with minimal specialized hardware.

## Expected solution / outcomes

- Desktop or VR-capable simulator with scripted and procedurally generated threat scenarios.
- Decision-tree based scoring on detection time, threat classification accuracy and engagement decisions.
- After-action review (AAR) dashboard tracking individual/unit performance over repeated sessions.
- Difficulty adjustments and scenario randomization to prevent rote learning.

## AERIS response map

| SIH requirement | AERIS implementation |
| --- | --- |
| Varied realistic scenarios | Urban Relay, Night Corridor and Swarm Breakout packs with seed-controlled motion. |
| Degraded sensors | Configurable dropout/noise/confidence layer in the trainer console. |
| AI-enabled training | Local four-class learned role cue with confidence and evidence features. |
| Decision-tree scoring | Track → classify → alert → resolve sequence with transparent score changes. |
| AAR dashboard | Event timeline, score, classification accuracy, detection time and coach cue. |
| Difficulty randomisation | Guided / Standard / Stress levels and seeded replay path. |
| Minimal specialised hardware | Browser-based desktop prototype; optional Unity/OpenXR scale-up path. |

The prototype uses synthetic, non-operational scenarios so that the requested training loop can be demonstrated without external feeds or specialised equipment.
