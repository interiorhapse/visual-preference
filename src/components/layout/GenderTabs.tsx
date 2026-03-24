import { useStore } from '../../store/useStore'
import type { GenderTab } from '../../types'

const TABS: { value: GenderTab; label: string }[] = [
  { value: 'M', label: '남자' },
  { value: 'F', label: '여자' },
  { value: 'ALL', label: '전체' },
]

export default function GenderTabs() {
  const genderTab = useStore((s) => s.genderTab)
  const setGenderTab = useStore((s) => s.setGenderTab)

  return (
    <div className="flex justify-center gap-1 rounded-full bg-zinc-100 p-1">
      {TABS.map((tab) => (
        <button
          key={tab.value}
          onClick={() => setGenderTab(tab.value)}
          className={`rounded-full px-5 h-10 text-sm font-medium transition-all duration-200 ${
            genderTab === tab.value
              ? 'bg-violet-600 text-white shadow-sm'
              : 'text-zinc-500 hover:text-zinc-800'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
