# 🦊 Mitra v1.0.0 - The Behavior Chain Update

We are incredibly excited to launch Mitra v1.0! The biggest feedback we received was that Mitra's reminders felt a little abrupt. 

Today, we're introducing **Behavior Chains**. Now, before Mitra reminds you to drink water or stretch, she will anticipate the action naturally. You'll see her look around, stretch, or yawn—behaving exactly like a real companion about to tell you something! And if you start typing, she'll politely hold her thought.

### 🎉 What's New?

- **🧠 Behavior Chains**: A completely new architecture for how Mitra expresses herself. Expect smooth, lifelike transitions before any dialogue bubble appears.
- **✨ Natural Anticipation**: Unique, randomly selected anticipation sequences for Water, Stretch, Eyes, and Lunch reminders.
- **🤫 Polite Cancellations**: If you become active (start typing or moving your mouse) while Mitra is winding up for a reminder, she will gracefully cancel it so she doesn't interrupt your flow.
- **🎵 Perfectly Timed Audio**: The signature alert sound now plays exactly when the speech bubble appears, perfectly syncing with the visual cue.

---

# 🦊 Mitra v0.2.0 - The Companion Update (Product Hunt Launch)

We are thrilled to announce Mitra v0.2.0! This release marks our **official launch on Product Hunt**. We've made Mitra smarter, more context-aware, and even better at being your silent desktop companion. 

### 🎉 What's New?

- **🎵 Music Vibes (Windows)**: Mitra now listens to your music! We've integrated Windows Global System Media Transport Controls (`win-gsmtc`), so she knows what you're listening to and will vibe with you.
- **🤫 Meeting Privacy**: She now intelligently detects when you're in a meeting (Zoom, Teams, Discord, etc.) to give you the privacy you need. No unexpected distractions.
- **💻 Coding Buddy**: Mitra detects when you have VS Code or JetBrains IDEs open and quietly cheers you on while you crush those bugs!

### 🛠️ Under the Hood Fixes
- **🌤️ Privacy-First Weather**: Mitra now fetches local weather based on IP instead of native location tracking, requiring zero OS permissions.
- **🛡️ Production Security**: Fixed a critical Content Security Policy (CSP) issue that was blocking weather fetches in production builds.
- Fixed an issue with the Tauri tray menu method causing build failures.
- Resolved Rust compilation errors by upgrading to the latest `gsmtc` crate API.
- Fixed missing lifetime specifiers for `sysinfo` state management, ensuring stable and reliable performance.

Thank you to everyone who supported us on this journey! Go download the latest release and give Mitra a high-five! ❤️
