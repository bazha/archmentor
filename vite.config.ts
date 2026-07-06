import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/archmentor/' : '/',
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: {
    // The `content` chunk holds all concept/question data in BOTH languages
    // (~520 kB raw, ~120 kB gzip), which legitimately exceeds Vite's 500 kB
    // default. It is a data chunk loaded once and cached, not executable weight.
    // Revisit in Phase B (real EN translations): consider lazy-loading only the
    // active language's prose instead of shipping both.
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
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
