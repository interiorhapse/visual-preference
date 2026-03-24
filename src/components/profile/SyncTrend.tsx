import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { Prediction, TierSession } from '../../types'

interface Props {
  predictions: Prediction[]
  sessions: TierSession[]
}

export default function SyncTrend({ predictions, sessions }: Props) {
  const sessionMap = new Map(sessions.map((s) => [s.id, s]))

  // Group predictions by session, only those with feedback
  const withFeedback = predictions.filter((p) => p.actualTier !== null)

  const sessionGroups = new Map<string, Prediction[]>()
  for (const pred of withFeedback) {
    const group = sessionGroups.get(pred.sessionId) ?? []
    group.push(pred)
    sessionGroups.set(pred.sessionId, group)
  }

  // Build chart data
  const chartData: { name: string; accuracy: number }[] = []
  let roundIndex = 1

  for (const [sessionId, preds] of sessionGroups) {
    const session = sessionMap.get(sessionId)
    const total = preds.length
    const hits = preds.filter((p) => p.delta === 0).length
    const accuracy = total > 0 ? Math.round((hits / total) * 100) : 0

    chartData.push({
      name: session?.name ?? `라운드 ${roundIndex}`,
      accuracy,
    })
    roundIndex++
  }

  if (chartData.length < 2) {
    return (
      <div className="bg-white rounded-xl border border-[var(--color-border)] p-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">싱크 추이</h3>
        <div className="py-8 text-center">
          <p className="text-sm text-gray-400">
            피드백 데이터가 쌓이면 추이가 표시됩니다
          </p>
          <p className="text-xs text-gray-300 mt-1">
            최소 2개 세션의 피드백이 필요합니다
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-[var(--color-border)] p-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-3">싱크 추이</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
              axisLine={{ stroke: '#E4E4E7' }}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
              axisLine={{ stroke: '#E4E4E7' }}
              tickLine={false}
              tickFormatter={(v: number) => `${v}%`}
            />
            <Tooltip
              formatter={(value) => [`${value}%`, '적중률']}
              contentStyle={{
                borderRadius: 8,
                border: '1px solid #E4E4E7',
                fontSize: 12,
              }}
            />
            <Line
              type="monotone"
              dataKey="accuracy"
              stroke="#7C3AED"
              strokeWidth={2}
              dot={{ fill: '#7C3AED', r: 4 }}
              activeDot={{ r: 6, fill: '#7C3AED' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
