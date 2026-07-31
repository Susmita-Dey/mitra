import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { exec } from "node:child_process";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

const gitHashPlugin = () => {
  return {
    name: 'git-hash',
    configureServer(server: any) {
      server.middlewares.use('/api/git-hash', (req: any, res: any) => {
        exec('git rev-parse HEAD', (err, stdout) => {
          res.setHeader('Content-Type', 'application/json');
          if (err) {
            res.end(JSON.stringify({ hash: null }));
          } else {
            res.end(JSON.stringify({ hash: stdout.trim() }));
          }
        });
      });
    }
  };
};

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [react(), gitHashPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
}));
