# Plugin API

> Internal technical specification for `src/plugin`.

---

## Overview

The Plugin API provides a safe, strictly controlled boundary for third-party extensions. It allows plugins to extend Mitra's capabilities (behaviors, reminders, widgets, commands) without ever exposing the internal engine state.

This architecture ensures plugins cannot crash the core companion engine, read private OS signals they haven't explicitly requested, or bypass the `Brain`'s decision-making.

## Lifecycle Hooks

Plugins are objects implementing `MitraPlugin`. The `PluginManager` drives their lifecycle:

- `onInstall()`: Run once upon initial installation (e.g., setting up local files).
- `onInitialize(api)`: Called on boot. The plugin receives the `PluginAPI` facade here.
- `onEnable()`: Called when the user activates the plugin.
- `onDisable()`: Clean up resources (e.g., stop intervals).
- `onDestroy()`: Called before uninstallation.

## The Sandbox (`PluginAPI`)

Plugins interact with the engine exclusively through `PluginAPI`:

```typescript
export interface PluginAPI {
  onEvent(event, handler);
  registerBehavior(behavior);
  registerCommand(command);
  registerWidget(widget);
  registerReminder(reminder);
}
```

### Strict Permissions

Plugins must declare their required permissions in their `PluginManifest`. The `PluginManager` intercepts every API call and validates the permission. 

Example permissions: `"behaviors"`, `"reminders"`, `"widgets"`, `"commands"`, `"filesystem"`, `"notifications"`.

If a plugin calls `api.registerBehavior()` but lacks the `"behaviors"` permission, the Manager throws an error and rejects the registration.

### Behavior Context Wrapping

When a plugin registers a behavior, it uses a `PluginBehavior` which receives a `PluginBehaviorContext`. 
This is a wrapper around the internal `BehaviorContext` that explicitly strips out unsafe access.

- **Allowed**: `requestMovement()`, `requestEmotion()`, `getEnvironment()`, `getCharacterState()`
- **Forbidden**: Direct state mutations, raw internal stores.

This forces all plugin actions to flow as "requests" to the `Brain` and `EmotionEngine`, maintaining the core companion philosophy.
