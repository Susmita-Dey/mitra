# Mitra Art Pipeline & Asset Structure

Welcome to the Mitra art repository. This directory houses the canonical production assets for Mitra's visual identity.

As an open-source companion, Mitra relies on clean, accessible, and scalable art pipelines. This document defines the folder structure and the rules for contributing art assets.

**Before contributing any art, you must read the [Character Bible](../docs/CHARACTER_BIBLE.md).**

---

## Directory Structure

Our pipeline is organized to move from idea to interactive runtime asset. Please place files in their exact corresponding directory.

### `characters/mitra/`
The root directory for all Mitra-specific visual assets.

#### 1. `concept/`
**Purpose:** The graveyard of good ideas and the birthplace of the current design.
**Contains:**
- Approved concept art (the source of truth for the Character Bible)
- Early exploration sketches
- Mood boards and texture tests
*Note: Files here are for historical context and ideation. They are not used in production.*

#### 2. `reference/`
**Purpose:** Quick-reference materials for artists actively working on Mitra.
**Contains:**
- Proportion sheets and turnarounds
- Color palette swatches
- Anatomy breakdown sheets
- Visual guides for specific rules (e.g., "How the tail curves")

#### 3. `svg/`
**Purpose:** The canonical, resolution-independent source files for Mitra's body parts and states. All production art originates here.
**Contains:**
- **`expressions/`**: Individual face and head configurations for every emotion defined in the Character Bible (e.g., `happy.svg`, `sleepy.svg`, `concerned.svg`). 
- **`poses/`**: Base body configurations without facial features (e.g., `sitting.svg`, `standing.svg`, `walking-frame-1.svg`).
*Note: SVGs must be clean, flattened, and optimized. See [Vector Standards](#vector-standards).*

#### 4. `rive/`
**Purpose:** The interactive animation files that bring Mitra to life in the desktop application. We use [Rive](https://rive.app) for its tiny footprint, state machine capabilities, and native Rust/Tauri support.
**Contains:**
- `.rev` source files
- `mitra_main.riv` (The canonical state machine integrating all animations)
- **`animations/`**: Discrete timelines exported or structured for specific actions (e.g., `idle_breathe`, `ear_flick`, `tail_wag`).

---

## Open-Source Asset Standards

To keep the project scalable and maintainable across many contributors, all assets must adhere to the following rules:

### Naming Conventions
- Use `kebab-case` for all files. No spaces, no underscores.
- **Good:** `mitra-sleepy-expression.svg`
- **Bad:** `Mitra_Sleepy_final_v2.svg`
- Append the state or part clearly: `[character]-[part]-[state].ext`

### Vector Standards (SVG)
- **Flatten your paths:** Do not leave strokes unexpanded unless they are specifically designed to be dynamic at runtime.
- **No inline styles:** Use presentation attributes or standard fills.
- **Group logically:** Group layers by anatomical part (`head`, `body`, `left-arm`, `right-arm`, `tail`). This makes it easier to import into Rive.
- **No pure black/white:** As per the Character Bible, use `#2C1508` for the darkest darks and `#FFFFFF` only for the single specular eye highlight.

### Animation Standards (Rive)
- Use the **State Machine** for blending (e.g., blending a `happy` expression timeline onto an `idle_breathe` body timeline).
- Keep node hierarchies clean and named identically to the SVG grouping.
- Name inputs clearly in the Rive state machine (e.g., boolean `is_sleepy`, trigger `poke`).

---

## How to Contribute Art

1. **Check the Roadmap:** Look for open issues labeled `art` or `animation`.
2. **Draft it:** Submit sketches or rough SVGs in a PR *before* finalizing paths and animations.
3. **Review against the Bible:** Does it break any rules in the [Character Bible](../docs/CHARACTER_BIBLE.md)?
4. **Optimize:** Run SVGs through SVGO or a similar optimizer before committing.
5. **Submit:** Open a Pull Request referencing the issue.
