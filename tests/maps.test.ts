import { toGoogleMapsLink } from '../utils/maps'
import { mockRedisClient } from '../vitest.setup'
import { mockSites } from './fixtures'

describe('toGoogleMapsLink', () => {
    it('should return a valid URL when no gridRef is provided', async () => {
        expect(await toGoogleMapsLink(mockSites[0].siteName)).toMatch(
            'https://www.google.com/maps/search/?api=1&query=langstone%20harbour%20entrance'
        )
        expect(await toGoogleMapsLink(mockSites[1].siteName)).toMatch(
            'https://www.google.com/maps/search/?api=1&query=hook%20links%2C%20hook-with-warsash'
        )
        expect(await toGoogleMapsLink(mockSites[2].siteName)).toMatch(
            'https://www.google.com/maps/search/?api=1&query=avon%20flood%2C%20keyhaven'
        )
    })

    it('should return a valid URL when an invalid gridRef is provided', async () => {
        expect(
            await toGoogleMapsLink(mockSites[0].siteName, { gridRef: 'null' })
        ).toMatch(
            'https://www.google.com/maps/search/?api=1&query=langstone%20harbour%20entrance'
        )
    })

    it('should return a valid URL when the gridRef format has 2 numbers', async () => {
        expect(
            await toGoogleMapsLink(mockSites[0].siteName, {
                gridRef: mockSites[0].gridRef
            })
        ).toMatch(
            'https://www.google.com/maps/place/51.56014266748861,-1.0636792704463005/@51.56014266748861,-1.0636792704463005,12z'
        )
    })

    it('should return a valid URL when the gridRef format has 4 numbers', async () => {
        expect(
            await toGoogleMapsLink(mockSites[1].siteName, {
                gridRef: mockSites[1].gridRef
            })
        ).toMatch(
            'https://www.google.com/maps/place/50.8379193812503,-1.2983977049589157/@50.8379193812503,-1.2983977049589157,15z'
        )
    })

    it('should return a valid URL when the gridRef format has 6 numbers', async () => {
        expect(
            await toGoogleMapsLink(mockSites[2].siteName, {
                gridRef: mockSites[2].gridRef
            })
        ).toMatch(
            'https://www.google.com/maps/place/50.72546822549272,-1.5671352669596672/@50.72546822549272,-1.5671352669596672,19z'
        )
    })

    it('should return a valid URL when the gridRef format has 8 numbers', async () => {
        expect(
            await toGoogleMapsLink(mockSites[3].siteName, {
                gridRef: mockSites[3].gridRef
            })
        ).toMatch(
            'https://www.google.com/maps/place/50.850930212982874,-1.3163148611783981/@50.850930212982874,-1.3163148611783981,21z'
        )
    })

    it('should return a valid URL when the gridRef format has 10 numbers', async () => {
        expect(
            await toGoogleMapsLink(mockSites[4].siteName, {
                gridRef: mockSites[4].gridRef
            })
        ).toMatch(
            'https://www.google.com/maps/place/50.81999851590873,-1.2446006387472153/@50.81999851590873,-1.2446006387472153,21z'
        )
    })

    it('should return a valid URL if Redis has a cached value', async () => {
        mockRedisClient.get.mockResolvedValueOnce(
            'https://www.google.com/maps/place/51.56014266748861,-1.0636792704463005/@51.56014266748861,-1.0636792704463005,12z'
        )

        expect(
            await toGoogleMapsLink(mockSites[0].siteName, {
                gridRef: mockSites[0].gridRef
            })
        ).toMatch(
            'https://www.google.com/maps/place/51.56014266748861,-1.0636792704463005/@51.56014266748861,-1.0636792704463005,12z'
        )
    })

    it('should return a valid URL if Redis throws', async () => {
        mockRedisClient.get.mockRejectedValueOnce('error')
        mockRedisClient.set.mockRejectedValueOnce('error')

        expect(
            await toGoogleMapsLink(mockSites[0].siteName, {
                gridRef: mockSites[0].gridRef
            })
        ).toMatch(
            'https://www.google.com/maps/search/?api=1&query=langstone%20harbour%20entrance'
        )
    })
})
