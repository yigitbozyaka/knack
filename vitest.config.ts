import path from 'node:path'

import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
    exclude: ['**/node_modules/**', '**/.next/**', '**/dist/**', '**/.claude/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['lib/**/*.ts'],
      exclude: ['lib/**/__tests__/**', 'lib/**/*.test.ts'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
