import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { useStore } from '../../store/useStore'
import { searchPersons } from '../../services/search'
import type { Gender } from '../../types'
import PersonChip from './PersonChip'

export default function UnrankedPool() {
  const [query, setQuery] = useState('')
  const persons = useStore((s) => s.persons)
  const placements = useStore((s) => s.placements)
  const genderTab = useStore((s) => s.genderTab)
  const currentSessionId = useStore((s) => s.currentSessionId)

  const { setNodeRef } = useDroppable({ id: 'unranked' })

  // Get placed person IDs for current sessions
  const placedIds = new Set(
    placements
      .filter((p) => {
        if (genderTab === 'ALL') {
          return (
            p.sessionId === currentSessionId.M ||
            p.sessionId === currentSessionId.F
          )
        }
        return p.sessionId === currentSessionId[genderTab as Gender]
      })
      .map((p) => p.personId),
  )

  // Filter to unplaced persons
  const unplacedPersons = persons.filter((p) => !placedIds.has(p.id))

  // Apply gender filter
  const genderFilter = genderTab === 'ALL' ? undefined : (genderTab as Gender)

  // Apply search
  const filtered = searchPersons(unplacedPersons, query, genderFilter)

  return (
    <div className="mt-3 rounded-lg border border-[var(--color-border)] bg-white p-3">
      {/* Search */}
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="이름 또는 그룹 검색..."
        className="mb-2.5 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400"
      />

      {/* Unranked chips */}
      <div
        ref={setNodeRef}
        className="flex min-h-[44px] flex-wrap gap-1.5"
      >
        {filtered.map((person) => (
          <PersonChip
            key={person.id}
            person={person}
            isPlaced={false}
          />
        ))}
        {filtered.length === 0 && (
          <span className="py-2 text-xs text-gray-400 italic">
            {query ? '검색 결과 없음' : '모든 인물이 배치되었습니다'}
          </span>
        )}
      </div>
    </div>
  )
}
