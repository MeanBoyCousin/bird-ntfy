import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import isToday from 'dayjs/plugin/isToday'
import { parse } from 'node-html-parser'
import { readFileSync } from 'node:fs'
import Papa from 'papaparse'

import type {
    BirdData,
    EBirdLifeListRow,
    EBirdObservationEntry,
    ObservationLogEntry
} from '../types'
import { KNOWN_NAME_MATCH_MAP, LIFE_LIST_FILE } from './constants'
import { ENV } from './env'
import { logObservations } from './logging'
import { toGoogleMapsLink } from './maps'
import { redis } from './redis'
import { logError } from './sys'

dayjs.extend(customParseFormat)
dayjs.extend(isToday)

export const fetchHTML = async (url: string): Promise<[string, string]> => {
    try {
        const res = await fetch(url)

        return [url, await res.text()]
    } catch (error) {
        await logError('Failed to fetch', error)

        return [url, '']
    }
}

export const fetchJSON = async <T = []>(url: string): Promise<T> => {
    try {
        const res = await fetch(url)

        return (await res.json()) as T
    } catch (error) {
        await logError('Failed to fetch', error)

        return [] as T
    }
}

export const parseHTML = async ([url, html]: [string, string]) => {
    if (!html) return []

    const dataMap: BirdData[] = []
    const rows = parse(html).querySelector('tbody')?.childNodes

    if (!rows || !rows.length) {
        return dataMap
    }

    for (let index = 0; index < rows.length; index++) {
        if (index % 2) continue

        const tableData = rows[index].childNodes
        const extraTableData = rows[index + 1].childNodes

        const notes = extraTableData[1].text.trim()
        const notesGridRef = notes.match(/\b[a-zA-Z]{2}\d{4,}\b/)?.[0]

        const siteNode = parse(tableData[2].toString())
        const siteName = siteNode.innerText.trim()
        const sitePath = siteNode.querySelector('a')?.getAttribute('href')
        const siteId = sitePath?.match(/\d+/)?.[0]

        const birdData: BirdData = {
            count: tableData[3].text.trim(),
            date: tableData[0].text.trim(),
            mapLink: await toGoogleMapsLink(siteName),
            notes,
            observer: tableData[4].text.trim(),
            siteName,
            species: tableData[1].text.trim(),
            time: extraTableData[0].text.trim(),
            topic: ENV.TOPIC
        }

        if (notesGridRef) {
            birdData.mapLink = await toGoogleMapsLink(siteName, {
                gridRef: notesGridRef
            })
        } else if (siteId) {
            const cachedGridRef = await redis.getGridRef(siteId)

            if (cachedGridRef) {
                birdData.mapLink = await toGoogleMapsLink(siteName, {
                    gridRef: cachedGridRef
                })
            } else {
                try {
                    const siteUrl = url.split('birdnews')[0] + sitePath
                    console.log(`Fetching grid ref for site: "${siteUrl}"`)

                    const res = await fetch(siteUrl)
                    const text = await res.text()
                    const siteGridRef = parse(text)
                        .getElementById('GridRefLink')
                        ?.text.trim()

                    if (siteGridRef) {
                        birdData.mapLink = await toGoogleMapsLink(siteName, {
                            gridRef: siteGridRef
                        })
                        await redis.setGridRef(siteId, siteGridRef)
                    }
                } catch (error) {
                    await logError(
                        `Failed to fetch page for site id "${siteId}"`,
                        error
                    )
                }
            }
        }

        dataMap.push(birdData)
    }

    return dataMap
}

export const filterDataMap = async (dataMap: BirdData[]) => {
    // Parse out life list CSV to common name set.
    const { data } = Papa.parse<EBirdLifeListRow>(
        readFileSync(LIFE_LIST_FILE, 'utf8'),
        {
            header: true,
            skipEmptyLines: true
        }
    )
    const birdsToIgnore = data
        .map(row => ({
            common: row['Common Name'].trim().toLowerCase(),
            scientific: row['Scientific Name'].trim().toLowerCase()
        }))
        .filter(Boolean)

    const filteredResults: BirdData[] = []
    const logEntries: ObservationLogEntry[] = []

    const notesRegex = /(garden)/i
    const siteNameRegex = /(garden|home)/i

    for (const data of dataMap) {
        const species = data.species.trim().toLowerCase()
        const speciesScientific = data.speciesScientific?.trim().toLowerCase()
        const shouldLog = await redis.shouldLog(data)

        if (await redis.existsBird(data)) {
            if (shouldLog) {
                logEntries.push({
                    decision: 'filtered',
                    reason: 'cached',
                    detail: species,
                    data
                })
            }

            continue
        }

        if (notesRegex.test(data.notes)) {
            if (shouldLog) {
                logEntries.push({
                    decision: 'filtered',
                    reason: 'private-location',
                    detail: `Notes: "${data.notes}"`,
                    data
                })
            }

            continue
        }

        if (siteNameRegex.test(data.siteName)) {
            if (shouldLog) {
                logEntries.push({
                    decision: 'filtered',
                    reason: 'private-location',
                    detail: `Site: "${data.siteName}"`,
                    data
                })
            }

            continue
        }

        // Exact match, or life list name with extra leading words ("common chiffchaff, northern lapwing, etc.")
        const match = birdsToIgnore.find(
            ({ common, scientific }) =>
                scientific === speciesScientific ||
                common === species ||
                common.endsWith(` ${species}`) ||
                KNOWN_NAME_MATCH_MAP[common]?.has(species)
        )
        if (match) {
            if (match.common !== species && !speciesScientific) {
                if (shouldLog) {
                    logEntries.push({
                        decision: 'filtered',
                        reason: 'life-list-match',
                        detail: `Matched "${species}" to "${match.common}"`,
                        data
                    })
                }
            }
            continue
        }

        if (shouldLog) {
            logEntries.push({ decision: 'passed', data })
        }

        filteredResults.push(data)
    }

    await logObservations(logEntries)

    return filteredResults
}

export const eBirdObservationEntryToBirdData = async (
    entry: EBirdObservationEntry
): Promise<BirdData> => {
    const dateTime = dayjs(entry.obsDt)

    return {
        date: dateTime.format('DD/MM/YY'),
        species: entry.comName,
        speciesScientific: entry.sciName,
        siteName: entry.locName,
        count: (entry.howMany || 1).toString(),
        observer: entry.subId,
        time: dateTime.format('HH:mm'),
        notes: '',
        mapLink: await toGoogleMapsLink(entry.locName, {
            lat: entry.lat,
            lon: entry.lng
        }),
        topic: ENV.TOPIC
    }
}
