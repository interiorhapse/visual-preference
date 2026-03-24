import LZString from 'lz-string'
import type { ShareData, Tier } from '../types'
import { TIER_ORDER, AXIS_KEYS } from '../types'
import { URL_MAX_LENGTH } from '../utils/constants'

/**
 * Encode share data to a compressed URI-safe string.
 */
export function encodeShareData(data: ShareData): string {
  const json = JSON.stringify(data)
  return LZString.compressToEncodedURIComponent(json)
}

/**
 * Decode share data from a compressed string.
 * Returns null if decoding or validation fails.
 */
export function decodeShareData(hash: string): ShareData | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(hash)
    if (!json) return null

    const data = JSON.parse(json) as ShareData

    // Validate structure
    if (typeof data.v !== 'number') return null
    if (data.gender !== 'M' && data.gender !== 'F') return null
    if (typeof data.placements !== 'object' || data.placements === null) return null

    // Validate placements has tier keys with string arrays
    for (const tier of TIER_ORDER) {
      if (data.placements[tier] !== undefined && !Array.isArray(data.placements[tier])) {
        return null
      }
    }

    // Validate analysis if present
    if (data.analysis !== null) {
      if (typeof data.analysis !== 'object') return null
      if (typeof data.analysis.weights !== 'object') return null
      if (!Array.isArray(data.analysis.clusters)) return null
      if (typeof data.analysis.formula !== 'string') return null
      if (
        typeof data.analysis.radar !== 'object' ||
        !Array.isArray(data.analysis.radar.s) ||
        !Array.isArray(data.analysis.radar.c)
      ) {
        return null
      }
    }

    return data
  } catch {
    return null
  }
}

/**
 * Build a full share URL with the compressed data as a hash fragment.
 */
export function buildShareURL(data: ShareData): string {
  const encoded = encodeShareData(data)
  const base = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}`
    : ''
  const url = `${base}#share=${encoded}`

  if (url.length > URL_MAX_LENGTH) {
    // Fallback: strip analysis data to reduce size
    const stripped: ShareData = { ...data, analysis: null }
    const strippedEncoded = encodeShareData(stripped)
    return `${base}#share=${strippedEncoded}`
  }

  return url
}

/**
 * Parse share data from the current window.location.hash.
 * Returns null if no share data is found.
 */
export function parseShareURL(): ShareData | null {
  if (typeof window === 'undefined') return null

  const hash = window.location.hash
  if (!hash.startsWith('#share=')) return null

  const encoded = hash.slice('#share='.length)
  return decodeShareData(encoded)
}
