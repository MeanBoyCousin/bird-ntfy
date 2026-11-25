import { goingBirding } from '../topic-roots/going-birding'
import { GOING_BIRDING_RARE_URLS } from '../utils/constants'

// Every 5 mins from 4am until midnight.
goingBirding('*/5 4-23 * * *', GOING_BIRDING_RARE_URLS)
