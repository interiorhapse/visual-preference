import { useState, useEffect, useRef } from 'react'
import { useStore } from '../../store/useStore'
import type { Person, Gender, PersonTag, PersonAxes, Grade, AxisKey } from '../../types'
import { AXIS_KEYS, AXIS_LABELS } from '../../types'
import { GRADES } from '../../utils/grade'
import { searchPersons } from '../../services/search'
import peopleDb from '../../data/people-db.json'

interface Props {
  person?: Person | null
  defaultGender?: Gender
  onClose: () => void
}

const PERFORMANCE_GRADES: (Grade | '-')[] = ['S+', 'S', 'A+', 'A', 'B+', 'B', 'C', '-']

function emptyAxes(): PersonAxes {
  return {
    face: null,
    bodyType: null,
    skinTone: null,
    vibe: null,
    performance: null,
    personality: null,
    skill: null,
  }
}

export default function PersonModal({ person, defaultGender, onClose }: Props) {
  const addPerson = useStore((s) => s.addPerson)
  const updatePerson = useStore((s) => s.updatePerson)
  const deletePerson = useStore((s) => s.deletePerson)
  const persons = useStore((s) => s.persons)

  const isEdit = !!person

  const [name, setName] = useState(person?.name ?? '')
  const [group, setGroup] = useState(person?.group ?? '')
  const [gender, setGender] = useState<Gender>(person?.gender ?? defaultGender ?? 'F')
  const [tag, setTag] = useState<PersonTag>(person?.tag ?? '추가')
  const [axes, setAxes] = useState<PersonAxes>(person?.axes ?? emptyAxes())

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  // People-db typed for search
  const dbPersons = (peopleDb as Array<{ id: string; name: string; group: string; gender: Gender; axes: PersonAxes | null }>)

  // Search results from people-db (exclude already added persons)
  const existingIds = new Set(persons.map((p) => p.id))
  const searchResults = searchQuery.trim()
    ? dbPersons
        .filter((p) => !existingIds.has(p.id))
        .filter((p) => {
          const q = searchQuery.toLowerCase().trim()
          return p.name.toLowerCase().includes(q) || p.group.toLowerCase().includes(q)
        })
        .slice(0, 8)
    : []

  // Click outside to close dropdown
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleSelectFromDb(dbPerson: typeof dbPersons[0]) {
    setName(dbPerson.name)
    setGroup(dbPerson.group)
    setGender(dbPerson.gender)
    if (dbPerson.axes) {
      setAxes(dbPerson.axes)
    }
    setSearchQuery('')
    setShowDropdown(false)
  }

  function setAxisGrade(axis: AxisKey, grade: Grade | '-' | null) {
    setAxes((prev) => ({ ...prev, [axis]: grade }))
  }

  function handleSave() {
    const trimmedName = name.trim()
    const trimmedGroup = group.trim()
    if (!trimmedName) return
    if (trimmedName.length < 2 || trimmedName.length > 20) {
      alert('이름은 2~20자로 입력해주세요.')
      return
    }
    const duplicate = persons.find(
      (p) => p.name === trimmedName && p.group === trimmedGroup && (!person || p.id !== person.id)
    )
    if (duplicate) {
      alert(`"${trimmedName} (${trimmedGroup})"은(는) 이미 등록된 인물입니다.`)
      return
    }

    if (isEdit && person) {
      updatePerson(person.id, {
        name: name.trim(),
        group: group.trim(),
        gender,
        tag,
        axes,
      })
    } else {
      addPerson({
        name: name.trim(),
        group: group.trim(),
        gender,
        tag,
        axes,
        note: null,
      })
    }
    onClose()
  }

  function handleDelete() {
    if (!person) return
    if (!confirm(`${person.name}을(를) 삭제하시겠습니까?`)) return
    deletePerson(person.id)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto shadow-xl">
        <div className="p-5 space-y-4">
          {/* Title */}
          <h2 className="text-base font-bold text-gray-900">
            {isEdit ? '인물 수정' : '인물 추가'}
          </h2>

          {/* Search from people-db (only for add mode) */}
          {!isEdit && (
            <div ref={searchRef} className="relative">
              <input
                type="text"
                placeholder="이름 또는 그룹으로 검색..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setShowDropdown(true)
                }}
                onFocus={() => searchQuery.trim() && setShowDropdown(true)}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400"
              />
              {showDropdown && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[var(--color-border)] rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                  {searchResults.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleSelectFromDb(p)}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 transition-colors"
                    >
                      <span className="font-medium text-gray-900">{p.name}</span>
                      <span className="text-gray-400 text-xs">{p.group}</span>
                      <span className="text-gray-300 text-xs ml-auto">
                        {p.gender === 'M' ? '남' : '여'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">이름</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름"
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400"
            />
          </div>

          {/* Group */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">그룹</label>
            <input
              type="text"
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              placeholder="그룹명"
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400"
            />
          </div>

          {/* Gender toggle */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">성별</label>
            <div className="flex gap-2">
              <button
                onClick={() => setGender('M')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  gender === 'M'
                    ? 'bg-violet-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                남성
              </button>
              <button
                onClick={() => setGender('F')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  gender === 'F'
                    ? 'bg-violet-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                여성
              </button>
            </div>
          </div>

          {/* Tag select */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">태그</label>
            <div className="flex gap-2">
              {(['기존', '예측', '추가'] as PersonTag[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTag(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    tag === t
                      ? 'bg-violet-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Axis grade selectors */}
          <div className="space-y-3">
            <label className="block text-xs font-medium text-gray-600">축별 등급</label>
            {AXIS_KEYS.map((axis) => {
              const isPerformance = axis === 'performance'
              const gradeOptions: (Grade | '-')[] = isPerformance
                ? PERFORMANCE_GRADES
                : GRADES

              return (
                <div key={axis} className="space-y-1">
                  <div className="text-xs text-gray-500">{AXIS_LABELS[axis]}</div>
                  <div className="flex gap-1 flex-wrap">
                    {gradeOptions.map((g) => {
                      const isSelected = axes[axis] === g
                      return (
                        <button
                          key={g}
                          onClick={() =>
                            setAxisGrade(axis, isSelected ? null : g)
                          }
                          className={`px-2 py-1 rounded text-xs font-medium transition-colors min-w-[28px] ${
                            isSelected
                              ? 'bg-violet-600 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {g}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            {isEdit && (
              <button
                onClick={handleDelete}
                className="px-4 py-2.5 bg-red-50 text-red-600 text-sm font-medium rounded-xl hover:bg-red-100 transition-colors"
              >
                삭제
              </button>
            )}
            <div className="flex-1" />
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-gray-100 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={!name.trim()}
              className="px-6 py-2.5 bg-violet-600 text-white text-sm font-medium rounded-xl hover:bg-violet-700 transition-colors disabled:opacity-40 disabled:pointer-events-none"
            >
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
