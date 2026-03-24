import { useStore } from '../../store/useStore'
import { TIER_ORDER, TIER_COLORS } from '../../types'
import type { Tier } from '../../types'

export default function MobileTierBar() {
  const selectedPersonId = useStore((s) => s.selectedPersonId)
  const placePerson = useStore((s) => s.placePerson)
  const setSelectedPersonId = useStore((s) => s.setSelectedPersonId)

  if (!selectedPersonId) return null

  const handlePlace = (tier: Tier) => {
    placePerson(selectedPersonId, tier)
    setSelectedPersonId(null)
  }

  const handleCancel = () => {
    setSelectedPersonId(null)
  }

  return (
    <div className="fixed inset-x-0 bottom-16 z-50 animate-[slideUp_0.2s_ease-out] rounded-t-2xl bg-white px-4 py-3 shadow-float">
      <div className="mx-auto flex max-w-[500px] gap-2">
        {TIER_ORDER.map((tier) => {
          const colors = TIER_COLORS[tier]
          return (
            <button
              key={tier}
              onClick={() => handlePlace(tier)}
              className="flex-1 rounded-xl py-2.5 text-sm font-bold transition-transform active:scale-95"
              style={{
                backgroundColor: colors.chip,
                color: colors.text,
                border: `1.5px solid ${colors.border}`,
              }}
            >
              {tier}
            </button>
          )
        })}
        <button
          onClick={handleCancel}
          className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 text-sm font-medium text-zinc-600 transition-transform active:scale-95"
        >
          취소
        </button>
      </div>
    </div>
  )
}
