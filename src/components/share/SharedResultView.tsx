import { useEffect, useState } from 'react'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { parseShareURL } from '../../services/share'
import type { ShareData, Tier, AxisKey } from '../../types'
import { AXIS_KEYS, AXIS_LABELS, TIER_ORDER, TIER_COLORS } from '../../types'

export default function SharedResultView() {
  const [shareData, setShareData] = useState<ShareData | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const data = parseShareURL()
    setShareData(data)
    setLoaded(true)
  }, [])

  function handleStartOwn() {
    window.location.hash = ''
    window.location.reload()
  }

  if (!loaded) {
    return (
      <div className="px-4 py-12 text-center text-sm text-gray-400">
        로딩 중...
      </div>
    )
  }

  if (!shareData) {
    return (
      <div className="px-4 py-12 text-center">
        <p className="text-sm text-gray-500">공유 데이터를 불러올 수 없습니다.</p>
        <button
          onClick={handleStartOwn}
          className="mt-4 px-6 py-2.5 bg-violet-600 text-white text-sm font-medium rounded-xl hover:bg-violet-700 transition-colors"
        >
          내 취향 분석하기
        </button>
      </div>
    )
  }

  const { gender, placements, analysis } = shareData
  const genderLabel = gender === 'M' ? '남성' : '여성'

  // Build placement summary
  const tierCounts: Record<Tier, number> = { S: 0, A: 0, B: 0, C: 0 }
  for (const tier of TIER_ORDER) {
    tierCounts[tier] = placements[tier]?.length ?? 0
  }
  const totalPlaced = Object.values(tierCounts).reduce((s, v) => s + v, 0)

  // Build radar chart data
  const radarData = analysis
    ? AXIS_KEYS.map((key, i) => ({
        axis: AXIS_LABELS[key],
        S: analysis.radar.s[i] ?? 0,
        C: analysis.radar.c[i] ?? 0,
      }))
    : null

  // Build sorted weights
  const sortedWeights = analysis
    ? AXIS_KEYS.map((k) => ({
        key: k,
        label: AXIS_LABELS[k],
        weight: analysis.weights[k] ?? 0,
      })).sort((a, b) => b.weight - a.weight)
    : null

  // Top 3 weights for archetype inline display
  const top3Weights = analysis
    ? Object.entries(analysis.weights)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([key, value]) => ({
          label: AXIS_LABELS[key as AxisKey] ?? key,
          weight: Math.round(value),
        }))
    : null

  return (
    <div className="px-4 py-6 space-y-5">
      {/* Header */}
      <div className="text-center space-y-1">
        <div className="flex items-center justify-center gap-2">
          <svg
            className="w-5 h-5 text-violet-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z"
            />
          </svg>
          <h1 className="text-lg font-bold text-gray-900">취향 분석 결과</h1>
        </div>
        <p className="text-xs text-gray-400">{genderLabel} 아이돌 취향 분석</p>
      </div>

      {/* Archetype card */}
      {analysis?.archetype && (
        <div className="rounded-2xl bg-gradient-to-br from-violet-50 via-white to-violet-50/50 p-6 text-center">
          <div className="mb-2 text-5xl leading-none">{analysis.archetype.emoji}</div>
          <h2 className="mb-1.5 text-2xl font-extrabold tracking-tight text-zinc-900">
            {analysis.archetype.name}
          </h2>
          <p className="mb-4 text-sm text-zinc-500">
            {analysis.archetype.description}
          </p>
          {top3Weights && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-zinc-400">
              {top3Weights.map((item, i) => (
                <span key={item.label}>
                  {i > 0 && <span className="mr-1.5">&middot;</span>}
                  {item.label} {item.weight}%
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Placement summary */}
      <div className="bg-white rounded-xl border border-[var(--color-border)] p-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">
          배치 현황 ({totalPlaced}명)
        </h3>
        <div className="grid grid-cols-4 gap-2">
          {TIER_ORDER.map((tier) => {
            const tc = TIER_COLORS[tier]
            return (
              <div
                key={tier}
                className="rounded-lg p-2.5 text-center"
                style={{ backgroundColor: tc.bg, border: `1px solid ${tc.border}20` }}
              >
                <div className="text-lg font-bold" style={{ color: tc.text }}>
                  {tierCounts[tier]}
                </div>
                <div className="text-xs font-medium" style={{ color: tc.text }}>
                  {tier}티어
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Analysis results */}
      {analysis && (
        <>
          {/* Radar chart */}
          {radarData && (
            <div className="bg-white rounded-xl border border-[var(--color-border)] p-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">
                S티어 vs C티어 레이더
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#E4E4E7" strokeDasharray="3 3" opacity={0.15} />
                    <PolarAngleAxis
                      dataKey="axis"
                      tick={{ fontSize: 11, fontWeight: 600, fill: '#52525B' }}
                    />
                    <PolarRadiusAxis
                      angle={90}
                      domain={[0, 100]}
                      tick={{ fontSize: 9, fill: '#9CA3AF' }}
                    />
                    <Radar
                      name="S티어"
                      dataKey="S"
                      stroke="#7C3AED"
                      fill="url(#sharedSTierGradient)"
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                    <Radar
                      name="C티어"
                      dataKey="C"
                      stroke="#A1A1AA"
                      fill="#D4D4D8"
                      fillOpacity={0.15}
                      strokeWidth={1.5}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: 11 }}
                    />
                    <defs>
                      <linearGradient id="sharedSTierGradient" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#FBBF24" />
                        <stop offset="100%" stopColor="#F472B6" />
                      </linearGradient>
                    </defs>
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Weights */}
          {sortedWeights && (
            <div className="bg-white rounded-xl border border-[var(--color-border)] p-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">
                축별 가중치
              </h3>
              <div className="space-y-2">
                {sortedWeights.map((item) => (
                  <div key={item.key} className="flex items-center gap-3">
                    <span className="text-xs text-gray-600 w-20 shrink-0">
                      {item.label}
                    </span>
                    <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-400 transition-all"
                        style={{ width: `${item.weight}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-10 text-right">
                      {Math.round(item.weight)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Formula */}
          <div className="bg-white rounded-xl border border-[var(--color-border)] p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">취향 공식</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              {analysis.formula}
            </p>
          </div>

          {/* Clusters */}
          {analysis.clusters.length > 0 && (
            <div className="bg-white rounded-xl border border-[var(--color-border)] p-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">
                취향 유형 ({analysis.clusters.length}개)
              </h3>
              <div className="space-y-2">
                {analysis.clusters.map((cluster, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-50"
                  >
                    <span className="text-sm font-medium text-violet-700">
                      {cluster.name}
                    </span>
                    <span className="text-xs text-violet-400">
                      {cluster.memberIds.length}명
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* CTA */}
      <div className="text-center pt-2 pb-4">
        <button
          onClick={handleStartOwn}
          className="px-8 py-3 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 transition-colors shadow-sm"
        >
          내 취향도 분석하기
        </button>
      </div>
    </div>
  )
}
