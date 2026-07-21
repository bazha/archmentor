import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/archmentor/' : '/',
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: {
    // Raised above Vite's 500 kB default: the per-language prose chunks and the
    // lazy Mermaid/Cytoscape vendor chunks are legitimately large data/vendor
    // payloads, loaded on demand and cached — not eager executable weight.
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          // Per-language prose packs are dynamically imported (see content/registry.ts) —
          // leave them unassigned so Rollup emits a separate chunk per locale, and only
          // the active language loads at startup (the other is idle-prefetched).
          if (id.includes('/src/content/locales/')) return;
          // Language-independent core (concepts/questions skeleton + registry) is small
          // and eager — keep it in one cached chunk.
          if (id.includes('/src/content/')) return 'content';
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    css: { include: [/index\.css/] },
  },
} as any));
