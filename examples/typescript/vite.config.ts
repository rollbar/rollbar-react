import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  build: {
    outDir: 'build',
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    alias: [
      // Load @rollbar/react's ESM build, as `vite build` does. Otherwise Node
      // loads its CommonJS build, which gets rollbar 3's `require` entry point
      // while this app gets its `import` one -- two different Rollbar classes,
      // so spying on Rollbar.prototype would miss the Provider's instance.
      {
        find: /^@rollbar\/react$/,
        replacement: '@rollbar/react/dist/index.js',
      },
    ],
  },
});
