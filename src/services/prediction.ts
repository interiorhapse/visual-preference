import type { Person, Prediction, Tier } from '../types'
import { AXIS_KEYS, AXIS_LABELS, type AxisKey } from '../types'
import { gradeToValue, scoreToTier, calcConfidence } from '../utils/grade'

export function predictTier(
  person: Person,
  weights: Record<string, number>,
  placementCount: number,
  sessionId: string,
): Prediction {
  const now = new Date().toISOString()

  // Weighted sum of axis scores
  let weightedSum = 0
  let totalWeight = 0
  const axisContributions: { key: AxisKey; label: string; value: number; weight: number }[] = []

  for (const axis of AXIS_KEYS) {
    const value = gradeToValue(person.axes[axis])
    const weight = weights[axis] ?? 0
    if (value !== null && weight > 0) {
      weightedSum += value * (weight / 100)
      totalWeight += weight / 100
      axisContributions.push({
        key: axis,
        label: AXIS_LABELS[axis],
        value,
        weight,
      })
    }
  }

  const finalScore = totalWeight > 0 ? weightedSum / totalWeight : 0
  const predictedTier: Tier = scoreToTier(finalScore)
  const confidence = calcConfidence(placementCount)

  // Generate reasoning text
  axisContributions.sort((a, b) => b.weight - a.weight)
  const topAxes = axisContributions.slice(0, 3)
  const topDesc = topAxes
    .map((a) => `${a.label}(${a.value}점, 비중 ${a.weight}%)`)
    .join(', ')

  const reasoning =
    `가중합산 점수 ${Math.round(finalScore * 10) / 10}점 → ${predictedTier}티어. ` +
    `주요 축: ${topDesc}. ` +
    `배치 ${placementCount}건 기반 신뢰도 ${confidence}%.`

  return {
    id: crypto.randomUUID(),
    sessionId,
    personId: person.id,
    predictedTier,
    confidence,
    reasoning,
    actualTier: null,
    delta: null,
    createdAt: now,
  }
}
