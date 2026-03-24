import { useState, useCallback } from 'react'
import { useStore } from '../../store/useStore'
import { buildShareURL } from '../../services/share'
import type { ShareData, Gender, Tier } from '../../types'

interface ShareButtonProps {
  visible?: boolean
}

export default function ShareButton({ visible = true }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  const genderTab = useStore((s) => s.genderTab)
  const getCurrentAnalysis = useStore((s) => s.getCurrentAnalysis)
  const getPlacementsByGender = useStore((s) => s.getPlacementsByGender)

  const handleShare = useCallback(() => {
    const gender: Gender = genderTab === 'ALL' ? 'F' : genderTab
    const analysis = getCurrentAnalysis(gender)
    const placements = getPlacementsByGender(gender)

    const placementsByTier: Record<Tier, string[]> = { S: [], A: [], B: [], C: [] }
    for (const p of placements) {
      placementsByTier[p.tier].push(p.personId)
    }

    const shareData: ShareData = {
      v: 1,
      gender,
      placements: placementsByTier,
      analysis: analysis
        ? {
            weights: analysis.axisWeights,
            clusters: analysis.clusters,
            formula: analysis.formulaSummary,
            archetype: analysis.archetype,
            radar: { s: analysis.radarData.sTier, c: analysis.radarData.cTier },
          }
        : null,
    }

    const url = buildShareURL(shareData)
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [genderTab, getCurrentAnalysis, getPlacementsByGender])

  if (!visible) return null

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        type="button"
        onClick={handleShare}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-700 active:bg-violet-800"
      >
        {copied ? (
          <span className="flex items-center gap-1.5">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            링크 복사 완료!
          </span>
        ) : (
          <span className="flex items-center gap-1.5">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15m0-3-3-3m0 0-3 3m3-3V15"
              />
            </svg>
            결과 공유하기
          </span>
        )}
      </button>
      <p className="text-xs text-zinc-400">친구와 비교해보세요!</p>
    </div>
  )
}
