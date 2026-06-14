import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['test/**/*.test.js'],
    coverage: {
      provider: 'v8',
      include: ['main.js'],
      reporter: ['text', 'html']
    }
  }
});
