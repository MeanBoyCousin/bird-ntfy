import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        coverage: {
            exclude: ['tests/fixtures.ts']
        },
        setupFiles: ['./vitest.setup.ts'],
        globals: true
    }
})
