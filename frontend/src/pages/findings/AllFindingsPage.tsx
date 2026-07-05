import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { findingsApi } from '../../api/findings'
import FindingsTable from '../../components/findings/FindingsTable'

export default function AllFindingsPage() {
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<{
    status?: string
    risk_level?: string
    search?: string
  }>({})

  const { data: findings, refetch } = useQuery({
    queryKey: ['findings', page, filters],
    queryFn: () =>
      findingsApi.list(page, 20, {
        status: filters.status,
        risk_level: filters.risk_level,
        search: filters.search,
      }),
  })

  const handleStatusChange = (status: string) => {
    setFilters({ ...filters, status: status || undefined })
    setPage(1)
  }

  const handleRiskChange = (risk: string) => {
    setFilters({ ...filters, risk_level: risk || undefined })
    setPage(1)
  }

  const handleSearchChange = (search: string) => {
    setFilters({ ...filters, search: search || undefined })
    setPage(1)
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">All findings</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filters.status || ''}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 w-full"
            >
              <option value="">All</option>
              <option value="open">Open</option>
              <option value="ignored">Ignored</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Risk level</label>
            <select
              value={filters.risk_level || ''}
              onChange={(e) => handleRiskChange(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 w-full"
            >
              <option value="">All</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search by title or description..."
              onChange={(e) => handleSearchChange(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 w-full"
            />
          </div>
        </div>
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
