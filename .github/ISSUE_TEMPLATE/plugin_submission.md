---
name: 🔌 Plugin Submission
about: Submit a new plugin for Mitra's plugin ecosystem
title: "[Plugin] "
labels: plugin
assignees: ''
---

## Plugin Details

| Field | Value |
|-------|-------|
| Plugin ID | <!-- e.g. com.yourname.myplugin --> |
| Plugin Name | |
| Version | |
| Permissions Requested | <!-- e.g. events, behaviors --> |
| License | |

## What does this plugin do?

<!-- Describe the plugin's purpose. What events does it listen to? What intents does it emit? How does it make Mitra more useful? -->

## Security Self-Review

Please confirm all of the following before submitting:

- [ ] Does NOT use `eval()`, `new Function()`, or `Function()`
- [ ] Does NOT access `document.querySelector`, `innerHTML`, or DOM directly
- [ ] Does NOT create `<script>` tags or load external scripts
- [ ] Does NOT use `setTimeout` or `setInterval` (uses `api.scheduler` instead)
- [ ] Does NOT access `window.__mitra` or internal engine state
- [ ] Makes network requests only with `integrations` permission declared in manifest
- [ ] Permissions in manifest match actual usage

## Intents Emitted

<!-- List every Intent your plugin emits, and why -->

| Intent type | Trigger condition |
|-------------|------------------|
| | |

## Events Subscribed To

<!-- List every system event your plugin subscribes to -->

| Event | Purpose |
|-------|---------|
| | |

## Testing Notes

<!-- How did you test this? Edge cases? Failure modes? -->

## Additional Notes

<!-- Anything else reviewers should know -->
