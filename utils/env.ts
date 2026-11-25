import { config } from 'dotenv'
import { join } from 'node:path'

config()

export const ENV = {
    E_BIRD_API_KEY: process.env.E_BIRD_API_KEY,
    LOG_DIR: process.env.LOG_DIR ?? join(process.cwd(), 'logs'),
    TOPIC: process.env.TOPIC ?? 'dev-birding'
} as const
