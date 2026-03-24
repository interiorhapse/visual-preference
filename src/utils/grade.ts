import type { Grade, Tier } from '../types'

const GRADE_TO_VALUE: Record<Grade, number> = {
  'S+': 100,
  'S': 90,
  'A+': 80,
  'A': 70,
  'B+': 60,
  'B': 50,
  'C': 30,
}

export function gradeToValue(grade: Grade | '-' | null): number | null {
  if (grade === '-' || grade === null) return null
  return GRADE_TO_VALUE[grade]
}

export function scoreToTier(score: number): Tier {
  if (score >= 85) return 'S'
  if (score >= 70) return 'A'
  if (score >= 50) return 'B'
  return 'C'
}

export function tierToValue(tier: Tier): number {
  const map: Record<Tier, number> = { S: 4, A: 3, B: 2, C: 1 }
  return map[tier]
}

export function calcConfidence(placementCount: number): number {
  if (placementCount < 5) return 0
  return Math.min(95, 50 + (placementCount - 5) * 2.5)
}

export const GRADES: Grade[] = ['S+', 'S', 'A+', 'A', 'B+', 'B', 'C']
