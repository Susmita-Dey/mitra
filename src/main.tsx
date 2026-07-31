import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "@/app";
import { SettingsPage } from "@/app/SettingsPage";

const params = new URLSearchParams(window.location.search);
const isSettings = params.get("page") === "settings";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    {isSettings ? <SettingsPage /> : <App />}
  </React.StrictMode>,
);
