import { Finding } from '../../types'
import StatusBadge from '../common/StatusBadge'
import Pagination from '../common/Pagination'
import { useState, useEffect, ReactNode } from 'react'
import { findingsApi } from '../../api/findings'
import {
  DndContext,
  DragEndEvent,
  closestCenter,
} from '@dnd-kit/core'
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

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

function DragHandleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-4 h-4 text-gray-400"
    >
      <circle cx="9" cy="5" r="1.5" />
      <circle cx="9" cy="12" r="1.5" />
      <circle cx="9" cy="19" r="1.5" />
      <circle cx="15" cy="5" r="1.5" />
      <circle cx="15" cy="12" r="1.5" />
      <circle cx="15" cy="19" r="1.5" />
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

interface ColumnDef {
  id: string
  label: string
  sortKey?: string
  minWidth?: string
  render: (finding: Finding, ctx: RenderContext) => ReactNode
}

interface RenderContext {
  copiedField: string | null
  onCopy: (fieldId: string, value: string) => void
}

const DEFAULT_COLUMNS: ColumnDef[] = [
  {
    id: 'priority_rank',
    label: 'Priority',
    sortKey: 'priority_rank',
    render: (finding) => <div className="text-sm text-gray-900">{finding.priority_rank}</div>,
  },
  {
    id: 'finding',
    label: 'Finding',
    minWidth: 'min-w-[320px]',
    render: (finding) => (
      <div>
        <div className="font-medium text-gray-900">{finding.title}</div>
        <div className="text-xs text-gray-600 mt-1">{finding.description}</div>
      </div>
    ),
  },
  {
    id: 'category',
    label: 'Category',
    sortKey: 'category',
    render: (finding) => <div className="text-sm text-gray-900 capitalize">{finding.category}</div>,
  },
  {
    id: 'resource',
    label: 'Resource',
    render: (finding, { copiedField, onCopy }) => (
      <div className="text-sm text-gray-900 whitespace-nowrap">
        <button
          type="button"
          onClick={() => onCopy(`resource-${finding.id}`, finding.resource_id)}
          className="bg-transparent border-0 p-0 cursor-pointer hover:underline"
          title="Click to copy"
        >
          {finding.resource_id}
        </button>
        <button
          type="button"
          onClick={() => onCopy(`resource-${finding.id}`, finding.resource_id)}
          className="inline-flex items-center justify-center text-gray-400 hover:text-blue-600 ml-1.5 bg-transparent border-0 p-0 cursor-pointer align-middle"
          title="Copy to clipboard"
          aria-label="Copy"
        >
          <CopyIcon />
        </button>
        {copiedField === `resource-${finding.id}` && (
          <span className="text-xs text-gray-500 ml-2">Copied</span>
        )}
      </div>
    ),
  },
  {
    id: 'aws_account',
    label: 'AWS Account',
    render: (finding, { copiedField, onCopy }) => (
      <div className="text-sm text-gray-900 whitespace-nowrap">
        {finding.aws_account_id ? (
          <>
            <button
              type="button"
              onClick={() => onCopy(`account-${finding.id}`, finding.aws_account_id)}
              className="bg-transparent border-0 p-0 cursor-pointer hover:underline"
              title="Click to copy"
            >
              {finding.aws_account_id}
            </button>
            <button
              type="button"
              onClick={() => onCopy(`account-${finding.id}`, finding.aws_account_id)}
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
      </div>
    ),
  },
  {
    id: 'region',
    label: 'Region',
    sortKey: 'region',
    render: (finding, { copiedField, onCopy }) => (
      <div className="text-sm text-gray-900 whitespace-nowrap">
        <button
          type="button"
          onClick={() => onCopy(`region-${finding.id}`, finding.region)}
          className="bg-transparent border-0 p-0 cursor-pointer hover:underline"
          title="Click to copy"
        >
          {finding.region}
        </button>
        <button
          type="button"
          onClick={() => onCopy(`region-${finding.id}`, finding.region)}
          className="inline-flex items-center justify-center text-gray-400 hover:text-blue-600 ml-1.5 bg-transparent border-0 p-0 cursor-pointer align-middle"
          title="Copy to clipboard"
          aria-label="Copy"
        >
          <CopyIcon />
        </button>
        {copiedField === `region-${finding.id}` && (
          <span className="text-xs text-gray-500 ml-2">Copied</span>
        )}
      </div>
    ),
  },
  {
    id: 'savings',
    label: 'Savings/month',
    sortKey: 'savings',
    render: (finding) => <div className="font-medium text-green-600">${finding.estimated_monthly_savings.toFixed(2)}</div>,
  },
  {
    id: 'risk_level',
    label: 'Risk',
    sortKey: 'risk_level',
    render: (finding) => {
      const getRiskColor = (risk: string) => {
        switch (risk) {
          case 'critical': return 'text-red-600 bg-red-50'
          case 'high': return 'text-orange-600 bg-orange-50'
          case 'medium': return 'text-yellow-600 bg-yellow-50'
          case 'low': return 'text-blue-600 bg-blue-50'
          default: return 'text-gray-600 bg-gray-50'
        }
      }
      return (
        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getRiskColor(finding.risk_level)}`}>
          {finding.risk_level.toUpperCase()}
        </span>
      )
    },
  },
  {
    id: 'first_detected_at',
    label: 'First detected',
    sortKey: 'first_detected_at',
    render: (finding) => <div className="text-sm text-gray-900">{new Date(finding.first_detected_at).toLocaleDateString()}</div>,
  },
]

const STORAGE_KEY = 'findings_column_order'

function useColumnOrder(defaultOrder: string[]) {
  const [order, setOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return defaultOrder
    try {
      const parsed: string[] = JSON.parse(saved)
      const valid = parsed.filter(id => defaultOrder.includes(id))
      const missing = defaultOrder.filter(id => !valid.includes(id))
      return [...valid, ...missing]
    } catch {
      return defaultOrder
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(order))
  }, [order])

  return [order, setOrder] as const
}

function SortableHeaderCell({
  column,
  sortBy,
  sortOrder,
  onSortChange,
}: {
  column: ColumnDef
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  onSortChange?: (column: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const isActive = sortBy === column.id || (column.sortKey && sortBy === column.sortKey)

  return (
    <th
      ref={setNodeRef}
      style={style}
      className={`text-left px-6 py-3 font-semibold text-gray-900 ${column.minWidth || ''} ${isDragging ? 'bg-gray-100' : ''}`}
    >
      <div className="flex items-center gap-2">
        {column.sortKey && onSortChange ? (
          <button
            onClick={() => onSortChange(column.sortKey!)}
            className="flex items-center gap-2 hover:text-gray-600 text-left"
          >
            {column.label}
            <span className={`text-xs ${isActive ? 'text-gray-600' : 'text-gray-300'}`}>
              {isActive ? (sortOrder === 'asc' ? '▲' : '▼') : '◇'}
            </span>
          </button>
        ) : (
          <span>{column.label}</span>
        )}
        <button
          {...attributes}
          {...listeners}
          className="p-1 cursor-grab active:cursor-grabbing hover:text-gray-600"
          title="Drag to reorder"
        >
          <DragHandleIcon />
        </button>
      </div>
    </th>
  )
}

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
  const defaultColumnIds = DEFAULT_COLUMNS.map(c => c.id)
  const [columnOrder, setColumnOrder] = useColumnOrder(defaultColumnIds)

  const handleCopy = async (fieldId: string, value: string) => {
    await navigator.clipboard.writeText(value)
    setCopiedField(fieldId)
    setTimeout(() => setCopiedField(null), 1500)
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = columnOrder.indexOf(active.id as string)
      const newIndex = columnOrder.indexOf(over.id as string)

      if (oldIndex !== -1 && newIndex !== -1) {
        setColumnOrder(arrayMove(columnOrder, oldIndex, newIndex))
      }
    }
  }

  const renderContext: RenderContext = {
    copiedField,
    onCopy: handleCopy,
  }

  const orderedColumns = columnOrder
    .map(id => DEFAULT_COLUMNS.find(c => c.id === id))
    .filter((c): c is ColumnDef => c !== undefined)

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <SortableContext
                  items={columnOrder}
                  strategy={horizontalListSortingStrategy}
                >
                  {orderedColumns.map(column => (
                    <SortableHeaderCell
                      key={column.id}
                      column={column}
                      sortBy={sortBy}
                      sortOrder={sortOrder}
                      onSortChange={onSortChange}
                    />
                  ))}
                </SortableContext>
                <th className="text-left px-6 py-3 font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {findings.length === 0 ? (
                <tr>
                  <td colSpan={orderedColumns.length + 1} className="text-center py-8 text-gray-600">
                    No findings found
                  </td>
                </tr>
              ) : (
                findings.map((finding) => (
                  <tr key={finding.id} className="border-b hover:bg-gray-50">
                    {orderedColumns.map(column => (
                      <td
                        key={`${finding.id}-${column.id}`}
                        className={`px-6 py-4 ${column.minWidth || ''}`}
                      >
                        {column.render(finding, renderContext)}
                      </td>
                    ))}
                    <td className="px-6 py-4">
                      {finding.status === 'ignored' ? (
                        <button
                          onClick={() => handleUnignore(finding.id)}
                          disabled={ignoringId === finding.id}
                          className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
                        >
                          Unignore
                        </button>
                      ) : (
                        <button
                          onClick={() => handleIgnore(finding.id)}
                          disabled={ignoringId === finding.id}
                          className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
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
        </DndContext>
      </div>
      <div className="mt-4">
        <Pagination page={page} pageSize={pageSize} total={total} onPageChange={onPageChange} />
      </div>
    </div>
  )
}
