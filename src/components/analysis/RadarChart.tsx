import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts'
import { AXIS_KEYS, AXIS_LABELS } from '../../types'
import type { AxisKey, Gender } from '../../types'

interface RadarChartProps {
  radarData: { sTier: number[]; cTier: number[] }
  gender: Gender
  visible?: boolean
}

export default function RadarChart({ radarData, visible = true }: RadarChartProps) {
  const data = AXIS_KEYS.map((key, i) => ({
    axis: AXIS_LABELS[key as AxisKey],
    sTier: radarData.sTier[i] ?? 0,
    cTier: radarData.cTier[i] ?? 0,
  }))

  return (
    <div
      className="transition-all duration-500"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
      }}
    >
      <div className="mb-2 flex items-center justify-center gap-5">
        <span className="flex items-center gap-1.5 text-xs text-gray-600">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-violet-600" />
          S 티어 평균
        </span>
        <span className="flex items-center gap-1.5 text-xs text-gray-600">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-zinc-400" />
          C 티어 평균
        </span>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <RechartsRadarChart data={data} cx="50%" cy="50%" outerRadius="72%">
          <PolarGrid stroke="#E4E4E7" strokeDasharray="3 3" opacity={0.15} />
          <PolarAngleAxis
            dataKey="axis"
            tick={{ fontSize: 11, fontWeight: 600, fill: '#52525B' }}
          />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name="S 티어"
            dataKey="sTier"
            stroke="#7C3AED"
            fill="url(#sTierGradient)"
            fillOpacity={0.2}
            strokeWidth={2}
          />
          <Radar
            name="C 티어"
            dataKey="cTier"
            stroke="#A1A1AA"
            fill="#D4D4D8"
            fillOpacity={0.15}
            strokeWidth={1.5}
          />
          <defs>
            <linearGradient id="sTierGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FBBF24" />
              <stop offset="100%" stopColor="#F472B6" />
            </linearGradient>
          </defs>
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  )
}
