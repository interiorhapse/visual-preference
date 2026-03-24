import { useState } from 'react'
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { useStore } from '../../store/useStore'
import { TIER_ORDER, TIER_COLORS } from '../../types'
import type { Tier, Gender, Person } from '../../types'
import { MIN_PLACEMENT_FOR_ANALYSIS } from '../../utils/constants'
import TierRow from './TierRow'
import UnrankedPool from './UnrankedPool'
import MobileTierBar from './MobileTierBar'
import PersonModal from '../shared/PersonModal'

export default function TierBoard() {
  const persons = useStore((s) => s.persons)
  const placements = useStore((s) => s.placements)
  const genderTab = useStore((s) => s.genderTab)
  const currentSessionId = useStore((s) => s.currentSessionId)
  const runAnalysis = useStore((s) => s.runAnalysis)
  const setFunctionTab = useStore((s) => s.setFunctionTab)
  const placePerson = useStore((s) => s.placePerson)
  const removePlacement = useStore((s) => s.removePlacement)

  const [showPersonModal, setShowPersonModal] = useState(false)

  const isReadOnly = genderTab === 'ALL'

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  )

  const relevantPlacements = placements.filter((p) => {
    if (genderTab === 'ALL') {
      return (
        p.sessionId === currentSessionId.M ||
        p.sessionId === currentSessionId.F
      )
    }
    return p.sessionId === currentSessionId[genderTab as Gender]
  })

  const personMap = new Map(persons.map((p) => [p.id, p]))

  const tierPersons: Record<Tier, Person[]> = { S: [], A: [], B: [], C: [] }
  for (const placement of relevantPlacements) {
    const person = personMap.get(placement.personId)
    if (person) {
      tierPersons[placement.tier].push(person)
    }
  }

  const counts = {
    S: tierPersons.S.length,
    A: tierPersons.A.length,
    B: tierPersons.B.length,
    C: tierPersons.C.length,
  }
  const placedTotal = counts.S + counts.A + counts.B + counts.C
  const unrankedCount = persons.filter((p) => {
    if (genderTab === 'ALL') return true
    return p.gender === genderTab
  }).length - placedTotal

  const gender: Gender = genderTab === 'ALL' ? 'F' : genderTab
  const canAnalyze = counts.S + counts.A >= MIN_PLACEMENT_FOR_ANALYSIS

  const handleDragEnd = (event: DragEndEvent) => {
    if (isReadOnly) return
    const { active, over } = event
    if (!over) return

    const personId = active.id as string
    const targetId = over.id as string

    if (TIER_ORDER.includes(targetId as Tier)) {
      placePerson(personId, targetId as Tier)
    } else if (targetId === 'unranked') {
      removePlacement(personId)
    }
  }

  return (
    <DndContext sensors={isReadOnly ? undefined : sensors} onDragEnd={handleDragEnd}>
      <div className="flex flex-col gap-2 px-2 pt-3 pb-24">
        {/* Read-only badge for ALL tab */}
        {isReadOnly && (
          <div className="text-center text-xs text-zinc-400 py-1">
            통합 보기 (읽기 전용)
          </div>
        )}

        {TIER_ORDER.map((tier) => (
          <TierRow key={tier} tier={tier} persons={tierPersons[tier]} />
        ))}

        {!isReadOnly && <UnrankedPool />}

        {/* Count bar */}
        <div className="flex items-center justify-center gap-3 py-2 text-xs text-zinc-500">
          {TIER_ORDER.map((tier) => (
            <span key={tier} className="flex items-center gap-1">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: TIER_COLORS[tier].border }}
              />
              <span className="font-medium" style={{ color: TIER_COLORS[tier].text }}>
                {tier}:{counts[tier]}
              </span>
            </span>
          ))}
          <span className="text-zinc-400">
            미배치:{unrankedCount}
          </span>
        </div>

        {/* Warning */}
        {!isReadOnly && !canAnalyze && placedTotal > 0 && (
          <p className="text-center text-xs text-amber-600">
            S + A 티어에 최소 2명 이상 배치해주세요
          </p>
        )}

        {/* Actions */}
        {!isReadOnly && (
          <div className="flex gap-2 px-1">
            <button
              disabled={!canAnalyze}
              onClick={() => {
                runAnalysis(gender)
                setFunctionTab('analysis')
              }}
              className={`flex-1 rounded-lg py-2.5 text-sm font-semibold text-white transition-colors ${
                canAnalyze
                  ? 'bg-violet-600 hover:bg-violet-700 active:bg-violet-800'
                  : 'cursor-not-allowed bg-gray-300'
              }`}
            >
              분석하기
            </button>
            <button
              onClick={() => setShowPersonModal(true)}
              className="rounded-lg border border-violet-300 bg-white px-4 py-2.5 text-sm font-medium text-violet-700 transition-colors hover:bg-violet-50 active:bg-violet-100"
            >
              인물 추가
            </button>
          </div>
        )}
      </div>

      {/* Mobile tier selection bar */}
      {!isReadOnly && <MobileTierBar />}

      {/* Person modal */}
      {showPersonModal && (
        <PersonModal onClose={() => setShowPersonModal(false)} />
      )}
    </DndContext>
  )
}
