// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
  },
  define: {
    'import.meta.env.PUBLIC_SANITY_PROJECT_ID': JSON.stringify('test-project'),
    'import.meta.env.PUBLIC_SANITY_DATASET': JSON.stringify('production'),
  },
})
