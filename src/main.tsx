import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "@/app";
import { SettingsPage } from "@/app/SettingsPage";
import { OnboardingPage } from "@/app/OnboardingPage";

import { TasksPage } from "@/app/TasksPage";

const params = new URLSearchParams(window.location.search);
const page = params.get("page");

// Mark secondary pages on the <html> element so global.css can restore
// normal interaction (user-select, overflow, scroll) for non-companion windows.
// The companion App intentionally gets no attribute (transparent, no-select).
if (page) {
  document.documentElement.dataset.page = page;
}

const app =
  page === "settings"    ? <SettingsPage /> :
  page === "onboarding"  ? <OnboardingPage /> :
  page === "tasks"       ? <TasksPage /> :
  <App />;

// React.StrictMode intentionally double-invokes effects to detect side-effects —
// in production this would mount the entire Brain/EventBus/WindowController system
// TWICE, creating two competing instances that race each other (black windows,
// flickering, Not Responding). StrictMode is kept for development only.
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  import.meta.env.DEV ? <React.StrictMode>{app}</React.StrictMode> : app,
);
