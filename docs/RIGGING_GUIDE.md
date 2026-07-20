# Mitra Rigging Guide

This guide defines the skeletal structure, naming conventions, and hierarchy required for any 2D character rigged for the Mitra Companion Engine, specifically targeting Rive.

## 1. Core Hierarchy

Every character must adhere to this exact bone/group naming structure. The engine (and state machine) relies on these names to apply IK targets and blend states correctly.

```text
root
 ├── shadow_anchor
 ├── body_ctrl
 │    ├── body
 │    ├── tail_root
 │    │    └── tail_mid
 │    │         └── tail_tip
 │    ├── leg_l
 │    └── leg_r
 └── spine_ctrl
      ├── chest
      │    ├── arm_l
      │    └── arm_r
      └── head_ctrl
           ├── head_base
           ├── ear_l
           ├── ear_r
           ├── face_mask
           │    ├── eye_l
           │    ├── eye_r
           │    └── nose_mouth
```

## 2. Rigging Rules

### Independent Head Control
The `head_ctrl` must be completely independent of the `body_ctrl` in terms of rotation. When the body breathes (scales/squashes), the head should translate vertically but **must not distort or scale**. 

### The Face Mask
All facial features (`eye_l`, `eye_r`, `nose_mouth`) must be grouped under a single `face_mask` node. This allows the engine to apply a slight parallax translation to the entire face to simulate 3D rotation (e.g., looking left/right) without moving the ears or back of the head.

### Tail Physics
The tail requires at least three joints (`root`, `mid`, `tip`). Do not animate the tail using frame-by-frame path deformation. Use standard skeletal rotation to allow for programmatic procedural swaying if needed.

### Eye Hierarchy
Eyes are the most complex rigged element. The `eye_l` and `eye_r` nodes must each contain:
- `lid_top` (For blinking)
- `lid_bottom` (For squinting/smiling)
- `iris`
- `pupil`
- `highlight` (The specular dot—must remain absolute and never distort)

## 3. Pivot Points

- **`root`**: Exactly between the feet on the ground plane.
- **`head_ctrl`**: At the neck joint (base of the skull), not the center of the head.
- **`ears`**: At the very bottom edge where they meet the head.
- **`arms/legs`**: At the shoulder/hip joint.

## 4. Constraints (Rive Specific)

Do not bake inverse kinematics (IK) into the animation timelines. Set up standard IK constraints for the legs and arms so that if we programmatically move the `root` downward (e.g., for a squash animation), the feet stay planted on the `shadow_anchor`.
