import dedent from 'dedent'

import { BirdData } from '../types'
import { redis } from './redis'
import { logError } from './sys'

interface NtfyBodyInit {
    actions?: { action: string; label: string; url: string }[]
    click?: string
    message: string
    title: string
    topic: string
}

export const sendNotification = async (
    body: NtfyBodyInit,
    headers?: Record<string, string>
) => {
    await fetch('https://ntfy.sh', {
        body: JSON.stringify(body),
        headers: {
            'Content-Type': 'application/json',
            ...headers
        },
        method: 'POST'
    })
}

export const sendBirdNotification = async (data: BirdData) => {
    const dateTime = data.time ? `${data.date} | ${data.time}` : `${data.date}`
    const isRare = data.topic === 'rare-birding'
    let message = `
        ${isRare ? `${dateTime} | RARE` : dateTime}
        ${data.count} seen at ${data.siteName}.
        `

    if (data.notes) {
        message += `Notes: ${data.notes}`
    }

    try {
        await sendNotification(
            {
                actions: [
                    { action: 'view', label: 'Open in Maps', url: data.mapLink }
                ],
                click: data.mapLink,
                message: dedent(message),
                title: `${data.species} spotted!`,
                topic: data.topic
            },
            { Priority: isRare ? '5' : '3' }
        )

        await redis.setBird(data)
    } catch (error) {
        await logError('Failed to send bird notification', error)
    }
}
