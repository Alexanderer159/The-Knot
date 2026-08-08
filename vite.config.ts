import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: {
    enabled: true // <-- ADD THIS LINE
  },
      manifest: {
        name: "The Knot",
        short_name: "The Knot",
        description: "Survival coordination for your group",
        theme_color: "#000000",
        background_color: "#000000",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "/icon-192-v2.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/icon-192-v2.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
          { src: "/icon-512-v2.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/icon-512-v2.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
        shortcuts: [
      {
        name: "I'm OK",
        short_name: "OK",
        description: "Quickly report you're okay",
        url: "/?quickstatus=ok",
        icons: [{ src: "/icon-192-v2.png", sizes: "192x192" }],
      },
      {
        name: "Need Help",
        short_name: "Help",
        description: "Quickly signal you need help",
        url: "/?quickstatus=help",
        icons: [{ src: "/icon-192-v2.png", sizes: "192x192" }],
      },
      {
        name: "Critical",
        short_name: "Critical",
        description: "Quickly signal a critical emergency",
        url: "/?quickstatus=critical",
        icons: [{ src: "/icon-192-v2.png", sizes: "192x192" }],
      },
    ],
  screenshots: [
    {
      src: "/icon-512-v2.png",
      sizes: "512x512",
      type: "image/png",
      form_factor: "wide",
      label: "Desktop Screenshot"
    },
    {
      src: "/icon-512-v2.png",
      sizes: "512x512",
      type: "image/png",
      form_factor: "narrow",
      label: "Mobile Screenshot"
    }
  ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/[a-z]\.tile\.openstreetmap\.org\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "map-tiles",
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));