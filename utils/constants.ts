import { ENV } from './env'

export const E_BIRD_OBS_HANTS_API_URL = [
    `https://api.ebird.org/v2/data/obs/GB-ENG-HAM/recent?key=${ENV.E_BIRD_API_KEY}&back=1`
]

export const GOING_BIRDING_HANTS_URLS = [
    'https://www.goingbirding.co.uk/hants/birdnews.aspx?date_search=0'
]
export const GOING_BIRDING_RARE_URLS = [
    'https://www.berksbirds.co.uk/birdnews.aspx',
    'https://www.goingbirding.co.uk/bucks/birdnews.aspx',
    'https://www.goingbirding.co.uk/hants/birdnews.aspx',
    'https://www.goingbirding.co.uk/oxon/birdnews.aspx',
    'https://www.goingbirding.co.uk/cornwall/birdnews.aspx',
    'https://www.goingbirding.co.uk/cumbria/birdnews.aspx',
    'https://www.goingbirding.co.uk/london/birdnews.aspx',
    'https://www.goingbirding.co.uk/scilly/birdnews.aspx',
    'https://www.goingbirding.co.uk/isleofwight/birdnews.aspx',
    'https://www.goingbirding.co.uk/surrey/birdnews.aspx'
].map(url => `${url}?date_search=1&status_id=2`)
// date_search=8&status_id=2&date=2026-9-29 <-- Useful for testing.

export const HOME_SUNRISE_SUNSET_URL =
    'https://api.sunrise-sunset.org/v2?lat=51.226594&lng=-1.459751'

export const GOOGLE_MAPS_ROOT = 'https://www.google.com/maps/'
export const GOOGLE_MAPS_SEARCH = GOOGLE_MAPS_ROOT + 'search/?api=1&query='
export const GOOGLE_MAPS_TILE_SIZE_PX = 256
export const GOOGLE_MAPS_MAX_ZOOM = 21
export const VIEWPORT_PX = 640

export const DAYTIME_REDIS_KEYS = {
    SUNRISE: 'SUNRISE',
    SUNSET: 'SUNSET'
} as const

export const LIFE_LIST_FILE = './ebird_world_life_list.csv'

export const ERROR_NTFY_TOPIC = 'error-birding'

// Must be lowercase.
export const KNOWN_NAME_MATCH_MAP: Record<string, Set<string>> = {
    'brent goose': new Set(['dark-bellied brent goose']),
    'pied wagtail/white wagtail': new Set(['pied wagtail', 'white wagtail'])
}
