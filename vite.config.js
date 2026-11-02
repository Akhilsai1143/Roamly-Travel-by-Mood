import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Explicit absolute base path ensures CSS, JS, and image assets load reliably from any nested route
  base: "/",
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-lucide": ["lucide-react"],
          "vendor-network": ["axios", "socket.io-client"],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
