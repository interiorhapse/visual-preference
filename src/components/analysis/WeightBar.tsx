import { AXIS_KEYS, AXIS_LABELS } from '../../types'
import type { AxisKey } from '../../types'

interface WeightBarProps {
  weights: Record<string, number>
  visible?: boolean
}

export default function WeightBar({ weights, visible = true }: WeightBarProps) {
  const sorted = AXIS_KEYS
    .map((key) => ({
      key,
      label: AXIS_LABELS[key as AxisKey],
      weight: weights[key] ?? 0,
    }))
    .sort((a, b) => b.weight - a.weight)

  const maxWeight = Math.max(...sorted.map((s) => s.weight), 1)

  return (
    <div className="flex flex-col gap-2.5">
      {sorted.map((item, index) => (
        <div
          key={item.key}
          className="flex items-center gap-3 transition-all duration-500"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateX(0)' : 'translateX(-20px)',
            transitionDelay: visible ? `${index * 80}ms` : '0ms',
          }}
        >
          <span className="w-20 shrink-0 text-right text-sm text-gray-600">
            {item.label}
          </span>
          <div className="relative h-6 flex-1 overflow-hidden rounded-full bg-gray-100">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-violet-500 to-violet-400"
              style={{
                width: visible ? `${(item.weight / maxWeight) * 100}%` : '0%',
                transition: `width 0.6s ease ${index * 80}ms`,
              }}
            />
          </div>
          <span className="w-12 shrink-0 text-right text-sm font-bold tabular-nums text-gray-800">
            {item.weight.toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  )
}
