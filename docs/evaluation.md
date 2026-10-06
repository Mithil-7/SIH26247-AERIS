# AERIS evaluation plan

## Evaluation matrix

| Dimension | Measurement | Comparison |
| --- | --- | --- |
| Detection | Time from track appearance to first deliberate track action | Baseline run vs coached replay |
| Classification | Correct role assignment; confusion matrix by scenario | Ground truth labels |
| Decision quality | Rubric score for sequence, priority and escalation | Instructor-defined policy tree |
| False alarms | Invalid actions against decoy/civilian tracks | Per-run count and rate |
| Learning curve | Score and reaction-time change across repeated seeds | Session 1 → Session N |
| Robustness | Performance under increasing sensor degradation | 0–80% degradation sweep |
| Replayability | Outcome variance across same scenario seed | Same-seed reproducibility |

## Demonstration protocol

1. Run each scenario pack once at default degradation.
2. Repeat with a new seed and a 20-point degradation increase.
3. Compare detection, classification and safe-resolution metrics.
4. Use the AAR timeline to identify the first missed cue and replay the exercise.
5. Report results with the scenario ID, seed, difficulty and ground-truth version.

## Success criteria for the prototype

- A reviewer can start a run without specialised hardware or external APIs.
- Every track has a visible ground-truth record for post-run scoring.
- The same seed produces the same initial scenario state.
- Every operator action appears in the timeline with a timestamp and result.
- The AAR explains score changes instead of exposing only a single opaque number.
