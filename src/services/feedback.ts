import type { Prediction, Tier, WeightHistory } from '../types'
import { AXIS_KEYS, AXIS_LABELS, type AxisKey } from '../types'
import { tierToValue } from '../utils/grade'
import {
  WEIGHT_ADJUSTMENT_STEP,
  MIN_FEEDBACK_FOR_ADJUSTMENT,
  MIN_SAME_AXIS_FOR_ADJUSTMENT,
} from '../utils/constants'

/**
 * Process a single feedback: mark actual tier, calculate delta.
 */
export function processFeedback(
  prediction: Prediction,
  actualTier: Tier,
): { updatedPrediction: Prediction; shouldAdjust: boolean } {
  const predictedVal = tierToValue(prediction.predictedTier)
  const actualVal = tierToValue(actualTier)
  const delta = actualVal - predictedVal // positive = under-predicted

  const updatedPrediction: Prediction = {
    ...prediction,
    actualTier,
    delta,
  }

  // Should trigger weight adjustment if delta is nonzero
  const shouldAdjust = delta !== 0

  return { updatedPrediction, shouldAdjust }
}

/**
 * Analyze feedback patterns and adjust weights.
 *
 * Logic:
 * - Need at least MIN_FEEDBACK_FOR_ADJUSTMENT completed predictions
 * - Find axes that are systematically over/under-weighted
 * - Adjust by WEIGHT_ADJUSTMENT_STEP, then re-normalize to 100%
 */
export function adjustWeights(
  currentWeights: Record<string, number>,
  predictions: Prediction[],
  sessionId: string,
): { newWeights: Record<string, number>; history: WeightHistory } | null {
  // Only use predictions with feedback
  const withFeedback = predictions.filter(
    (p) => p.actualTier !== null && p.delta !== null && p.delta !== 0,
  )

  if (withFeedback.length < MIN_FEEDBACK_FOR_ADJUSTMENT) {
    return null
  }

  // Count direction of errors per axis
  // If prediction was too low (delta > 0), the model underweights important axes
  // If prediction was too high (delta < 0), the model overweights some axes

  // We need person data to know which axes were strong/weak for the mispredicted persons
  // Since we don't have person data here, we use a simpler heuristic:
  // - Count how many under-predictions vs over-predictions
  // - If mostly under-predicted: boost higher-weighted axes (they differentiate S from lower)
  // - If mostly over-predicted: reduce higher-weighted axes

  const underCount = withFeedback.filter((p) => (p.delta ?? 0) > 0).length
  const overCount = withFeedback.filter((p) => (p.delta ?? 0) < 0).length

  // Direction: +1 means boost top axes, -1 means reduce top axes
  const direction = underCount >= overCount ? 1 : -1

  // Sort axes by current weight descending
  const sorted = AXIS_KEYS
    .map((k) => ({ key: k, weight: currentWeights[k] ?? 0 }))
    .sort((a, b) => b.weight - a.weight)

  // Pick top MIN_SAME_AXIS_FOR_ADJUSTMENT axes to adjust
  const toAdjust = sorted.slice(0, MIN_SAME_AXIS_FOR_ADJUSTMENT).map((a) => a.key)

  const newWeights = { ...currentWeights }

  // Apply adjustment
  for (const axis of toAdjust) {
    newWeights[axis] = Math.max(0, newWeights[axis] + direction * WEIGHT_ADJUSTMENT_STEP)
  }

  // Re-normalize to 100%
  const total = Object.values(newWeights).reduce((s, v) => s + v, 0)
  if (total > 0) {
    for (const axis of AXIS_KEYS) {
      newWeights[axis] = Math.round((newWeights[axis] / total) * 10000) / 100
    }
  }

  const deltaSource = `피드백 ${withFeedback.length}건 분석 (과소평가 ${underCount}건, 과대평가 ${overCount}건) → ` +
    `${toAdjust.map((a) => AXIS_LABELS[a as AxisKey]).join(', ')} ${direction > 0 ? '강화' : '약화'}`

  const history: WeightHistory = {
    id: crypto.randomUUID(),
    sessionId,
    previousWeights: { ...currentWeights },
    newWeights: { ...newWeights },
    deltaSource,
    createdAt: new Date().toISOString(),
  }

  return { newWeights, history }
}
