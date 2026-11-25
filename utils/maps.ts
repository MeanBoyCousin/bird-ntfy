import { viewport } from '@mapbox/geo-viewport'
import OsGridRef from 'geodesy/osgridref.js'

import {
    GOOGLE_MAPS_MAX_ZOOM,
    GOOGLE_MAPS_ROOT,
    GOOGLE_MAPS_SEARCH,
    GOOGLE_MAPS_TILE_SIZE_PX,
    VIEWPORT_PX
} from './constants'
import { redis } from './redis'
import { logError } from './sys'

const toCoordsLink = (lat: number, lon: number, zoom?: number) => {
    let url = `${GOOGLE_MAPS_ROOT}place/${lat},${lon}/@${lat},${lon}`

    if (zoom) {
        url += `,${zoom}z`
    }

    return url
}

const toSearchLink = (siteName: string) => {
    return `${GOOGLE_MAPS_SEARCH}${encodeURIComponent(siteName.toLowerCase())}`
}

export const toGoogleMapsLink = async (
    siteName: string,
    opts: { gridRef?: string; lat?: number; lon?: number } = {
        gridRef: '',
        lat: 0,
        lon: 0
    }
) => {
    if (opts.lat && opts.lon) {
        return toCoordsLink(opts.lat, opts.lon)
    }

    if (!opts.gridRef) {
        return toSearchLink(siteName)
    }

    try {
        const mapsLink = await redis.getMapsLink(opts.gridRef)

        if (mapsLink) {
            return mapsLink
        }
    } catch (error) {
        await logError(
            `Failed to get maps link from Redis for grid ref "${opts.gridRef}"`,
            error
        )
    }

    try {
        const resolution = 100_000 / 10 ** ((opts.gridRef.length - 2) / 2)
        const parsed = OsGridRef.parse(opts.gridRef)
        const sw = parsed.toLatLon()
        const ne = new OsGridRef(
            parsed.easting + resolution,
            parsed.northing + resolution
        ).toLatLon()

        const {
            center: [lon, lat],
            zoom
        } = viewport(
            [sw.lon, sw.lat, ne.lon, ne.lat],
            [VIEWPORT_PX, VIEWPORT_PX],
            0,
            GOOGLE_MAPS_MAX_ZOOM,
            GOOGLE_MAPS_TILE_SIZE_PX
        )

        const mapsLink = toCoordsLink(lat, lon, zoom)
        await redis.setMapsLink(opts.gridRef, mapsLink)

        return mapsLink
    } catch (error) {
        await logError(`Failed to resolve grid ref "${opts.gridRef}"`, error)

        return toSearchLink(siteName)
    }
}
