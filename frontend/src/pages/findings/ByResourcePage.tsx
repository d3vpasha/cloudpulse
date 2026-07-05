import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { findingsApi } from '../../api/findings'
import FindingsTable from '../../components/findings/FindingsTable'

export default function ByResourcePage() {
  const [page, setPage] = useState(1)
  const [selectedResource, setSelectedResource] = useState<string | undefined>()

  const { data: findings, refetch } = useQuery({
    queryKey: ['findings-by-resource', page, selectedResource],
    queryFn: () =>
      findingsApi.list(page, 20, {
        resource_group: selectedResource,
        status: 'open',
      }),
  })

  const resourceTypes = ['storage', 'network', 'compute']

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Findings by resource</h1>

      <div className="flex gap-4 mb-8">
        {resourceTypes.map(type => (
          <button
            key={type}
            onClick={() => {
              setSelectedResource(selectedResource === type ? undefined : type)
              setPage(1)
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedResource === type
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:border-gray-400'
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {findings && (
          <FindingsTable
            findings={findings.findings}
            total={findings.total}
            page={page}
            pageSize={20}
            onPageChange={setPage}
            onFindingIgnore={() => refetch()}
            onFindingUnignore={() => refetch()}
          />
        )}
      </div>
    </div>
  )
}
