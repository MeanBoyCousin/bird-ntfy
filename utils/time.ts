import dayjs from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'

import type { SunriseSunsetResponse } from '../types'
import { HOME_SUNRISE_SUNSET_URL } from './constants'
import { redis } from './redis'
import { logError } from './sys'

dayjs.extend(isBetween)

export const isDaylightHours = async () => {
    try {
        const [sunrise, sunset] = await redis.getSunriseSunset()
        if (sunrise && sunset) {
            return dayjs().isBetween(sunrise, sunset)
        }

        const res = await fetch(HOME_SUNRISE_SUNSET_URL)
        if (!res.ok) {
            return false
        }

        const { civil_twilight_begin, last_light } =
            (await res.json()) as SunriseSunsetResponse

        await redis.setSunriseSunset(civil_twilight_begin, last_light)

        return dayjs().isBetween(civil_twilight_begin, last_light)
    } catch (error) {
        await logError('Failed to fetch daytime data', error)

        return false
    }
}

export const isTopOfHour = () => {
    return dayjs().minute() === 0
}
