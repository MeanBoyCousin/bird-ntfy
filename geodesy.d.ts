// geodesy.d.ts — anywhere covered by your "include": ["**/*.ts"]
declare module 'geodesy/osgridref.js' {
    export default class OsGridRef {
        easting: number
        northing: number
        constructor(easting: number, northing: number)
        static parse(gridref: string): OsGridRef
        toLatLon(datum?: unknown): { lat: number; lon: number }
        toString(digits?: number): string
    }
}
