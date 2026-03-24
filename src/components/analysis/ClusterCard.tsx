import type { Cluster, Person, AxisKey } from '../../types'
import { AXIS_LABELS } from '../../types'

interface ClusterCardProps {
  clusters: Cluster[]
  persons: Person[]
}

export default function ClusterCard({ clusters, persons }: ClusterCardProps) {
  if (clusters.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--color-border)] bg-white px-5 py-8 text-center text-sm text-gray-400">
        S 티어 4명 이상일 때 클러스터가 생성됩니다
      </div>
    )
  }

  const personMap = new Map(persons.map((p) => [p.id, p]))

  return (
    <div className="flex flex-col gap-3">
      {clusters.map((cluster, idx) => {
        const members = cluster.memberIds
          .map((id) => personMap.get(id))
          .filter((p): p is Person => p !== undefined)

        return (
          <div
            key={idx}
            className="rounded-xl border border-[var(--color-border)] bg-white p-4"
          >
            <div className="mb-3">
              <span className="inline-block rounded-full bg-violet-100 px-3 py-1 text-sm font-medium text-violet-700">
                {cluster.name}
              </span>
            </div>

            <div className="mb-2 flex flex-wrap gap-1.5">
              {members.map((person) => (
                <span
                  key={person.id}
                  className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
                >
                  {person.name}
                </span>
              ))}
            </div>

            {cluster.dominantAxes.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {cluster.dominantAxes.map((axis) => (
                  <span
                    key={axis}
                    className="rounded-md bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-600"
                  >
                    {AXIS_LABELS[axis as AxisKey] ?? axis}
                  </span>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
