# Mitra Animation Specification

This document defines the exact contract between the `CompanionEngine` state and the Rive State Machine. 

## 1. Rive State Machine Contract

The canonical Rive file (`mitra_main.riv`) must contain a single State Machine named **`Mitra_Behavior`**.

### Inputs

The Rive State Machine must expose the following inputs exactly as named. The `SVGRenderer` and `RiveRenderer` integration layers will pass data to these inputs.

| Input Name | Type | Maps To (Engine State) | Description |
|---|---|---|---|
| `state_animation` | Number | `Character.animation` | 0=idle, 1=walk, 2=wave, 3=sleep, 4=sit |
| `state_emotion` | Number | `Character.emotion` | 0=neutral, 1=happy, 2=curious, 3=sleepy, 4=concerned |
| `is_interacting` | Boolean | `Character.interaction` | True if interaction is `hover` or `drag` |
| `trigger_blink` | Trigger | Internal Brain logic | Fires randomly every 3-7s to blink |
| `trigger_poke` | Trigger | `Character.interaction` | Fires on `click` |

## 2. Animation Timelines

You must create these specific base timelines. The state machine will handle blending between them.

### Base Poses (Body)
- `pose_idle`: Slow breathing (3.5s loop), tail drift.
- `pose_sit`: Transition from standing to sitting.
- `pose_sleep`: Tucked body, tail wrapped.

### Expressions (Face)
Expressions must be authored as separate timelines that only keyframe the `face_mask` children (eyes, mouth). They **must not** keyframe the body.
- `exp_neutral`
- `exp_happy`
- `exp_curious`
- `exp_sleepy`
- `exp_concerned`

### Additive Actions
These animations are blended additively over the current base pose.
- `act_blink`: 120ms total duration. 40ms close, 40ms hold, 40ms open.
- `act_ear_flick`: 200ms twitch of one ear.
- `act_head_tilt_l`: 400ms tilt left.
- `act_head_tilt_r`: 400ms tilt right.

## 3. Transition Blending Rules

The engine relies on Rive's state machine for smooth interpolation. Do not author transition timelines (e.g., `idle_to_sit`). Instead, configure the transitions in the State Machine:

- **Emotion transitions:** 500ms duration, cubic-bezier easing.
- **Base pose transitions:** 800ms duration, cubic-bezier easing.
- **Blink additive:** 0ms transition (instant blend).

If using the SVGRenderer fallback, transitions will be mapped to CSS transitions (`transition: all 0.5s ease-in-out`).
