import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    // Use Lightning CSS to minify CSS in builds
    cssMinify: "lightningcss",
  },
  optimizeDeps: {
    exclude: ["lucide-react"],
  },
  server: {},
});
