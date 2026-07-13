import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-clerk": ["@clerk/clerk-react"],
          "vendor-charts": ["recharts"],
          "vendor-motion": ["framer-motion", "motion"],
          "vendor-pdf": ["jspdf"],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@clerk/clerk-react",
      "@tanstack/react-query",
      "lucide-react",
      "clsx",
      "tailwind-merge",
      "framer-motion"
    ]
  }
}));
