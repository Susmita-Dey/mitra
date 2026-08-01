# Contributing

Welcome to Mitra ❤️

Before contributing, remember one thing: **Mitra is a companion.** Not a productivity tool. Every contribution should make Mitra feel more alive.

## Engineering Principles

- Interruptions are bugs.
- Everything works offline.
- Privacy first.
- Keep it simple.
- Delight over complexity.

---

## 🛠️ Developer Setup

Mitra uses a highly optimized tech stack: **Tauri v2** (Rust) for the lightweight desktop windowing, and **React + TypeScript + Vite** for the frontend. Her animations are NOT pre-rendered video files; they are driven by a custom mathematical Spring Physics engine running at 60fps!

### Prerequisites

1. Install [Rust](https://www.rust-lang.org/tools/install)
2. Install [Bun](https://bun.sh/) (or Node.js/npm)
3. Ensure you have the OS-specific build tools for Tauri installed (e.g. Visual Studio C++ Build Tools on Windows, Xcode on macOS).

### Running Locally

```bash
# 1. Clone the repository
git clone https://github.com/your-username/mitra.git
cd mitra

# 2. Install frontend dependencies
bun install

# 3. Start the development server
bunx tauri dev
```

### Architecture Overview

- `src-tauri/` - The Rust backend. Manages the transparent window, system tray, and cross-platform compilation.
- `src/brain/` - The logic center. Controls her memories, behaviors, state machine, and scheduling.
- `src/body/` - The renderer and physics. `useAnimationRig.ts` manages the mathematical spring physics, which drives the SVG elements in `MockRenderer.tsx`.
- `src/system/` - Platform services: scheduler, event bus, weather, notifications, window controller.
- `src/plugin/` - The compiled plugin SDK and bundled example plugins.

---

## 🔌 Building a Plugin

Mitra has a **compiled, sandboxed plugin system** that lets you extend her behavior without touching her internals.

Plugins:
- Are written in **TypeScript** and compiled with the project (no `eval`, no dynamic loading)
- Emit **semantic Intents** — they never render or animate directly
- Use the **SDK Scheduler** instead of `setTimeout`/`setInterval`
- Declare a **Manifest** with exactly the permissions they need

**→ Read the full guide: [PLUGIN_CONTRIBUTING.md](./PLUGIN_CONTRIBUTING.md)**

To submit a plugin, open a **Plugin Submission** issue using the issue template.

---

## 📋 Submitting Changes

1. Fork the repository and create a feature branch.
2. Make your changes. Run `bunx tsc --noEmit` and `bun run build` to verify nothing is broken.
3. Open a Pull Request using the PR template. Screenshots or recordings of visual changes are required.
4. CI will automatically run TypeScript checks, plugin security scans, dependency audits, and a Rust Clippy lint.

---

Thank you for helping build Mitra!