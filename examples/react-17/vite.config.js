import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Matches `hostSafeList` in src/App.jsx.
    port: 3000,
  },
  build: {
    outDir: 'build',
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.js'],
  },
});
