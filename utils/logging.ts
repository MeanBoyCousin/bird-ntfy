import dayjs from 'dayjs'
import { mkdirSync } from 'node:fs'
import { appendFile } from 'node:fs/promises'
import { join } from 'node:path'

import type { ObservationLogEntry } from '../types'
import { ENV } from './env'

const logPath = () => {
    return join(
        ENV.LOG_DIR,
        `observations-${ENV.TOPIC}-${dayjs().format('DD-MM-YYYY')}.ndjson`
    )
}

export const logObservations = async (entries: ObservationLogEntry[]) => {
    if (entries.length === 0) return

    mkdirSync(ENV.LOG_DIR, { recursive: true })

    const lines =
        entries
            .map(entry =>
                JSON.stringify({
                    loggedAt: dayjs().format('YYYY-MM-DDTHH:mm:ss'),
                    ...entry
                })
            )
            .join('\n') + '\n'

    await appendFile(logPath(), lines)
}
