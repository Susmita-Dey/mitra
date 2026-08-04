# 🦊 Mitra v1.1.0 - The Spotlight & Stability Update

We are incredibly proud to present **Mitra v1.1.0**! 

This release brings a highly-requested power-user feature—the Universal Command Palette—alongside the deepest performance and stability audit we've ever done. Mitra has never been smoother, faster, or safer.

---

## 🔍 The Spotlight Command Palette

Press **`Ctrl + K`** (or `/` when focused) to instantly summon Mitra's new Command Bar.
* **Universal Actions:** Type what you want to do. Need to drink water? Type `water` and select `💧 Drink Water`.
* **Custom Reminders:** Schedule anything using natural language (e.g. *"medicine in 30 minutes"*, *"coffee every 45m"*, or *"lunch at 1:30 PM"*). Live parsing previews show up as you type.
* **Smart History:** Use the `Up` and `Down` arrow keys to cycle through your recently used commands.
* **Fuzzy Clash Detection:** Mitra actively prevents you from creating custom reminders that accidentally clash with her built-in routines, keeping your schedule clean.

## ↩️ Gmail-style Undo

Made a mistake? Every time you schedule a reminder or complete a task, Mitra now shows a stateful Toast notification with a **3-second undo buffer**. Complete with a happy chirp and a smiling face, you're always in control.

## 🔍 Settings Search & Organization

The Settings page now features a dynamic search bar. Just type what you're looking for (like "audio" or "privacy") and the panel will instantly filter down to the exact section you need.

---

## 🛠️ The Deep Performance & Stability Pass

We paused feature development to completely audit the backend and frontend. The result is the most stable version of Mitra ever released:

### 🔕 No More Flashing Consoles
Fixed a critical bug where Mitra would occasionally flash a black Windows Terminal on the screen. We completely disabled the Git commit watcher in production builds and added `CREATE_NO_WINDOW` flags to ensure zero rogue background processes are spawned.

### ⚡ Buttery Smooth Rendering (Zero Lag)
We discovered the animation engine was triggering up to 8 unnecessary React re-renders *every single second*. We replaced this with an atomic `batchUpdate()` architecture. Mitra now renders at most 1 time per tick, eliminating CPU spikes and typing lag across the entire app.

### 👻 Transparent Window Fixes
Fixed the dreaded "black box" flickering on Windows. All `hide()` and `show()` window commands are now guarded with strict visibility checks. We also properly clear click-through states before hiding to prevent the WebView2 compositor from repainting black rectangles on your desktop.

### 🔒 Serialized IPC Queue
All Tauri window movement and state operations (like dodging your mouse or hiding during a meeting) are now funneled through a strict serial promise queue. This completely eliminates the "Not Responding" hangs caused when the UI thread was overwhelmed by competing commands.

### 🚫 Zero IPC Noise
Rewrote the Context Engine to read meeting state synchronously from the scheduler, dropping duplicate 10-second IPC polling intervals and loose async promises. Mitra is now dead silent on your system buses until she needs to be.

---

## 📦 How to Install

Download the native installer for your system from our Releases page:
* **Windows**: Download the `.msi` or `.exe` installer.
* **macOS**: Download the `.dmg` package and drag Mitra to your Applications.
* **Linux**: Download the `.deb` or `.AppImage` package.

Mitra has a built-in **Auto-Updater** that will securely check for updates and seamlessly install new builds when you approve.

*Thank you for being part of Mitra's journey. Let's make desktop companions delightful, lightweight, and private-by-default!* ❤️
