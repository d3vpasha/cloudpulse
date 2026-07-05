import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { scansApi } from '../../api/scans'
import { connectionsApi } from '../../api/connections'
import StatusBadge from '../../components/common/StatusBadge'
import Pagination from '../../components/common/Pagination'

export default function ScanHistoryPage() {
  const [page, setPage] = useState(1)
  const [selectedConnection, setSelectedConnection] = useState<string | undefined>()
  const [filterDeleted, setFilterDeleted] = useState(false)

  const { data: connections = [] } = useQuery({
    queryKey: ['connections'],
    queryFn: () => connectionsApi.list(),
  })

  const { data: scans } = useQuery({
    queryKey: ['scans', page, selectedConnection, filterDeleted],
    queryFn: () => scansApi.list(page, filterDeleted ? 1000 : 20, selectedConnection),
  })

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'succeeded': return 'success'
      case 'failed': return 'error'
      case 'running': return 'info'
      case 'partial_failure': return 'warning'
      default: return 'default'
    }
  }

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleString()
  }

  const getFilteredScans = () => {
    if (!scans) return []
    if (!filterDeleted) return scans.scans
    return scans.scans.filter(scan => !connections.find(c => c.id === scan.connection_id))
  }

  const filteredScans = getFilteredScans()

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Scan history</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Filter by connection</label>
          <select
            value={filterDeleted ? 'deleted' : (selectedConnection || '')}
            onChange={(e) => {
              if (e.target.value === 'deleted') {
                setFilterDeleted(true)
                setSelectedConnection(undefined)
              } else {
                setFilterDeleted(false)
                setSelectedConnection(e.target.value || undefined)
              }
              setPage(1)
            }}
            className="border border-gray-300 rounded-lg px-3 py-2 w-full md:w-64"
          >
            <option value="">All connections</option>
            <option value="deleted">Deleted connections</option>
            {connections.map(conn => (
              <option key={conn.id} value={conn.id}>{conn.name}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 font-semibold text-gray-900">Timestamp</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-900">Connection</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-900">Status</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-900">Regions</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-900">Resources</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-900">Findings</th>
              </tr>
            </thead>
            <tbody>
              {!scans || filteredScans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-600">No scans found</td>
                </tr>
              ) : (
                filteredScans.map(scan => {
                  const connection = connections.find(c => c.id === scan.connection_id)
                  const displayName = connection?.name || (scan.connection_name ? `${scan.connection_name} (deleted)` : 'Unknown')
                  return (
                    <tr key={scan.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 text-xs">{formatDate(scan.started_at)}</td>
                      <td className="px-6 py-4 text-sm">{displayName}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={scan.status} variant={getStatusVariant(scan.status)} />
                      </td>
                      <td className="px-6 py-4 text-xs">{scan.regions_scanned.join(', ')}</td>
                      <td className="px-6 py-4 text-sm">{scan.resource_count}</td>
                      <td className="px-6 py-4 text-sm font-medium text-orange-600">{scan.finding_count}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {scans && !filterDeleted && (
          <div className="mt-6">
            <Pagination
              page={page}
              pageSize={20}
              total={scans.total}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  )
}
