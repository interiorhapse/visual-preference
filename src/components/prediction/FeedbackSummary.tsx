import { useStore } from '../../store/useStore'
import type { Prediction, Tier } from '../../types'
import { TIER_COLORS } from '../../types'

interface Props {
  predictions: Prediction[]
}

function deltaColor(delta: number): string {
  if (delta === 0) return '#0F6E56'
  if (Math.abs(delta) === 1) return '#BA7517'
  return '#A32D2D'
}

function deltaBadge(delta: number): string {
  if (delta === 0) return 'O'
  return `${delta > 0 ? '+' : ''}${delta}`
}

export default function FeedbackSummary({ predictions }: Props) {
  const persons = useStore((s) => s.persons)

  const withFeedback = predictions.filter((p) => p.actualTier !== null)
  if (withFeedback.length === 0) return null

  // Check all predictions have feedback
  const allDone = predictions.every((p) => p.actualTier !== null)
  if (!allDone) return null

  const total = withFeedback.length
  const exactHits = withFeedback.filter((p) => p.delta === 0).length
  const withinOne = withFeedback.filter((p) => Math.abs(p.delta!) <= 1).length
  const avgDelta =
    withFeedback.reduce((sum, p) => sum + Math.abs(p.delta!), 0) / total

  const exactRate = Math.round((exactHits / total) * 100)
  const withinOneRate = Math.round((withinOne / total) * 100)

  return (
    <div className="bg-white rounded-xl border-2 border-violet-200 p-4 space-y-4">
      <h3 className="text-sm font-semibold text-violet-700">피드백 요약</h3>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <div className="text-xl font-bold text-violet-600">{exactRate}%</div>
          <div className="text-xs text-gray-500">정확 적중률</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-violet-600">{withinOneRate}%</div>
          <div className="text-xs text-gray-500">1단계 이내</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-violet-600">
            {Math.round(avgDelta * 10) / 10}
          </div>
          <div className="text-xs text-gray-500">평균 오차</div>
        </div>
      </div>

      {/* Mini table */}
      <div className="space-y-1">
        <div className="grid grid-cols-[1fr_56px_56px_48px] gap-2 text-xs text-gray-400 font-medium px-1">
          <span>이름</span>
          <span className="text-center">예측</span>
          <span className="text-center">실제</span>
          <span className="text-center">오차</span>
        </div>
        {withFeedback.map((pred) => {
          const person = persons.find((p) => p.id === pred.personId)
          const predColor = TIER_COLORS[pred.predictedTier]
          const actualColor = pred.actualTier ? TIER_COLORS[pred.actualTier] : null

          return (
            <div
              key={pred.id}
              className="grid grid-cols-[1fr_56px_56px_48px] gap-2 items-center text-sm px-1 py-1.5 rounded-lg hover:bg-gray-50"
            >
              <span className="text-gray-800 font-medium truncate">
                {person?.name ?? '?'}
              </span>
              <span
                className="text-center text-xs font-bold"
                style={{ color: predColor.text }}
              >
                {pred.predictedTier}
              </span>
              <span
                className="text-center text-xs font-bold"
                style={{ color: actualColor?.text ?? '#666' }}
              >
                {pred.actualTier ?? '-'}
              </span>
              <span
                className="text-center text-xs font-bold"
                style={{ color: deltaColor(pred.delta ?? 0) }}
              >
                {pred.delta !== null ? deltaBadge(pred.delta) : '-'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
