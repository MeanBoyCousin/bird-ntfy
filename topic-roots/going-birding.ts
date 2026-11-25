import { Cron } from 'croner'
import dayjs from 'dayjs'
import { setTimeout as sleep } from 'node:timers/promises'

import { fetchHTML, filterDataMap, parseHTML } from '../utils/data'
import { ENV } from '../utils/env'
import { sendBirdNotification } from '../utils/ntfy'
import { redis } from '../utils/redis'
import { getVersion, shutdown } from '../utils/sys'
import { isDaylightHours, isTopOfHour } from '../utils/time'

export const goingBirding = async (cronPattern: string, urls: string[]) => {
    console.log(getVersion())
    console.log(`Topic: "${ENV.TOPIC}"`)

    new Cron(cronPattern, async () => {
        console.log(
            `\nChecking for new sightings... [${dayjs().format('HH:mm:ss')}]`
        )

        if (!redis.client.isOpen) {
            await redis.connect()
        }

        if (!(await isDaylightHours())) {
            if (!isTopOfHour()) {
                console.log(
                    'Outside of daylight hours, slow polling in effect.'
                )
                return
            }
        }

        const html = await Promise.all(urls.map(fetchHTML))
        const results = (
            await Promise.all(html.map(html => parseHTML(html)))
        ).flat()
        const filtered = await filterDataMap(results)

        if (filtered.length) {
            console.log(
                `Found ${filtered.length} new sightings. Sending notifications...`
            )

            for (let index = 0; index < filtered.length; index++) {
                await sendBirdNotification(filtered[index])
                await sleep(1_000)
            }
        } else {
            console.log('No new sightings.')
        }
    })

    console.log('Service started!')

    process.on('SIGTERM', shutdown)
    process.on('SIGINT', shutdown)
}
