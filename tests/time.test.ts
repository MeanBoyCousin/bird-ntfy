import fetchMock from '@fetch-mock/vitest'

import { HOME_SUNRISE_SUNSET_URL } from '../utils/constants'
import { isDaylightHours } from '../utils/time'
import { mockRedisClient } from '../vitest.setup'
import { mockSunriseSunsetData } from './fixtures'

vi.spyOn(console, 'error').mockImplementation(() => {})
vi.spyOn(process, 'exit').mockImplementation(code => {
    return code as never
})

describe('isDaylightHours', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    it('should return correctly if Redis has cached values and is daylight', async () => {
        vi.setSystemTime(1792584000000)
        mockRedisClient.get
            .mockResolvedValueOnce('2026-06-21T04:02:49+01:00')
            .mockResolvedValueOnce('2026-10-21T18:43:54+01:00')

        expect(await isDaylightHours()).toBeTruthy()
    })

    it('should return correctly if Redis has cached values and is NOT daylight', async () => {
        vi.setSystemTime(1792609200000)
        mockRedisClient.get
            .mockResolvedValueOnce('2026-06-21T04:02:49+01:00')
            .mockResolvedValueOnce('2026-10-21T18:43:54+01:00')

        expect(await isDaylightHours()).toBeFalsy()
    })

    it('should return return false is Redis throws', async () => {
        mockRedisClient.get.mockRejectedValueOnce('error')

        expect(await isDaylightHours()).toBeFalsy()
    })

    it('should return false if fetch fails', async () => {
        fetchMock.getOnce(HOME_SUNRISE_SUNSET_URL, 500)

        expect(await isDaylightHours()).toBeFalsy()
    })

    it('should return false if fetch throws', async () => {
        fetchMock.getOnce(HOME_SUNRISE_SUNSET_URL, {
            throws: new Error('Timed out!')
        })

        expect(await isDaylightHours()).toBeFalsy()
    })

    it('should return correctly if fetch succeeds and is daylight', async () => {
        vi.setSystemTime(1792584000000)
        fetchMock.getOnce(HOME_SUNRISE_SUNSET_URL, mockSunriseSunsetData)

        const res = await isDaylightHours()

        expect(mockRedisClient.set).toHaveBeenCalledWith(
            'time:SUNRISE',
            '2026-10-21T06:12:03+00:00',
            expect.objectContaining({
                expiration: expect.objectContaining({
                    type: 'EXAT',
                    value: 1792623540
                })
            })
        )
        expect(mockRedisClient.set).toHaveBeenCalledWith(
            'time:SUNSET',
            '2026-10-21T18:43:54+00:00',
            expect.objectContaining({
                expiration: expect.objectContaining({
                    type: 'EXAT',
                    value: 1792623540
                })
            })
        )
        expect(res).toBeTruthy()
    })

    it('should return correctly if fetch succeeds and is NOT daylight', async () => {
        vi.setSystemTime(1792609200000)
        fetchMock.getOnce(HOME_SUNRISE_SUNSET_URL, mockSunriseSunsetData)

        const res = await isDaylightHours()

        expect(mockRedisClient.set).toHaveBeenCalledWith(
            'time:SUNRISE',
            '2026-10-21T06:12:03+00:00',
            expect.objectContaining({
                expiration: expect.objectContaining({
                    type: 'EXAT',
                    value: 1792623540
                })
            })
        )
        expect(mockRedisClient.set).toHaveBeenCalledWith(
            'time:SUNSET',
            '2026-10-21T18:43:54+00:00',
            expect.objectContaining({
                expiration: expect.objectContaining({
                    type: 'EXAT',
                    value: 1792623540
                })
            })
        )
        expect(res).toBeFalsy()
    })
})
