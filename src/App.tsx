import { useEffect } from 'react'
import { useStore } from './store/useStore'
import Header from './components/layout/Header'
import GenderTabs from './components/layout/GenderTabs'
import FunctionTabs from './components/layout/FunctionTabs'
import TierBoard from './components/tier/TierBoard'
import AnalysisView from './components/analysis/AnalysisView'
import PredictionView from './components/prediction/PredictionView'
import ProfileView from './components/profile/ProfileView'
import SharedResultView from './components/share/SharedResultView'

export default function App() {
  const functionTab = useStore((s) => s.functionTab)
  const initializeData = useStore((s) => s.initializeData)
  const hasShareData = window.location.hash.startsWith('#share=')

  useEffect(() => {
    initializeData()
  }, [initializeData])

  if (hasShareData) {
    return <SharedResultView />
  }

  return (
    <div className="min-h-svh bg-[var(--color-bg)]">
      <Header />

      <div className="px-3 pb-2">
        <GenderTabs />
      </div>

      <div className="pb-20">
        {functionTab === 'placement' && <TierBoard />}
        {functionTab === 'analysis' && <AnalysisView />}
        {functionTab === 'prediction' && <PredictionView />}
        {functionTab === 'profile' && <ProfileView />}
      </div>

      {/* Fixed bottom navigation */}
      <FunctionTabs />
    </div>
  )
}
