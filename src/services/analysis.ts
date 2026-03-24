import type {
  Person,
  TierPlacement,
  AnalysisResult,
  Archetype,
  Cluster,
  AxisKey,
  Tier,
} from '../types'
import { AXIS_KEYS, AXIS_LABELS } from '../types'
import { gradeToValue } from '../utils/grade'
import { MIN_S_FOR_CLUSTER, MAX_CLUSTERS } from '../utils/constants'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mean(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((s, v) => s + v, 0) / values.length
}

function stddev(values: number[]): number {
  if (values.length < 2) return 0
  const m = mean(values)
  const variance = values.reduce((s, v) => s + (v - m) ** 2, 0) / values.length
  return Math.sqrt(variance)
}

/** Euclidean distance between two numeric vectors */
function euclidean(a: number[], b: number[]): number {
  return Math.sqrt(a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0))
}

/** Extract numeric axis vector from a Person (null → 0) */
function axisVector(person: Person): number[] {
  return AXIS_KEYS.map((k) => gradeToValue(person.axes[k]) ?? 0)
}

// ---------------------------------------------------------------------------
// K-means (simple)
// ---------------------------------------------------------------------------

interface KMeansResult {
  labels: number[]
  centroids: number[][]
}

function kMeans(points: number[][], k: number, maxIter = 30): KMeansResult {
  const n = points.length
  if (n === 0 || n < k) return { labels: Array(n).fill(0), centroids: [] }
  const dim = points[0].length

  // Deterministic init: pick evenly spaced indices
  const centroids: number[][] = []
  for (let i = 0; i < k; i++) {
    const idx = Math.floor((i * n) / k)
    centroids.push([...points[idx]])
  }

  let labels = new Array<number>(n).fill(0)

  for (let iter = 0; iter < maxIter; iter++) {
    // Assign
    const newLabels = points.map((p) => {
      let bestDist = Infinity
      let bestIdx = 0
      for (let c = 0; c < k; c++) {
        const d = euclidean(p, centroids[c])
        if (d < bestDist) {
          bestDist = d
          bestIdx = c
        }
      }
      return bestIdx
    })

    // Check convergence
    const changed = newLabels.some((l, i) => l !== labels[i])
    labels = newLabels
    if (!changed) break

    // Update centroids
    for (let c = 0; c < k; c++) {
      const members = points.filter((_, i) => labels[i] === c)
      if (members.length === 0) continue
      for (let d = 0; d < dim; d++) {
        centroids[c][d] = mean(members.map((m) => m[d]))
      }
    }
  }

  return { labels, centroids }
}

/** Silhouette score for a clustering result */
function silhouetteScore(points: number[][], labels: number[]): number {
  const n = points.length
  if (n < 2) return 0

  const k = Math.max(...labels) + 1
  const scores: number[] = []

  for (let i = 0; i < n; i++) {
    // a(i) = mean distance to own cluster
    const ownCluster = points.filter((_, j) => j !== i && labels[j] === labels[i])
    const a = ownCluster.length > 0 ? mean(ownCluster.map((p) => euclidean(points[i], p))) : 0

    // b(i) = min mean distance to other clusters
    let b = Infinity
    for (let c = 0; c < k; c++) {
      if (c === labels[i]) continue
      const otherCluster = points.filter((_, j) => labels[j] === c)
      if (otherCluster.length === 0) continue
      const meanDist = mean(otherCluster.map((p) => euclidean(points[i], p)))
      if (meanDist < b) b = meanDist
    }
    if (!isFinite(b)) b = 0

    const s = a === 0 && b === 0 ? 0 : (b - a) / Math.max(a, b)
    scores.push(s)
  }

  return mean(scores)
}

// ---------------------------------------------------------------------------
// Archetype naming
// ---------------------------------------------------------------------------

const ARCHETYPE_MAP: Record<string, { name: string; emoji: string; desc: string }> = {
  'face+bodyType': { name: '비주얼 절대주의자', emoji: '\u{1F451}', desc: '얼굴과 체형, 비주얼의 정석을 추구하는 당신' },
  'face+skinTone': { name: '맑은 피부 감정가', emoji: '\u2728', desc: '투명한 피부에 단정한 얼굴, 청순함에 약한 당신' },
  'face+vibe': { name: '분위기 미식가', emoji: '\u{1F319}', desc: '얼굴도 중요하지만 결국 분위기에 빠지는 당신' },
  'face+performance': { name: '무대 위 비주얼 헌터', emoji: '\u{1F525}', desc: '예쁜 얼굴이 춤추는 순간에 반하는 당신' },
  'face+personality': { name: '매력 종합평가단', emoji: '\u{1F498}', desc: '얼굴에 끌리고 성격에 빠지는 당신' },
  'face+skill': { name: '얼굴천재 감정가', emoji: '\u{1F3AD}', desc: '비주얼에 실력까지? 완벽주의 취향' },
  'bodyType+skinTone': { name: '청순 글래머 수집가', emoji: '\u{1F9A2}', desc: '하얀 피부에 좋은 비율, 그게 국룰인 당신' },
  'bodyType+vibe': { name: '롱레그 분위기파', emoji: '\u{1F33F}', desc: '비율 좋고 분위기 있으면 끝인 당신' },
  'bodyType+face': { name: '비주얼 절대주의자', emoji: '\u{1F451}', desc: '얼굴과 체형, 비주얼의 정석을 추구하는 당신' },
  'bodyType+performance': { name: '비율+무대 감별사', emoji: '\u{1F483}', desc: '비율 좋은 사람이 춤추면 끝인 당신' },
  'bodyType+personality': { name: '매력 체형파', emoji: '\u{1F338}', desc: '좋은 비율에 좋은 성격이면 완벽인 당신' },
  'bodyType+skill': { name: '실력파 비율 감정가', emoji: '\u{1F3AF}', desc: '비율 좋은데 실력까지? 그게 S인 당신' },
  'skinTone+face': { name: '맑은 피부 감정가', emoji: '\u2728', desc: '투명한 피부에 단정한 얼굴, 청순함에 약한 당신' },
  'skinTone+bodyType': { name: '청순 글래머 수집가', emoji: '\u{1F9A2}', desc: '하얀 피부에 좋은 비율, 그게 국룰인 당신' },
  'skinTone+vibe': { name: '분위기 순수주의자', emoji: '\u{1FAE7}', desc: '맑은 피부와 자연스러운 분위기의 조화를 사랑하는 당신' },
  'skinTone+performance': { name: '순수+무대 매니아', emoji: '\u{1F31F}', desc: '깨끗한 피부로 무대를 빛내는 사람에게 약한 당신' },
  'skinTone+personality': { name: '청순 성격파', emoji: '\u{1F495}', desc: '맑은 피부에 성격까지 좋으면 사랑인 당신' },
  'skinTone+skill': { name: '실력+피부 감정가', emoji: '\u{1F48E}', desc: '맑은 피부에 실력까지 겸비한 사람만 S인 당신' },
  'vibe+face': { name: '분위기 미식가', emoji: '\u{1F319}', desc: '얼굴도 중요하지만 결국 분위기에 빠지는 당신' },
  'vibe+bodyType': { name: '롱레그 분위기파', emoji: '\u{1F33F}', desc: '비율 좋고 분위기 있으면 끝인 당신' },
  'vibe+skinTone': { name: '분위기 순수주의자', emoji: '\u{1FAE7}', desc: '맑은 피부와 자연스러운 분위기의 조화를 사랑하는 당신' },
  'vibe+performance': { name: '카리스마 감지기', emoji: '\u26A1', desc: '무대 위 오라가 다른 사람을 알아보는 당신' },
  'vibe+personality': { name: '무드 감별사', emoji: '\u{1F30A}', desc: '분위기와 성격의 조화가 중요한 당신' },
  'vibe+skill': { name: '분위기+실력 감정가', emoji: '\u{1F3B6}', desc: '분위기 있으면서 실력까지? 그게 최애인 당신' },
  'performance+face': { name: '무대 위 비주얼 헌터', emoji: '\u{1F525}', desc: '예쁜 얼굴이 춤추는 순간에 반하는 당신' },
  'performance+bodyType': { name: '비율+무대 감별사', emoji: '\u{1F483}', desc: '비율 좋은 사람이 춤추면 끝인 당신' },
  'performance+skinTone': { name: '순수+무대 매니아', emoji: '\u{1F31F}', desc: '깨끗한 피부로 무대를 빛내는 사람에게 약한 당신' },
  'performance+vibe': { name: '카리스마 감지기', emoji: '\u26A1', desc: '무대 위 오라가 다른 사람을 알아보는 당신' },
  'performance+personality': { name: '무대 매력 감별사', emoji: '\u{1F3A4}', desc: '무대에서 빛나고 성격도 좋으면 최고인 당신' },
  'performance+skill': { name: '실력파 올인러', emoji: '\u{1F3A4}', desc: '춤이든 노래든, 잘하는 사람이 최고인 당신' },
  'personality+face': { name: '반전매력 탐정', emoji: '\u{1F50D}', desc: '예쁜 얼굴 뒤에 숨은 반전 성격에 빠지는 당신' },
  'personality+bodyType': { name: '매력 체형파', emoji: '\u{1F338}', desc: '좋은 비율에 좋은 성격이면 완벽인 당신' },
  'personality+skinTone': { name: '청순 성격파', emoji: '\u{1F495}', desc: '맑은 피부에 성격까지 좋으면 사랑인 당신' },
  'personality+vibe': { name: '무드 감별사', emoji: '\u{1F30A}', desc: '분위기와 성격의 조화가 중요한 당신' },
  'personality+performance': { name: '무대 매력 감별사', emoji: '\u{1F3A4}', desc: '무대에서 빛나고 성격도 좋으면 최고인 당신' },
  'personality+skill': { name: '덕질 완성형 감별사', emoji: '\u{1F3C6}', desc: '성격 좋고 실력까지 되면 평생 최애인 당신' },
  'skill+face': { name: '재능+미모 동시감별사', emoji: '\u{1F48E}', desc: '잘하면서 예쁘기까지? 그런 사람만 S인 당신' },
  'skill+bodyType': { name: '실력파 비율 감정가', emoji: '\u{1F3AF}', desc: '비율 좋은데 실력까지? 그게 S인 당신' },
  'skill+skinTone': { name: '실력+피부 감정가', emoji: '\u{1F48E}', desc: '맑은 피부에 실력까지 겸비한 사람만 S인 당신' },
  'skill+vibe': { name: '분위기+실력 감정가', emoji: '\u{1F3B6}', desc: '분위기 있으면서 실력까지? 그게 최애인 당신' },
  'skill+performance': { name: '실력파 올인러', emoji: '\u{1F3A4}', desc: '춤이든 노래든, 잘하는 사람이 최고인 당신' },
  'skill+personality': { name: '덕질 완성형 감별사', emoji: '\u{1F3C6}', desc: '성격 좋고 실력까지 되면 평생 최애인 당신' },
}

export function generateArchetype(weights: Record<string, number>): Archetype {
  const sorted = Object.entries(weights).sort((a, b) => b[1] - a[1])
  const [top1] = sorted[0]
  const [top2] = sorted[1]

  const key = `${top1}+${top2}`
  const match = ARCHETYPE_MAP[key]

  if (match) {
    return { name: match.name, emoji: match.emoji, description: match.desc }
  }

  return { name: '\uCDE8\uD5A5 \uD0D0\uD5D8\uAC00', emoji: '\u{1F9ED}', description: '\uC544\uC9C1 \uD328\uD134\uC774 \uD615\uC131 \uC911\uC778 \uB2F9\uC2E0, \uB354 \uB9CE\uC740 \uBC30\uCE58\uAC00 \uD544\uC694\uD574\uC694' }
}

// ---------------------------------------------------------------------------
// Cluster labeling
// ---------------------------------------------------------------------------

function labelCluster(
  members: Person[],
  _axisWeights: Record<string, number>,
): { name: string; dominantAxes: string[] } {
  // Find top 2 axes by average score within cluster
  const axisAvgs = AXIS_KEYS.map((k) => {
    const vals = members
      .map((p) => gradeToValue(p.axes[k]))
      .filter((v): v is number => v !== null)
    return { key: k, avg: vals.length > 0 ? mean(vals) : 0 }
  })

  axisAvgs.sort((a, b) => b.avg - a.avg)
  const top2 = axisAvgs.slice(0, 2)
  const dominantAxes = top2.map((a) => a.key)
  const name = top2.map((a) => AXIS_LABELS[a.key as AxisKey]).join('+') + '형'

  return { name, dominantAxes }
}

// ---------------------------------------------------------------------------
// Main analysis
// ---------------------------------------------------------------------------

export function analyzePreferences(
  persons: Person[],
  placements: TierPlacement[],
): AnalysisResult {
  const now = new Date().toISOString()

  // Build person lookup
  const personMap = new Map(persons.map((p) => [p.id, p]))

  // Group persons by tier
  const tierGroups: Record<Tier, Person[]> = { S: [], A: [], B: [], C: [] }
  for (const pl of placements) {
    const person = personMap.get(pl.personId)
    if (person) {
      tierGroups[pl.tier].push(person)
    }
  }

  // Detect gender from first placement
  const firstPerson = placements.length > 0 ? personMap.get(placements[0].personId) : undefined
  const gender = firstPerson?.gender ?? 'F'

  // Session from first placement
  const sessionId = placements.length > 0 ? placements[0].sessionId : ''

  // 1. Calculate axis weights: diff = S_avg - C_avg per axis
  const rawDiffs: Record<string, number> = {}
  const sTierRadar: number[] = []
  const cTierRadar: number[] = []

  for (const axis of AXIS_KEYS) {
    const sValues = tierGroups.S
      .map((p) => gradeToValue(p.axes[axis]))
      .filter((v): v is number => v !== null)
    const cValues = tierGroups.C
      .map((p) => gradeToValue(p.axes[axis]))
      .filter((v): v is number => v !== null)

    const sAvg = sValues.length > 0 ? mean(sValues) : 0
    const cAvg = cValues.length > 0 ? mean(cValues) : 0

    sTierRadar.push(sAvg)
    cTierRadar.push(cAvg)

    if (cValues.length === 0) {
      // Use S-tier standard deviation as proxy for importance
      rawDiffs[axis] = sValues.length > 0 ? stddev(sValues) : 0
    } else {
      rawDiffs[axis] = Math.abs(sAvg - cAvg)
    }
  }

  // Normalize to 100%
  const totalDiff = Object.values(rawDiffs).reduce((s, v) => s + v, 0)
  const axisWeights: Record<string, number> = {}
  for (const axis of AXIS_KEYS) {
    axisWeights[axis] = totalDiff > 0
      ? Math.round((rawDiffs[axis] / totalDiff) * 10000) / 100
      : Math.round(10000 / AXIS_KEYS.length) / 100
  }

  // 2. Clusters (S-tier only, 4+ members)
  const clusters: Cluster[] = []
  const sTierPersons = tierGroups.S

  if (sTierPersons.length >= MIN_S_FOR_CLUSTER) {
    const points = sTierPersons.map(axisVector)

    // Try k=2 and k=3, pick best silhouette
    let bestResult: KMeansResult | null = null
    let bestScore = -1
    let bestK = 2

    for (let k = 2; k <= Math.min(MAX_CLUSTERS, sTierPersons.length - 1); k++) {
      const result = kMeans(points, k)
      const score = silhouetteScore(points, result.labels)
      if (score > bestScore) {
        bestScore = score
        bestResult = result
        bestK = k
      }
    }

    if (bestResult) {
      for (let c = 0; c < bestK; c++) {
        const memberPersons = sTierPersons.filter((_, i) => bestResult!.labels[i] === c)
        if (memberPersons.length === 0) continue

        const { name, dominantAxes } = labelCluster(memberPersons, axisWeights)
        clusters.push({
          name,
          memberIds: memberPersons.map((p) => p.id),
          dominantAxes,
        })
      }
    }
  }

  // 3. Must-have axes: ALL S-tier members score A (70)+
  const mustHaveAxes: string[] = []
  for (const axis of AXIS_KEYS) {
    if (sTierPersons.length === 0) continue
    const allAboveA = sTierPersons.every((p) => {
      const val = gradeToValue(p.axes[axis])
      return val !== null && val >= 70
    })
    if (allAboveA) {
      mustHaveAxes.push(axis)
    }
  }

  // 4. Formula summary
  const sortedWeights = AXIS_KEYS
    .map((k) => ({ key: k, weight: axisWeights[k] }))
    .sort((a, b) => b.weight - a.weight)

  const top2Labels = sortedWeights
    .slice(0, 2)
    .map((w) => AXIS_LABELS[w.key as AxisKey])

  const clusterLabel = clusters.length > 0
    ? clusters.map((c) => c.name).join(' / ')
    : '단일 그룹'

  const formulaSummary =
    `"${top2Labels[0]}" + "${top2Labels[1] ?? '?'}" 중심의 ${clusterLabel} 취향`

  // 5. Generate archetype
  const archetype = generateArchetype(axisWeights)

  return {
    id: crypto.randomUUID(),
    sessionId,
    gender,
    axisWeights,
    clusters,
    formulaSummary,
    archetype,
    mustHaveAxes,
    radarData: {
      sTier: sTierRadar,
      cTier: cTierRadar,
    },
    createdAt: now,
  }
}
