import dedent from 'dedent'
import { readFileSync } from 'node:fs'

import { ERROR_NTFY_TOPIC } from './constants'
import { sendNotification } from './ntfy'
import { redis } from './redis'

export const getVersion = () => {
    const packageFile = readFileSync('./package.json', 'utf8')

    return `v${JSON.parse(packageFile).version}`
}

export const logError = async (message: string, error: unknown) => {
    console.error(message, error)

    try {
        await sendNotification({
            message: dedent(String(error)),
            title: message,
            topic: ERROR_NTFY_TOPIC
        })
    } catch (error) {
        console.error('Failed to send error notification', error)
    }
}

export const shutdown = async () => {
    console.log('Shutting down...')
    redis.client.destroy()
    process.exit(0)
}
