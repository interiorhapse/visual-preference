import { useState } from 'react'
import { useStore } from '../../store/useStore'
import type { Gender } from '../../types'
import { MIN_PLACEMENT_FOR_PREDICTION } from '../../utils/constants'
import PredictionCard from './PredictionCard'
import FeedbackSummary from './FeedbackSummary'

export default function PredictionView() {
  const genderTab = useStore((s) => s.genderTab)
  const persons = useStore((s) => s.persons)
  const predictions = useStore((s) => s.predictions)
  const placements = useStore((s) => s.placements)
  const currentSessionId = useStore((s) => s.currentSessionId)
  const getCurrentAnalysis = useStore((s) => s.getCurrentAnalysis)
  const predictTier = useStore((s) => s.predictTier)

  const activeGender: Gender = genderTab === 'ALL' ? 'F' : genderTab
  const sessionId = currentSessionId[activeGender]
  const analysis = getCurrentAnalysis(activeGender)

  const sessionPlacements = placements.filter((p) => p.sessionId === sessionId)
  const placementCount = sessionPlacements.length

  const sessionPredictions = predictions.filter((p) => p.sessionId === sessionId)
  const feedbackCount = sessionPredictions.filter((p) => p.actualTier !== null).length
  const hitCount = sessionPredictions.filter((p) => p.delta === 0).length
  const avgDelta =
    feedbackCount > 0
      ? sessionPredictions
          .filter((p) => p.delta !== null)
          .reduce((sum, p) => sum + Math.abs(p.delta!), 0) / feedbackCount
      : 0

  const allHaveFeedback =
    sessionPredictions.length > 0 &&
    sessionPredictions.every((p) => p.actualTier !== null)

  // Persons available for prediction: same gender, not already predicted in this session
  const predictedPersonIds = new Set(sessionPredictions.map((p) => p.personId))
  const availableForPrediction = persons.filter(
    (p) =>
      p.gender === activeGender &&
      !predictedPersonIds.has(p.id) &&
      !sessionPlacements.some((pl) => pl.personId === p.id),
  )

  const [showPicker, setShowPicker] = useState(false)

  function handleAddPrediction(personId: string) {
    predictTier(personId)
    setShowPicker(false)
  }

  // No analysis
  if (!analysis) {
    return (
      <div className="px-4 py-12 text-center">
        <div className="text-4xl mb-3 opacity-60">&#x1F50D;</div>
        <p className="text-gray-500 text-sm">먼저 분석을 완료해주세요</p>
        <p className="text-gray-400 text-xs mt-1">
          배치 탭에서 인물을 배치한 뒤, 분석 탭에서 분석을 실행하세요.
        </p>
      </div>
    )
  }

  // Not enough placements
  if (placementCount < MIN_PLACEMENT_FOR_PREDICTION) {
    return (
      <div className="px-4 py-12 text-center">
        <div className="text-4xl mb-3 opacity-60">&#x1F4CA;</div>
        <p className="text-gray-500 text-sm">
          {MIN_PLACEMENT_FOR_PREDICTION}명 이상 배치해야 예측이 가능합니다
        </p>
        <p className="text-gray-400 text-xs mt-1">
          현재 {placementCount}명 배치됨
        </p>
      </div>
    )
  }

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Score bar */}
      <div className="bg-white rounded-xl border border-[var(--color-border)] px-4 py-3 flex items-center justify-between">
        <span className="text-sm text-gray-700 font-medium">
          예측 {feedbackCount}/{sessionPredictions.length}
        </span>
        <div className="flex items-center gap-4 text-xs">
          <span className="text-[#0F6E56]">
            적중 {hitCount}
          </span>
          <span className="text-gray-500">
            오차 {Math.round(avgDelta * 10) / 10}
          </span>
        </div>
      </div>

      {/* Prediction cards */}
      {sessionPredictions.map((prediction) => {
        const person = persons.find((p) => p.id === prediction.personId)
        if (!person) return null
        return (
          <PredictionCard
            key={prediction.id}
            prediction={prediction}
            person={person}
          />
        )
      })}

      {/* Feedback summary */}
      {allHaveFeedback && sessionPredictions.length > 0 && (
        <FeedbackSummary predictions={sessionPredictions} />
      )}

      {/* Add person for prediction */}
      {availableForPrediction.length > 0 && (
        <div className="relative">
          <button
            onClick={() => setShowPicker(!showPicker)}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-violet-400 hover:text-violet-600 transition-colors"
          >
            + 예측 대상 추가
          </button>

          {showPicker && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[var(--color-border)] rounded-xl shadow-lg max-h-60 overflow-y-auto z-10">
              {availableForPrediction.map((person) => (
                <button
                  key={person.id}
                  onClick={() => handleAddPrediction(person.id)}
                  className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2 transition-colors"
                >
                  <span className="font-medium text-gray-900">{person.name}</span>
                  <span className="text-gray-400 text-xs">{person.group}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {sessionPredictions.length === 0 && (
        <div className="text-center py-8 text-gray-400 text-sm">
          예측 대상을 추가해보세요
        </div>
      )}
    </div>
  )
}
