import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
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