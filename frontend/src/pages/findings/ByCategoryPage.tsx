import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { findingsApi } from '../../api/findings'
import FindingsTable from '../../components/findings/FindingsTable'

export default function ByCategoryPage() {
  const [page, setPage] = useState(1)
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>()

  const { data: findings, refetch } = useQuery({
    queryKey: ['findings-by-category', page, selectedCategory],
    queryFn: () =>
      findingsApi.list(page, 20, {
        category: selectedCategory,
        status: 'open',
      }),
  })

  const categories = ['cost', 'security']

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Findings by category</h1>

      <div className="flex gap-4 mb-8">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => {
              setSelectedCategory(selectedCategory === cat ? undefined : cat)
              setPage(1)
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:border-gray-400'
            }`}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {findings && findings.findings.length === 0 && selectedCategory === 'security' ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-2">No security findings yet</p>
            <p className="text-gray-500 text-sm">Security checks coming in a future release</p>
          </div>
        ) : findings ? (
          <FindingsTable
            findings={findings.findings}
            total={findings.total}
            page={page}
            pageSize={20}
            onPageChange={setPage}
            onFindingIgnore={() => refetch()}
            onFindingUnignore={() => refetch()}
          />
        ) : null}
      </div>
    </div>
  )
}
