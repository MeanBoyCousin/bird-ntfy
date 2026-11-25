import { readFileSync } from 'node:fs'

import { getVersion, shutdown } from '../utils/sys'
import { mockRedisClient } from '../vitest.setup'

vi.spyOn(process, 'exit').mockImplementation(code => {
    return code as never
})

describe('getVersion', () => {
    it('should return a valid version string', () => {
        const packageFile = JSON.parse(readFileSync('./package.json', 'utf8'))

        expect(getVersion()).toMatch(`v${packageFile.version}`)
    })
})

describe('shutdown', () => {
    it('should allow safe exit', () => {
        shutdown()

        expect(mockRedisClient.destroy).toHaveBeenCalled()
        expect(vi.mocked(process.exit)).toHaveBeenCalledWith(0)
    })
})
