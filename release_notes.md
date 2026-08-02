# 🦊 Mitra v1.0.0 - The Official Final Release

We are incredibly proud to present the **Official Final Release of Mitra v1.0.0**! 

Mitra has evolved from a simple reminder tool into a truly responsive, zero-telemetry desktop companion. This release consolidates all of our major features, architectural improvements, and bug fixes into a single, polished build that is ready for millions of users worldwide.

---

## 🧠 Core Features & Highlights

### ✨ Behavior Chains & Natural Anticipation
Mitra doesn't interrupt you with abrupt notifications. With our new **Behavior Chains** architecture:
* Before reminding you to stretch, rest your eyes, or drink water, Mitra will anticipate the action naturally (e.g. yawning, looking around, or stretching).
* **Polite Interruption Handling**: If you start active keyboard or mouse inputs while Mitra is preparing a reminder, she will cancel the animation and hold her thought to keep you in your flow.
* Reminders are coupled with perfectly synchronized audio cues and custom visual speech bubbles.

### 🎒 Dynamic Props & Costumes
Mitra holds and interacts with virtual props depending on your environment, actions, and settings:
* **Meal Times**: Holds a stalk of bamboo (food) during Lunch, Snack, and Dinner times.
* **Coding Buddy**: Opens up a tiny laptop with glowing code lines when you are working in VS Code or JetBrains IDEs.
* **Weather Reactions**: Holds a blue umbrella when it's raining, or rests on a yellow beach towel with sunglasses when it's sunny.
* **Self-Care**: Holds a blue coffee/tea mug to prompt you to drink water.
* **Celebrations**: Wears a blue party hat and holds a pink birthday cake with lit candles.

### 🤫 Smart Context Awareness & Privacy
Mitra is built to work offline and respect your boundary:
* **Meeting Privacy**: Automatically detects active calls (Zoom, Teams, Discord, Webex, Slack, etc.) and keeps Mitra silent.
* **Vibe to Music**: Listens along with your media controls (Windows-only via `win-gsmtc`) to sway and enjoy your music with you.
* **Local Weather**: Fetches weather based on public IP, requiring zero invasive native OS location permissions.

---

## 🛠️ Production Readiness & Stability Fixes

This final release includes critical patches addressing memory, performance, and cross-platform readiness:

1. **Zero Event Leaks (P0/P1)**: Swapped out anonymous event listeners in `App.tsx` and `SettingsPage.tsx` with static, memoized handlers. Fully cleaned up all window moved event listeners, weather intervals, battery event hooks, and plugin instances on unmount.
2. **Cross-Platform Compatibility**: Rewrote backend process matching in Rust to be fully platform-agnostic, stripping `.exe` and platform-specific suffixes so context detection functions perfectly on Windows, macOS, and Linux.
3. **Production Capability Permissions**: Added missing window management and update capabilities (`allow-set-ignore-cursor-events`, `allow-set-position`, `allow-set-size`, `allow-set-always-on-top`, `allow-minimize`, `allow-unminimize`) to prevent crashes in production.
4. **Preserved Birth Year & Age Wishes**: Fixed the date picker to save and display the user's birth year, enabling Mitra to calculate your exact age and wish you a customized birthday (e.g. *"HAPPY 23rd BIRTHDAY, Susmita!!"*).
5. **Fixed Food Prop Rotations & Layering**: Swapped inverted arm angles for the food prop so Mitra holds the bamboo stalk centrally, and moved the SVG rendering order so the prop is not hidden behind her head.

---

## 📦 How to Install

Download the native installer for your system:
* **Windows**: Download the `.msi` or `.exe` installer.
* **macOS**: Download the `.dmg` package and drag Mitra to your Applications.
* **Linux**: Download the `.deb` or `.AppImage` package.

Mitra has a built-in **Auto-Updater** that will securely check for updates and seamlessly install new builds when you approve.

*Thank you for being part of Mitra's journey. Let's make desktop companions delightful, lightweight, and private-by-default!* ❤️
