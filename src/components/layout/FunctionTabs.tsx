import { useStore } from '../../store/useStore'
import type { FunctionTab } from '../../types'

const TABS: { value: FunctionTab; label: string; icon: (active: boolean) => JSX.Element }[] = [
  {
    value: 'placement',
    label: '배치',
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    value: 'analysis',
    label: '분석',
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" />
        <path d="M18 17V9" />
        <path d="M13 17V5" />
        <path d="M8 17v-3" />
      </svg>
    ),
  },
  {
    value: 'prediction',
    label: '예측',
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
  },
  {
    value: 'profile',
    label: '프로파일',
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
]

export default function FunctionTabs() {
  const functionTab = useStore((s) => s.functionTab)
  const setFunctionTab = useStore((s) => s.setFunctionTab)

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-zinc-200"
      style={{ boxShadow: '0 -2px 10px rgba(0,0,0,0.05)' }}
    >
      <div className="mx-auto max-w-[500px] flex items-center justify-around pb-[env(safe-area-inset-bottom)]">
        {TABS.map((tab) => {
          const isActive = functionTab === tab.value
          return (
            <button
              key={tab.value}
              onClick={() => setFunctionTab(tab.value)}
              className={`flex flex-col items-center gap-0.5 py-2 px-4 transition-colors ${
                isActive ? 'text-violet-600' : 'text-zinc-400'
              }`}
            >
              {tab.icon(isActive)}
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
