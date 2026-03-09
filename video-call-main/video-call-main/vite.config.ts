import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  optimizeDeps: {
    exclude: [
      "@mui/material",
      "@mui/icons-material",
    ],
  },

  server: {
    watch: {
      usePolling: true, // Windows fix
    },
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
