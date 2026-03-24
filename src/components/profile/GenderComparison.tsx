import { AXIS_KEYS, AXIS_LABELS } from '../../types'

interface Props {
  maleWeights: Record<string, number> | null
  femaleWeights: Record<string, number> | null
}

export default function GenderComparison({ maleWeights, femaleWeights }: Props) {
  const hasBoth = maleWeights !== null && femaleWeights !== null
  const singleGender = maleWeights ? 'M' : 'F'
  const singleWeights = maleWeights ?? femaleWeights

  if (!singleWeights) return null

  const maxWeight = Math.max(
    ...AXIS_KEYS.map((k) => {
      const mVal = maleWeights?.[k] ?? 0
      const fVal = femaleWeights?.[k] ?? 0
      return Math.max(mVal, fVal)
    }),
  )
  const barScale = maxWeight > 0 ? 100 / maxWeight : 1

  return (
    <div className="bg-white rounded-xl border border-[var(--color-border)] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">성별 가중치 비교</h3>
        {hasBoth ? (
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-violet-500" />
              남성
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              여성
            </span>
          </div>
        ) : (
          <span className="text-xs text-gray-400">
            {singleGender === 'M' ? '남성' : '여성'} 분석만 완료
          </span>
        )}
      </div>

      <div className="space-y-2.5">
        {AXIS_KEYS.map((axis) => {
          const mVal = maleWeights?.[axis] ?? 0
          const fVal = femaleWeights?.[axis] ?? 0

          return (
            <div key={axis} className="space-y-1">
              <div className="text-xs text-gray-600 text-center font-medium">
                {AXIS_LABELS[axis]}
              </div>

              {hasBoth ? (
                <div className="flex items-center gap-1">
                  {/* Male bar (right-aligned) */}
                  <div className="flex-1 flex justify-end">
                    <div className="relative h-5 w-full">
                      <div
                        className="absolute right-0 top-0 h-full rounded-l-md bg-violet-500/80 transition-all"
                        style={{ width: `${mVal * barScale}%` }}
                      />
                      {mVal > 0 && (
                        <span className="absolute right-1 top-0.5 text-[10px] text-white font-medium">
                          {Math.round(mVal)}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Center divider */}
                  <div className="w-px h-5 bg-gray-200 shrink-0" />

                  {/* Female bar (left-aligned) */}
                  <div className="flex-1">
                    <div className="relative h-5 w-full">
                      <div
                        className="absolute left-0 top-0 h-full rounded-r-md bg-rose-400/80 transition-all"
                        style={{ width: `${fVal * barScale}%` }}
                      />
                      {fVal > 0 && (
                        <span className="absolute left-1 top-0.5 text-[10px] text-white font-medium">
                          {Math.round(fVal)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* Single gender bar */
                <div className="relative h-5 w-full bg-gray-100 rounded-md overflow-hidden">
                  <div
                    className="absolute left-0 top-0 h-full rounded-md transition-all"
                    style={{
                      width: `${(singleWeights[axis] ?? 0) * barScale}%`,
                      backgroundColor:
                        singleGender === 'M'
                          ? 'rgb(124, 58, 237)'
                          : 'rgb(236, 72, 153)',
                    }}
                  />
                  {(singleWeights[axis] ?? 0) > 0 && (
                    <span className="absolute left-1.5 top-0.5 text-[10px] text-white font-medium">
                      {Math.round(singleWeights[axis])}%
                    </span>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
