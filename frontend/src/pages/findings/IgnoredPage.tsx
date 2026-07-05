import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { findingsApi } from '../../api/findings'
import FindingsTable from '../../components/findings/FindingsTable'

export default function IgnoredPage() {
  const [page, setPage] = useState(1)

  const { data: findings, refetch } = useQuery({
    queryKey: ['findings-ignored', page],
    queryFn: () =>
      findingsApi.list(page, 20, {
        status: 'ignored',
      }),
  })

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Ignored findings</h1>

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
