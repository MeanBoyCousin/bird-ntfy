import { eBird } from '../topic-roots/ebird'
import { E_BIRD_OBS_HANTS_API_URL } from '../utils/constants'

// Every 5 mins from 4am until midnight.
eBird('*/5 4-23 * * *', E_BIRD_OBS_HANTS_API_URL)
