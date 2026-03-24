import type { Person, Gender } from '../types'
import { matchesSearch } from '../utils/chosung'

/**
 * Search persons by query string (supports Korean chosung matching).
 * Optionally filters by gender.
 */
export function searchPersons(
  persons: Person[],
  query: string,
  gender?: Gender,
): Person[] {
  let filtered = persons

  if (gender) {
    filtered = filtered.filter((p) => p.gender === gender)
  }

  if (!query.trim()) {
    return filtered
  }

  return filtered.filter((p) => matchesSearch(query, p.name, p.group))
}
