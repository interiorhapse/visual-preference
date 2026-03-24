import { useState } from 'react'
import { useStore } from '../../store/useStore'
import type { Person, Prediction, Tier } from '../../types'
import { TIER_ORDER, TIER_COLORS } from '../../types'

interface Props {
  prediction: Prediction
  person: Person
}

function deltaLabel(delta: number): { text: string; color: string } {
  if (delta === 0) return { text: '정확 적중', color: '#0F6E56' }
  if (Math.abs(delta) === 1) return { text: `${delta > 0 ? '+' : ''}${delta}단계`, color: '#BA7517' }
  return { text: `${delta > 0 ? '+' : ''}${delta}단계`, color: '#A32D2D' }
}

export default function PredictionCard({ prediction, person }: Props) {
  const submitFeedback = useStore((s) => s.submitFeedback)
  const [submitted, setSubmitted] = useState(prediction.actualTier !== null)

  const hasFeedback = prediction.actualTier !== null

  function handleFeedback(tier: Tier) {
    if (submitted || hasFeedback) return
    submitFeedback(prediction.id, tier)
    setSubmitted(true)
  }

  const tierColor = TIER_COLORS[prediction.predictedTier]

  return (
    <div className="bg-white rounded-xl border border-[var(--color-border)] p-4 space-y-3">
      {/* Top: person info */}
      <div className="flex items-center gap-2">
        <span className="font-semibold text-gray-900 text-sm">{person.name}</span>
        <span className="text-xs text-gray-400">{person.group}</span>
      </div>

      {/* Middle: predicted tier + confidence + reasoning */}
      <div className="flex items-start gap-3">
        <span
          className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-sm font-bold shrink-0"
          style={{
            backgroundColor: tierColor.chip,
            color: tierColor.text,
            border: `1.5px solid ${tierColor.border}`,
          }}
        >
          {prediction.predictedTier}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-gray-800">
              {prediction.predictedTier}티어 예측
            </span>
            <span className="text-xs text-gray-400">
              신뢰도 {Math.round(prediction.confidence)}%
            </span>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            {prediction.reasoning}
          </p>
        </div>
      </div>

      {/* Bottom: feedback buttons */}
      <div className="pt-1">
        {hasFeedback || submitted ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {TIER_ORDER.map((tier) => {
                const tc = TIER_COLORS[tier]
                const isActual = prediction.actualTier === tier
                return (
                  <button
                    key={tier}
                    disabled
                    className="w-9 h-9 rounded-lg text-xs font-bold transition-all opacity-50 pointer-events-none"
                    style={
                      isActual
                        ? {
                            backgroundColor: tc.border,
                            color: '#FFFFFF',
                          }
                        : {
                            backgroundColor: tc.bg,
                            color: tc.text,
                          }
                    }
                  >
                    {tier}
                  </button>
                )
              })}
            </div>

            {prediction.delta !== null && (
              <span
                className="text-xs font-medium"
                style={{ color: deltaLabel(prediction.delta).color }}
              >
                {deltaLabel(prediction.delta).text}
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {TIER_ORDER.map((tier) => {
              const tc = TIER_COLORS[tier]
              return (
                <button
                  key={tier}
                  onClick={() => handleFeedback(tier)}
                  className="w-9 h-9 rounded-lg text-xs font-bold transition-all hover:scale-105 active:scale-95"
                  style={{
                    backgroundColor: tc.chip,
                    color: tc.text,
                    border: `1.5px solid ${tc.border}`,
                  }}
                >
                  {tier}
                </button>
              )
            })}
            <span className="text-xs text-gray-400 ml-1">실제 티어를 선택하세요</span>
          </div>
        )}
      </div>
    </div>
  )
}
