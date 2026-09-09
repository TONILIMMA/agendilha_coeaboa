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
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    include: ['src/**/*.test.{ts,tsx}'],
  },
   plugins: [
     react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: null,
      includeAssets: ['favicon.png', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'logo.png', 'logo.jpg', 'robots.txt', 'placeholder.svg'],
      workbox: {
        // Don't precache HTML — always fetch fresh navigations so mobile clients
        // see new builds immediately instead of being stuck on an old shell.
        globPatterns: ['**/*.{js,css,ico,png,svg,jpg,jpeg,webp}'],
        cleanupOutdatedCaches: true,
        // Prompt mode: don't auto-skip — wait for the user to click "Atualizar".
        clientsClaim: false,
        skipWaiting: false,
        navigateFallback: null,
        navigateFallbackDenylist: [/^\/~oauth/, /^\/api\//],
        runtimeCaching: [
          {
            // HTML navigations: always try network first, fall back to cache only when offline.
            urlPattern: ({ request, url }) =>
              request.mode === 'navigate' && !url.pathname.startsWith('/~oauth'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'html-navigations',
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // <== 365 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // <== 365 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://xwuyzqahfoyhdbmtspwf.supabase.co',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
              networkTimeoutSeconds: 5,
            },
          },
        ],
      },
      manifest: {
        name: 'Coé a Boa?',
        short_name: 'Coé a Boa',
        description: 'Encontre e divulgue eventos, artistas e lugares perto de você.',
        theme_color: '#000000',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ],
        display: 'standalone',
        background_color: '#000000',
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
  build: {
    chunkSizeWarningLimit: 800,
    reportCompressedSize: false, // Otimiza build
    cssCodeSplit: true,
    minify: 'terser', // Melhor minificação
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: mode === 'production',
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'react-core': ['react', 'react-dom'],
          'router': ['react-router-dom'],
          'ui-primitives': ['@radix-ui/react-dialog', '@radix-ui/react-select', '@radix-ui/react-popover', '@radix-ui/react-dropdown-menu'],
          'animation': ['framer-motion'],
          'db-client': ['@supabase/supabase-js', '@tanstack/react-query'],
          'pdf-gen': ['jspdf', 'jspdf-autotable'],
          'icons': ['lucide-react'],
          'utils': ['date-fns', 'zod', 'react-hook-form'],
          'charts': ['recharts'],
        },
      },
    },
  },
}));