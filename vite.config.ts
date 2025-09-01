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
  /**
   * Dev proxy to work around CORS on remote n8n webhooks.
   * In development set VITE_N8N_BASE_URL=/n8n (see .env.development) so that
   * frontend fetches /n8n/webhook/<id>. Vite proxies that request server-side
   * to the real n8n host so the browser never hits the cross-origin endpoint.
   */
  server: {
    proxy: {
      "/n8n": {
        target: "https://n8n.srv856940.hstgr.cloud",
        changeOrigin: true,
        // Keep path after /n8n
        rewrite: (path) => path.replace(/^\/n8n/, ""),
        // If the host has a self-signed cert in staging you could set secure:false
        // secure: false,
        headers: {
          // Optional: forward a header so n8n can distinguish proxied dev traffic
          "X-Dev-Proxy": "vite",
        },
      },
    },
  },
});
