import { Finding } from '../../types'
import StatusBadge from '../common/StatusBadge'
import Pagination from '../common/Pagination'
import { useState } from 'react'
import { findingsApi } from '../../api/findings'

function CopyIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-3.5 h-3.5"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

interface FindingsTableProps {
  findings: Finding[]
  total: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  onFindingIgnore?: (id: string) => void
  onFindingUnignore?: (id: string) => void
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  onSortChange?: (column: string) => void
}

const SORTABLE_COLUMNS = [
  { key: 'priority_rank', label: 'Priority' },
  { key: 'category', label: 'Category' },
  { key: 'region', label: 'Region' },
  { key: 'savings', label: 'Savings/month' },
  { key: 'risk_level', label: 'Risk' },
  { key: 'first_detected_at', label: 'First detected' },
]

export default function FindingsTable({
  findings,
  total,
  page,
  pageSize,
  onPageChange,
  onFindingIgnore,
  onFindingUnignore,
  sortBy,
  sortOrder,
  onSortChange,
}: FindingsTableProps) {
  const [ignoringId, setIgnoringId] = useState<string | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const renderSortableHeader = (columnKey: string, label: string) => {
    const isActive = sortBy === columnKey
    if (!onSortChange) return <th className="text-left px-6 py-3 font-semibold text-gray-900">{label}</th>

    return (
      <th
        className="text-left px-6 py-3 font-semibold text-gray-900 cursor-pointer select-none hover:bg-gray-100"
        key={columnKey}
      >
        <button
          onClick={() => onSortChange(columnKey)}
          className="flex items-center gap-2 w-full text-left"
        >
          {label}
          <span className={`text-xs ${isActive ? 'text-gray-600' : 'text-gray-300'}`}>
            {isActive ? (sortOrder === 'asc' ? '▲' : '▼') : '◇'}
          </span>
        </button>
      </th>
    )
  }

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

  const handleCopy = async (fieldId: string, value: string) => {
    await navigator.clipboard.writeText(value)
    setCopiedField(fieldId)
    setTimeout(() => setCopiedField(null), 1500)
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {renderSortableHeader('priority_rank', 'Priority')}
              <th className="text-left px-6 py-3 font-semibold text-gray-900 min-w-[320px]">Finding</th>
              {renderSortableHeader('category', 'Category')}
              <th className="text-left px-6 py-3 font-semibold text-gray-900">Resource</th>
              <th className="text-left px-6 py-3 font-semibold text-gray-900">AWS Account</th>
              {renderSortableHeader('region', 'Region')}
              {renderSortableHeader('savings', 'Savings/month')}
              {renderSortableHeader('risk_level', 'Risk')}
              {renderSortableHeader('first_detected_at', 'First detected')}
              <th className="text-left px-6 py-3 font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody>
            {findings.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-8 text-gray-600">
                  No findings found
                </td>
              </tr>
            ) : (
              findings.map((finding) => (
                <tr key={finding.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{finding.priority_rank}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{finding.title}</div>
                    <div className="text-xs text-gray-600 mt-1">{finding.description}</div>
                  </td>
                  <td className="px-6 py-4 capitalize text-sm text-gray-900">{finding.category}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleCopy(`resource-${finding.id}`, finding.resource_id)}
                      className="bg-transparent border-0 p-0 cursor-pointer hover:underline"
                      title="Click to copy"
                    >
                      {finding.resource_id}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy(`resource-${finding.id}`, finding.resource_id)}
                      className="inline-flex items-center justify-center text-gray-400 hover:text-blue-600 ml-1.5 bg-transparent border-0 p-0 cursor-pointer align-middle"
                      title="Copy to clipboard"
                      aria-label="Copy"
                    >
                      <CopyIcon />
                    </button>
                    {copiedField === `resource-${finding.id}` && (
                      <span className="text-xs text-gray-500 ml-2">Copied</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                    {finding.aws_account_id ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleCopy(`account-${finding.id}`, finding.aws_account_id)}
                          className="bg-transparent border-0 p-0 cursor-pointer hover:underline"
                          title="Click to copy"
                        >
                          {finding.aws_account_id}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopy(`account-${finding.id}`, finding.aws_account_id)}
                          className="inline-flex items-center justify-center text-gray-400 hover:text-blue-600 ml-1.5 bg-transparent border-0 p-0 cursor-pointer align-middle"
                          title="Copy to clipboard"
                          aria-label="Copy"
                        >
                          <CopyIcon />
                        </button>
                        {copiedField === `account-${finding.id}` && (
                          <span className="text-xs text-gray-500 ml-2">Copied</span>
                        )}
                      </>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleCopy(`region-${finding.id}`, finding.region)}
                      className="bg-transparent border-0 p-0 cursor-pointer hover:underline"
                      title="Click to copy"
                    >
                      {finding.region}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy(`region-${finding.id}`, finding.region)}
                      className="inline-flex items-center justify-center text-gray-400 hover:text-blue-600 ml-1.5 bg-transparent border-0 p-0 cursor-pointer align-middle"
                      title="Copy to clipboard"
                      aria-label="Copy"
                    >
                      <CopyIcon />
                    </button>
                    {copiedField === `region-${finding.id}` && (
                      <span className="text-xs text-gray-500 ml-2">Copied</span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-medium text-green-600">
                    ${finding.estimated_monthly_savings.toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getRiskColor(finding.risk_level)}`}>
                      {finding.risk_level.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
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
