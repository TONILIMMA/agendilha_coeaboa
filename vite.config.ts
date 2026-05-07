import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";
import { componentTagger } from "lovable-tagger";

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
       registerType: 'autoUpdate',
       includeAssets: ['favicon.ico', 'logo.png', 'logo.jpg'],
       manifest: {
         name: 'AgendIlha',
         short_name: 'AgendIlha',
         description: 'A agenda cultural curada da Ilha do Governador',
         theme_color: '#ea580c',
         icons: [
           {
             src: 'logo.png',
             sizes: '512x512',
             type: 'image/png',
             purpose: 'any maskable'
           }
         ],
         display: 'standalone',
         background_color: '#ffffff',
         start_url: '/'
       },
       devOptions: {
         enabled: false
       }
     }),
     mode === "development" && componentTagger()
   ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
}));
