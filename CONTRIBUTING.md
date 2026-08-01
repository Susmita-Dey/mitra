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

Thank you for helping build Mitra!