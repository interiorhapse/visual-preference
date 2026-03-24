import { useDraggable } from '@dnd-kit/core'
import { useStore } from '../../store/useStore'
import type { Person, Tier } from '../../types'
import { TIER_COLORS } from '../../types'

const TIER_GRADIENTS: Record<Tier, string> = {
  S: 'linear-gradient(135deg, #F59E0B, #F472B6)',
  A: 'linear-gradient(135deg, #F43F5E, #A855F7)',
  B: 'linear-gradient(135deg, #06B6D4, #3B82F6)',
  C: 'linear-gradient(135deg, #10B981, #6366F1)',
}

interface PersonChipProps {
  person: Person
  isPlaced: boolean
  tier?: Tier
}

export default function PersonChip({ person, isPlaced, tier }: PersonChipProps) {
  const selectedPersonId = useStore((s) => s.selectedPersonId)
  const setSelectedPersonId = useStore((s) => s.setSelectedPersonId)

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: person.id,
    data: { person },
  })

  const isSelected = selectedPersonId === person.id

  const dragStyle: React.CSSProperties = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : {}

  const colors = tier ? TIER_COLORS[tier] : null

  const initial = person.name.charAt(0)

  return (
    <button
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={() => {
        setSelectedPersonId(isSelected ? null : person.id)
      }}
      style={{
        ...dragStyle,
        backgroundColor: isPlaced && colors ? colors.chip : '#FFFFFF',
      }}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[13px] touch-manipulation select-none transition-all duration-200 ${
        isDragging ? 'scale-105 shadow-drag z-50' : ''
      } ${
        !isPlaced ? 'bg-white border border-zinc-200 shadow-sm text-zinc-800' : 'border border-transparent shadow-sm'
      } ${
        isSelected ? 'ring-2 ring-violet-500 scale-105' : ''
      }`}
    >
      {/* Circular initial avatar */}
      <span
        className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-semibold text-white shrink-0"
        style={{
          background: isPlaced && tier ? TIER_GRADIENTS[tier] : '#D4D4D8',
          color: isPlaced ? '#FFFFFF' : '#71717A',
        }}
      >
        {initial}
      </span>

      <span
        className="font-medium text-[13px] leading-tight"
        style={{ color: isPlaced && colors ? colors.text : undefined }}
      >
        {person.name}
      </span>
      <span
        className="text-[11px] leading-tight"
        style={{ color: isPlaced && colors ? colors.text : '#A1A1AA' }}
      >
        {person.group}
      </span>
    </button>
  )
}
