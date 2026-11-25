export interface BirdData {
    date: string
    species: string
    speciesScientific?: string
    siteName: string
    count: string
    observer: string
    time: string
    notes: string
    mapLink: string
    topic: string
}

export interface EBirdLifeListRow {
    'Common Name': string
    'Scientific Name': string
}

export interface EBirdObservationEntry {
    speciesCode: string
    comName: string
    sciName: string
    locName: string
    obsDt: string
    howMany?: number
    lat: number
    lng: number
    subId: string
}

export interface SunriseSunsetResponse {
    civil_twilight_begin: string
    civil_twilight_end: string
    first_light: string
    last_light: string
}

interface FilteredObservationLogEntry {
    decision: 'filtered'
    reason: 'cached' | 'private-location' | 'life-list-match'
    detail: string
    data: BirdData
}

interface PassedObservationLogEntry {
    decision: 'passed'
    data: BirdData
}

export type ObservationLogEntry =
    | FilteredObservationLogEntry
    | PassedObservationLogEntry
