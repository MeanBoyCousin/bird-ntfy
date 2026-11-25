import fetchMock, { manageFetchMockGlobally } from '@fetch-mock/vitest'
import { vi } from 'vitest'

fetchMock.mockGlobal()
manageFetchMockGlobally()

export const mockRedisClient = {
    on: vi.fn().mockReturnThis(),
    connect: vi.fn().mockResolvedValue(undefined),
    set: vi.fn().mockResolvedValue('OK'),
    get: vi.fn().mockResolvedValue(null),
    exists: vi.fn().mockResolvedValue(0),
    destroy: vi.fn().mockReturnValue(undefined)
}

vi.mock('redis', () => ({
    createClient: vi.fn(() => mockRedisClient)
}))

beforeEach(() => {
    vi.clearAllMocks()
    fetchMock.removeRoutes()
    fetchMock.clearHistory()
})
