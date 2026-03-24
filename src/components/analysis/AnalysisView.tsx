import { useState, useEffect, useRef } from 'react'
import { useStore } from '../../store/useStore'
import type { Gender } from '../../types'
import FormulaCard from './FormulaCard'
import RadarChart from './RadarChart'
import WeightBar from './WeightBar'
import ClusterCard from './ClusterCard'
import ShareButton from '../shared/ShareButton'

type RevealStage = 0 | 1 | 2 | 3 | 4

export default function AnalysisView() {
  const genderTab = useStore((s) => s.genderTab)
  const getCurrentAnalysis = useStore((s) => s.getCurrentAnalysis)
  const runAnalysis = useStore((s) => s.runAnalysis)
  const persons = useStore((s) => s.persons)

  const gender: Gender = genderTab === 'ALL' ? 'F' : genderTab
  const analysis = getCurrentAnalysis(gender)

  // Track whether this is a fresh analysis (just triggered)
  const [revealStage, setRevealStage] = useState<RevealStage>(4) // 4 = fully revealed (default for existing)
  const [isRevealing, setIsRevealing] = useState(false)
  const prevAnalysisId = useRef<string | null>(null)

  // Detect new analysis result
  useEffect(() => {
    if (!analysis) {
      prevAnalysisId.current = null
      return
    }

    // If analysis ID changed and we were in revealing mode, start the sequence
    if (analysis.id !== prevAnalysisId.current) {
      if (isRevealing) {
        // Start reveal sequence
        setRevealStage(0)

        const t1 = setTimeout(() => setRevealStage(1), 2000)  // Show archetype
        const t2 = setTimeout(() => setRevealStage(2), 2300)  // Show radar
        const t3 = setTimeout(() => setRevealStage(3), 2900)  // Show weights
        const t4 = setTimeout(() => {
          setRevealStage(4)  // Show share button
          setIsRevealing(false)
        }, 3500)

        prevAnalysisId.current = analysis.id

        return () => {
          clearTimeout(t1)
          clearTimeout(t2)
          clearTimeout(t3)
          clearTimeout(t4)
        }
      } else {
        // Existing analysis loaded (page load or tab switch) — show immediately
        prevAnalysisId.current = analysis.id
        setRevealStage(4)
      }
    }
  }, [analysis, isRevealing])

  function handleRunAnalysis() {
    setIsRevealing(true)
    runAnalysis(gender)
  }

  if (!analysis) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 px-6 py-20">
        <div className="text-4xl">
          <svg className="h-10 w-10 text-zinc-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0 1 16.5 7.605" />
          </svg>
        </div>
        <p className="text-center text-sm text-gray-500">
          배치를 완료하고 분석을 시작하세요
        </p>
        <button
          type="button"
          onClick={handleRunAnalysis}
          className="rounded-lg bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-700 active:bg-violet-800"
        >
          분석 실행
        </button>
      </div>
    )
  }

  const genderPersons = persons.filter((p) => p.gender === gender)

  // Loading overlay (stage 0)
  if (revealStage === 0) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">
        <p className="text-lg font-semibold text-zinc-700">
          취향을 분석하고 있어요
          <span className="inline-flex w-6 justify-start">
            <span className="animate-pulse">...</span>
          </span>
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 px-4 pb-8 pt-4">
      <FormulaCard
        formula={analysis.formulaSummary}
        archetype={analysis.archetype}
        weights={analysis.axisWeights}
        visible={revealStage >= 1}
      />

      <section>
        <h3 className="mb-2 text-sm font-semibold text-gray-700">
          축별 레이더
        </h3>
        <div className="rounded-xl border border-[var(--color-border)] bg-white p-4">
          <RadarChart
            radarData={analysis.radarData}
            gender={gender}
            visible={revealStage >= 2}
          />
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-gray-700">
          가중치 분포
        </h3>
        <div className="rounded-xl border border-[var(--color-border)] bg-white p-4">
          <WeightBar
            weights={analysis.axisWeights}
            visible={revealStage >= 3}
          />
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-gray-700">
          S 티어 클러스터
        </h3>
        <ClusterCard clusters={analysis.clusters} persons={genderPersons} />
      </section>

      <ShareButton visible={revealStage >= 4} />
    </div>
  )
}
