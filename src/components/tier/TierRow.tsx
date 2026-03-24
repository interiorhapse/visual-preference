import { useDroppable } from '@dnd-kit/core'
import type { Person, Tier } from '../../types'
import { TIER_COLORS } from '../../types'
import PersonChip from './PersonChip'

const TIER_GRADIENTS: Record<Tier, string> = {
  S: 'linear-gradient(135deg, #F59E0B, #F472B6)',
  A: 'linear-gradient(135deg, #F43F5E, #A855F7)',
  B: 'linear-gradient(135deg, #06B6D4, #3B82F6)',
  C: 'linear-gradient(135deg, #10B981, #6366F1)',
}

interface TierRowProps {
  tier: Tier
  persons: Person[]
}

export default function TierRow({ tier, persons }: TierRowProps) {
  const { setNodeRef, isOver } = useDroppable({ id: tier })
  const colors = TIER_COLORS[tier]

  return (
    <div
      className={`flex items-stretch rounded-xl overflow-hidden shadow-sm transition-shadow ${
        isOver ? 'shadow-md' : ''
      }`}
      style={{
        backgroundColor: colors.bg,
      }}
    >
      {/* Tier label with gradient */}
      <div
        className="flex w-10 shrink-0 items-center justify-center rounded-l-xl"
        style={{ background: TIER_GRADIENTS[tier] }}
      >
        <span className="text-white font-bold text-lg">
          {tier}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className="flex min-h-[52px] flex-1 flex-wrap items-center gap-1.5 p-2"
      >
        {persons.map((person) => (
          <PersonChip
            key={person.id}
            person={person}
            isPlaced
            tier={tier}
          />
        ))}
        {persons.length === 0 && (
          <span className="text-xs text-gray-400 italic">
            여기에 배치하세요
          </span>
        )}
      </div>
    </div>
  )
}
