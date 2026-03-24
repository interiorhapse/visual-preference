import type { Archetype, AxisKey } from '../../types'
import { AXIS_LABELS } from '../../types'

interface FormulaCardProps {
  formula: string
  archetype: Archetype
  weights: Record<string, number>
  visible?: boolean
}

export default function FormulaCard({ formula, archetype, weights, visible = true }: FormulaCardProps) {
  // Top 3 weights for inline display
  const top3 = Object.entries(weights)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([key, value]) => ({
      label: AXIS_LABELS[key as AxisKey] ?? key,
      weight: Math.round(value),
    }))

  return (
    <div
      className="rounded-2xl bg-gradient-to-br from-violet-50 via-white to-violet-50/50 p-6 text-center transition-all duration-500"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'scale(1)' : 'scale(0.95)',
      }}
    >
      <div className="mb-2 text-5xl leading-none">{archetype.emoji}</div>
      <h2 className="mb-1.5 text-2xl font-extrabold tracking-tight text-zinc-900">
        {archetype.name}
      </h2>
      <p className="mb-4 text-sm text-zinc-500">
        {archetype.description}
      </p>
      <div className="flex items-center justify-center gap-1.5 text-xs text-zinc-400">
        {top3.map((item, i) => (
          <span key={item.label}>
            {i > 0 && <span className="mr-1.5">&middot;</span>}
            {item.label} {item.weight}%
          </span>
        ))}
      </div>
    </div>
  )
}
