import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Use Lightning CSS to minify CSS in builds
    cssMinify: "lightningcss",
  },
  optimizeDeps: {
    exclude: ["lucide-react"],
  },
});
