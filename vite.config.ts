import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // На GitHub Pages приложение живёт по пути /<repo>/, локально — по корню.
  base: command === "build" ? "/Gallery-for-Iphone/" : "/",
  server: {
    host: true, // доступ с телефона по локальной сети для теста на реальном iPhone
    port: 5173,
  },
}));
