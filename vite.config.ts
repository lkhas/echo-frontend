import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";



// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
 server: {
  host: "::",
  port: 8080,
  hmr: {
    overlay: false,
  },      include: ['docx'],
  proxy: {
    "/api": {
      target: "http://127.0.0.1:8000",
      changeOrigin: true,
      secure: false,
    },

  },
},

  plugins: [
    react(),

    // Lovable dev-only component tagging
    mode === "development" && componentTagger(),

    // PWA integration
    VitePWA({
      registerType: "autoUpdate",
      devOptions: {
        enabled: true,
      },
      manifest: {
        name: "ECHO",
        short_name: "ECHO",
        description: "Community problem reporting app",
        theme_color: "#0f172a",
        background_color: "#0f172a",
        display: "standalone",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ].filter(Boolean),

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  
}));
