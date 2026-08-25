import swc from 'unplugin-swc'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    root: './',
  },
  resolve: {
    // Required so @/ and @test/ (from tsconfig paths) resolve in test files.
    tsconfigPaths: true,
  },
  plugins: [
    swc.vite({
      module: { type: 'es6' },
    }),
  ],
})
