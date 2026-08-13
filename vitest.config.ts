import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Stubs only Clerk's signature check, so handler auth can be exercised.
    setupFiles: ['tests/setup/clerk.ts'],
    testTimeout: 30000,
  },
});
