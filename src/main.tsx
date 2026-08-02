import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "@/app";
import { SettingsPage } from "@/app/SettingsPage";
import { OnboardingPage } from "@/app/OnboardingPage";

import { TasksPage } from "@/app/TasksPage";

const params = new URLSearchParams(window.location.search);
const page = params.get("page");

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    {page === "settings" ? <SettingsPage /> : 
     page === "onboarding" ? <OnboardingPage /> : 
     page === "tasks" ? <TasksPage /> : 
     <App />}
  </React.StrictMode>,
);
