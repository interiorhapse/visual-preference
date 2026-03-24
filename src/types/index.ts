export type Grade = 'S+' | 'S' | 'A+' | 'A' | 'B+' | 'B' | 'C'
export type Tier = 'S' | 'A' | 'B' | 'C'
export type Gender = 'M' | 'F'
export type PersonTag = '기존' | '예측' | '추가'
export type GenderTab = 'M' | 'F' | 'ALL'
export type FunctionTab = 'placement' | 'analysis' | 'prediction' | 'profile'

export interface PersonAxes {
  face: Grade | null
  bodyType: Grade | null
  skinTone: Grade | null
  vibe: Grade | null
  performance: Grade | '-' | null
  personality: Grade | null
  skill: Grade | null
}

export interface Person {
  id: string
  name: string
  group: string
  gender: Gender
  tag: PersonTag
  axes: PersonAxes
  note: string | null
  createdAt: string
  updatedAt: string
}

export interface TierSession {
  id: string
  name: string
  gender: Gender
  createdAt: string
}

export interface TierPlacement {
  id: string
  sessionId: string
  personId: string
  tier: Tier
  orderInTier: number
  placedAt: string
}

export interface Prediction {
  id: string
  sessionId: string
  personId: string
  predictedTier: Tier
  confidence: number
  reasoning: string
  actualTier: Tier | null
  delta: number | null
  createdAt: string
}

export interface Cluster {
  name: string
  memberIds: string[]
  dominantAxes: string[]
}

export interface Archetype {
  name: string
  emoji: string
  description: string
}

export interface AnalysisResult {
  id: string
  sessionId: string
  gender: Gender
  axisWeights: Record<string, number>
  clusters: Cluster[]
  formulaSummary: string
  archetype: Archetype
  mustHaveAxes: string[]
  radarData: {
    sTier: number[]
    cTier: number[]
  }
  createdAt: string
}

export interface WeightHistory {
  id: string
  sessionId: string
  previousWeights: Record<string, number>
  newWeights: Record<string, number>
  deltaSource: string
  createdAt: string
}

export interface AppData {
  schemaVersion: 2
  persons: Person[]
  sessions: TierSession[]
  placements: TierPlacement[]
  predictions: Prediction[]
  analysisResults: AnalysisResult[]
  weightHistory: WeightHistory[]
}

export interface ShareData {
  v: number
  gender: Gender
  placements: Record<Tier, string[]>  // tier -> personId[]
  analysis: {
    weights: Record<string, number>
    clusters: Cluster[]
    formula: string
    archetype: Archetype
    radar: { s: number[]; c: number[] }
  } | null
}

export const AXIS_KEYS = ['face', 'bodyType', 'skinTone', 'vibe', 'performance', 'personality', 'skill'] as const
export type AxisKey = typeof AXIS_KEYS[number]

export const AXIS_LABELS: Record<AxisKey, string> = {
  face: '얼굴',
  bodyType: '체형/비율',
  skinTone: '피부톤',
  vibe: '분위기/스타일',
  performance: '퍼포먼스',
  personality: '성격/예능감',
  skill: '실력/가창력',
}

export const TIER_ORDER: Tier[] = ['S', 'A', 'B', 'C']

export const TIER_COLORS: Record<Tier, { border: string; bg: string; chip: string; text: string }> = {
  S: { border: '#F59E0B', bg: '#FFFBEB', chip: '#FEF3C7', text: '#92400E' },
  A: { border: '#F43F5E', bg: '#FFF1F2', chip: '#FFE4E6', text: '#9F1239' },
  B: { border: '#06B6D4', bg: '#ECFEFF', chip: '#CFFAFE', text: '#155E75' },
  C: { border: '#10B981', bg: '#ECFDF5', chip: '#D1FAE5', text: '#065F46' },
}
