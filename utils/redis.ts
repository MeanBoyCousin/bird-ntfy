import dayjs from 'dayjs'
import { createClient, RedisClientType, RedisDefaultModules } from 'redis'

import type { BirdData } from '../types'
import { DAYTIME_REDIS_KEYS } from './constants'

class Redis {
    client: RedisClientType<RedisDefaultModules, {}, {}, 3, {}>

    constructor() {
        this.client = createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379'
        }).on('error', err => console.log('Redis Client Error', err))
    }

    // 60 seconds * 60 minutes * 24 hours * 2 days
    private birdTTL = 60 * 60 * 24 * 2

    private buildBirdCacheKey(data: BirdData) {
        return `${data.topic}:${data.date}-${data.siteName}-${data.species}-${data.observer}`.replaceAll(
            ' ',
            '-'
        )
    }

    private buildGridRefKey(siteId: string) {
        return `site:${siteId}`
    }

    private buildMapsLinkKey(gridRef: string) {
        return `maps_link:${gridRef}`
    }

    private buildTimeKey(time: string) {
        return `time:${time}`
    }

    private buildLogKey(data: BirdData) {
        return `log:${this.buildBirdCacheKey(data)}`
    }

    async connect() {
        await this.client.connect()
    }

    async setBird(data: BirdData) {
        await this.client.set(
            this.buildBirdCacheKey(data),
            JSON.stringify(data),
            {
                expiration: { type: 'EX', value: this.birdTTL }
            }
        )
    }

    async existsBird(data: BirdData) {
        return Boolean(await this.client.exists(this.buildBirdCacheKey(data)))
    }

    async getGridRef(siteId: string) {
        return await this.client.get(this.buildGridRefKey(siteId))
    }

    async setGridRef(siteId: string, gridRef: string) {
        await this.client.set(this.buildGridRefKey(siteId), gridRef)
    }

    async getMapsLink(gridRef: string) {
        return await this.client.get(this.buildMapsLinkKey(gridRef))
    }

    async setMapsLink(gridRef: string, mapsLink: string) {
        await this.client.set(this.buildMapsLinkKey(gridRef), mapsLink)
    }

    async getSunriseSunset(): Promise<[string | null, string | null]> {
        return [
            await this.client.get(
                this.buildTimeKey(DAYTIME_REDIS_KEYS.SUNRISE)
            ),
            await this.client.get(this.buildTimeKey(DAYTIME_REDIS_KEYS.SUNSET))
        ]
    }

    async setSunriseSunset(sunrise: string, sunset: string) {
        const options = {
            expiration: {
                type: 'EXAT',
                value: dayjs().set('hour', 23).set('minutes', 59).unix()
            }
        } as const

        await this.client.set(
            this.buildTimeKey(DAYTIME_REDIS_KEYS.SUNRISE),
            sunrise,
            options
        )
        await this.client.set(
            this.buildTimeKey(DAYTIME_REDIS_KEYS.SUNSET),
            sunset,
            options
        )
    }

    async shouldLog(data: BirdData) {
        const key = this.buildLogKey(data)
        const isLogged = Boolean(await this.client.exists(key))

        if (isLogged) {
            return false
        }

        await this.client.set(key, '1', {
            expiration: { type: 'EX', value: this.birdTTL }
        })

        return true
    }
}

export const redis = new Redis()
