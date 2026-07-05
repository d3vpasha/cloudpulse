import { Finding } from '../../types'
import StatusBadge from '../common/StatusBadge'
import Pagination from '../common/Pagination'
import { useState } from 'react'
import { findingsApi } from '../../api/findings'

interface FindingsTableProps {
  findings: Finding[]
  total: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  onFindingIgnore?: (id: string) => void
  onFindingUnignore?: (id: string) => void
}

export default function FindingsTable({
  findings,
  total,
  page,
  pageSize,
  onPageChange,
  onFindingIgnore,
  onFindingUnignore,
}: FindingsTableProps) {
  const [ignoringId, setIgnoringId] = useState<string | null>(null)

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical': return 'text-red-600 bg-red-50'
      case 'high': return 'text-orange-600 bg-orange-50'
      case 'medium': return 'text-yellow-600 bg-yellow-50'
      case 'low': return 'text-blue-600 bg-blue-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const handleIgnore = async (id: string) => {
    setIgnoringId(id)
    try {
      await findingsApi.ignore(id, 'Ignored from dashboard')
      onFindingIgnore?.(id)
    } catch (error) {
      console.error('Failed to ignore finding', error)
    }
    setIgnoringId(null)
  }

  const handleUnignore = async (id: string) => {
    setIgnoringId(id)
    try {
      await findingsApi.unignore(id)
      onFindingUnignore?.(id)
    } catch (error) {
      console.error('Failed to unignore finding', error)
    }
    setIgnoringId(null)
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-6 py-3 font-semibold text-gray-900">Priority</th>
              <th className="text-left px-6 py-3 font-semibold text-gray-900">Finding</th>
              <th className="text-left px-6 py-3 font-semibold text-gray-900">Category</th>
              <th className="text-left px-6 py-3 font-semibold text-gray-900">Resource</th>
              <th className="text-left px-6 py-3 font-semibold text-gray-900">Region</th>
              <th className="text-left px-6 py-3 font-semibold text-gray-900">Savings/month</th>
              <th className="text-left px-6 py-3 font-semibold text-gray-900">Risk</th>
              <th className="text-left px-6 py-3 font-semibold text-gray-900">First detected</th>
              <th className="text-left px-6 py-3 font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody>
            {findings.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-8 text-gray-600">
                  No findings found
                </td>
              </tr>
            ) : (
              findings.map((finding) => (
                <tr key={finding.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4">{finding.priority_rank}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{finding.title}</div>
                    <div className="text-xs text-gray-600 mt-1">{finding.description}</div>
                  </td>
                  <td className="px-6 py-4 capitalize">{finding.category}</td>
                  <td className="px-6 py-4">
                    <div className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                      {finding.resource_id}
                    </div>
                  </td>
                  <td className="px-6 py-4">{finding.region}</td>
                  <td className="px-6 py-4 font-medium text-green-600">
                    ${finding.estimated_monthly_savings.toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getRiskColor(finding.risk_level)}`}>
                      {finding.risk_level.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-600">
                    {new Date(finding.first_detected_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    {finding.status === 'ignored' ? (
                      <button
                        onClick={() => handleUnignore(finding.id)}
                        disabled={ignoringId === finding.id}
                        className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
                      >
                        Unignore
                      </button>
                    ) : (
                      <button
                        onClick={() => handleIgnore(finding.id)}
                        disabled={ignoringId === finding.id}
                        className="text-xs text-gray-600 hover:text-gray-900 disabled:opacity-50"
                      >
                        Ignore
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-4">
        <Pagination page={page} pageSize={pageSize} total={total} onPageChange={onPageChange} />
      </div>
    </div>
  )
}
