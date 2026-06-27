import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // доступ с телефона по локальной сети для теста на реальном iPhone
    port: 5173,
  },
});
