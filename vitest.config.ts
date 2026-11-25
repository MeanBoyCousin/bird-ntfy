import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        env: {
            TZ: 'UTC'
        },
        coverage: {
            exclude: ['tests/fixtures.ts']
        },
        globals: true,
        setupFiles: ['./vitest.setup.ts']
    }
})
