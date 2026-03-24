import { useRef } from 'react'
import { useStore } from '../../store/useStore'
import GenderComparison from './GenderComparison'
import SyncTrend from './SyncTrend'

export default function ProfileView() {
  const placements = useStore((s) => s.placements)
  const predictions = useStore((s) => s.predictions)
  const sessions = useStore((s) => s.sessions)
  const getCurrentAnalysis = useStore((s) => s.getCurrentAnalysis)
  const exportData = useStore((s) => s.exportData)
  const importData = useStore((s) => s.importData)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const maleAnalysis = getCurrentAnalysis('M')
  const femaleAnalysis = getCurrentAnalysis('F')

  // Stats
  const totalPlacements = placements.length
  const totalPredictions = predictions.length
  const withFeedback = predictions.filter((p) => p.actualTier !== null)
  const avgSync =
    withFeedback.length > 0
      ? Math.round(
          (withFeedback.filter((p) => p.delta === 0).length /
            withFeedback.length) *
            100,
        )
      : 0

  function handleExport() {
    const data = exportData()
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `visual-preference-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImport() {
    fileInputRef.current?.click()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string)
        if (!confirm('기존 데이터를 덮어씁니다. 계속할까요?')) return
        importData(data)
      } catch {
        alert('잘못된 파일 형식입니다.')
      }
    }
    reader.readAsText(file)

    // Reset input
    e.target.value = ''
  }

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{totalPlacements}</div>
          <div className="text-xs text-gray-500 mt-1">총 배치</div>
        </div>
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{totalPredictions}</div>
          <div className="text-xs text-gray-500 mt-1">총 예측</div>
        </div>
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-3 text-center">
          <div className="text-2xl font-bold text-violet-600">{avgSync}%</div>
          <div className="text-xs text-gray-500 mt-1">평균 싱크율</div>
        </div>
      </div>

      {/* Gender comparison */}
      {(maleAnalysis || femaleAnalysis) && (
        <GenderComparison
          maleWeights={maleAnalysis?.axisWeights ?? null}
          femaleWeights={femaleAnalysis?.axisWeights ?? null}
        />
      )}

      {/* Sync trend */}
      <SyncTrend predictions={predictions} sessions={sessions} />

      {/* Data management */}
      <div className="flex gap-3">
        <button
          onClick={handleExport}
          className="flex-1 py-2.5 bg-white border border-[var(--color-border)] rounded-xl text-sm text-gray-700 font-medium hover:bg-gray-50 transition-colors"
        >
          내보내기
        </button>
        <button
          onClick={handleImport}
          className="flex-1 py-2.5 bg-white border border-[var(--color-border)] rounded-xl text-sm text-gray-700 font-medium hover:bg-gray-50 transition-colors"
        >
          가져오기
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  )
}
