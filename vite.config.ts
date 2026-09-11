import path from "path";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler"]],
      },
    }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  base: process.env.TAURI_ENV_PLATFORM ? "/" : "/snippit/",
  server: {
    host: "127.0.0.1",
    port: 4034,
    strictPort: true,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
});
