import { Finding } from '../../types'
import StatusBadge from '../common/StatusBadge'
import Pagination from '../common/Pagination'
import { useState, useEffect, ReactNode, PointerEvent as ReactPointerEvent } from 'react'
import { findingsApi } from '../../api/findings'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
} from '@dnd-kit/core'
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
  useSortable,
} from '@dnd-kit/sortable'

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
  defaultWidth: number
  render: (finding: Finding, ctx: RenderContext) => ReactNode
}

interface RenderContext {
  copiedField: string | null
  onCopy: (fieldId: string, value: string) => void
}

function CopyableCell({
  value,
  fieldId,
  copiedField,
  onCopy,
}: {
  value: string
  fieldId: string
} & RenderContext) {
  return (
    <div className="flex items-center gap-1.5 min-w-0 text-sm text-gray-900">
      <button
        type="button"
        onClick={() => onCopy(fieldId, value)}
        className="bg-transparent border-0 p-0 cursor-pointer hover:underline truncate min-w-0"
        title={value}
      >
        {value}
      </button>
      <button
        type="button"
        onClick={() => onCopy(fieldId, value)}
        className="inline-flex items-center justify-center shrink-0 text-gray-400 hover:text-blue-600 bg-transparent border-0 p-0 cursor-pointer"
        title="Copy to clipboard"
        aria-label="Copy"
      >
        <CopyIcon />
      </button>
      {copiedField === fieldId && <span className="text-xs text-gray-500 shrink-0">Copied</span>}
    </div>
  )
}

const DEFAULT_COLUMNS: ColumnDef[] = [
  {
    id: 'priority_rank',
    label: 'Priority',
    sortKey: 'priority_rank',
    defaultWidth: 90,
    render: (finding) => <div className="text-sm text-gray-900 truncate">{finding.priority_rank}</div>,
  },
  {
    id: 'finding',
    label: 'Finding',
    defaultWidth: 340,
    render: (finding) => (
      <div className="min-w-0">
        <div className="font-medium text-gray-900 truncate" title={finding.title}>{finding.title}</div>
        <div className="text-xs text-gray-600 mt-1 truncate" title={finding.description}>{finding.description}</div>
      </div>
    ),
  },
  {
    id: 'category',
    label: 'Category',
    sortKey: 'category',
    defaultWidth: 130,
    render: (finding) => <div className="text-sm text-gray-900 capitalize truncate">{finding.category}</div>,
  },
  {
    id: 'resource',
    label: 'Resource',
    defaultWidth: 230,
    render: (finding, { copiedField, onCopy }) => (
      <CopyableCell
        value={finding.resource_id}
        fieldId={`resource-${finding.id}`}
        copiedField={copiedField}
        onCopy={onCopy}
      />
    ),
  },
  {
    id: 'aws_account',
    label: 'AWS Account',
    defaultWidth: 150,
    render: (finding, { copiedField, onCopy }) =>
      finding.aws_account_id ? (
        <CopyableCell
          value={finding.aws_account_id}
          fieldId={`account-${finding.id}`}
          copiedField={copiedField}
          onCopy={onCopy}
        />
      ) : (
        <div className="text-sm text-gray-900">-</div>
      ),
  },
  {
    id: 'region',
    label: 'Region',
    sortKey: 'region',
    defaultWidth: 130,
    render: (finding, { copiedField, onCopy }) => (
      <CopyableCell
        value={finding.region}
        fieldId={`region-${finding.id}`}
        copiedField={copiedField}
        onCopy={onCopy}
      />
    ),
  },
  {
    id: 'savings',
    label: 'Savings/month',
    sortKey: 'savings',
    defaultWidth: 140,
    render: (finding) => <div className="font-medium text-green-600 truncate">${finding.estimated_monthly_savings.toFixed(2)}</div>,
  },
  {
    id: 'risk_level',
    label: 'Risk',
    sortKey: 'risk_level',
    defaultWidth: 100,
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
    defaultWidth: 140,
    render: (finding) => <div className="text-sm text-gray-900 truncate">{new Date(finding.first_detected_at).toLocaleDateString()}</div>,
  },
]

const ACTIONS_COLUMN_WIDTH = 110
const MIN_COLUMN_WIDTH = 80
const MAX_COLUMN_WIDTH = 720

const STORAGE_KEY = 'findings_column_order'
const WIDTHS_STORAGE_KEY = 'findings_column_widths'

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

function clampWidth(width: number) {
  return Math.min(MAX_COLUMN_WIDTH, Math.max(MIN_COLUMN_WIDTH, Math.round(width)))
}

function useColumnWidths(defaultWidths: Record<string, number>) {
  const [widths, setWidths] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem(WIDTHS_STORAGE_KEY)
    if (!saved) return defaultWidths
    try {
      const parsed: Record<string, number> = JSON.parse(saved)
      const merged = { ...defaultWidths }
      Object.entries(parsed).forEach(([id, width]) => {
        if (id in merged && typeof width === 'number') {
          merged[id] = clampWidth(width)
        }
      })
      return merged
    } catch {
      return defaultWidths
    }
  })

  useEffect(() => {
    localStorage.setItem(WIDTHS_STORAGE_KEY, JSON.stringify(widths))
  }, [widths])

  return [widths, setWidths] as const
}

function SortableHeaderCell({
  column,
  onResize,
  sortBy,
  sortOrder,
  onSortChange,
}: {
  column: ColumnDef
  onResize: (columnId: string, width: number) => void
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  onSortChange?: (column: string) => void
}) {
  const { attributes, listeners, setNodeRef, isDragging, isOver } = useSortable({
    id: column.id,
  })
  const [isResizing, setIsResizing] = useState(false)

  const isActive = sortBy === column.id || (column.sortKey && sortBy === column.sortKey)

  const handleResizeStart = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()

    const handle = event.currentTarget
    const startX = event.clientX
    // measured, not the stored width: the table stretches to fill the container when it is narrower
    const startWidth = handle.parentElement!.getBoundingClientRect().width
    handle.setPointerCapture(event.pointerId)
    setIsResizing(true)
    document.body.style.userSelect = 'none'

    const handleMove = (moveEvent: PointerEvent) => {
      onResize(column.id, clampWidth(startWidth + moveEvent.clientX - startX))
    }

    const handleEnd = () => {
      handle.releasePointerCapture(event.pointerId)
      handle.removeEventListener('pointermove', handleMove)
      handle.removeEventListener('pointerup', handleEnd)
      handle.removeEventListener('pointercancel', handleEnd)
      document.body.style.userSelect = ''
      setIsResizing(false)
    }

    handle.addEventListener('pointermove', handleMove)
    handle.addEventListener('pointerup', handleEnd)
    handle.addEventListener('pointercancel', handleEnd)
  }

  return (
    <th
      ref={setNodeRef}
      className={`relative text-left px-6 py-3 font-semibold text-gray-900 shadow-[inset_0_-1px_0_0_#e5e7eb] ${
        isDragging ? 'bg-gray-100 opacity-40' : isOver ? 'bg-blue-50' : 'bg-gray-50'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        {column.sortKey && onSortChange ? (
          <button
            onClick={() => onSortChange(column.sortKey!)}
            className="flex items-center gap-2 hover:text-gray-600 text-left min-w-0"
          >
            <span className="truncate">{column.label}</span>
            <span className={`text-xs shrink-0 ${isActive ? 'text-gray-600' : 'text-gray-300'}`}>
              {isActive ? (sortOrder === 'asc' ? '▲' : '▼') : '◇'}
            </span>
          </button>
        ) : (
          <span className="truncate">{column.label}</span>
        )}
        <button
          {...attributes}
          {...listeners}
          className="p-1 shrink-0 cursor-grab active:cursor-grabbing hover:text-gray-600"
          title="Drag to reorder"
        >
          <DragHandleIcon />
        </button>
      </div>
      <div
        onPointerDown={handleResizeStart}
        className="group absolute top-0 -right-[4px] h-full w-[9px] z-20 flex justify-center cursor-col-resize touch-none"
        title="Drag to resize"
      >
        <div
          className={`h-full ${isResizing ? 'w-0.5 bg-blue-500' : 'w-px bg-gray-300 group-hover:w-0.5 group-hover:bg-blue-500'}`}
        />
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
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null)
  const defaultColumnIds = DEFAULT_COLUMNS.map(c => c.id)
  const [columnOrder, setColumnOrder] = useColumnOrder(defaultColumnIds)
  const [columnWidths, setColumnWidths] = useColumnWidths(
    Object.fromEntries(DEFAULT_COLUMNS.map(c => [c.id, c.defaultWidth]))
  )

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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveColumnId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveColumnId(null)

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

  const handleResize = (columnId: string, width: number) => {
    setColumnWidths(previous => ({ ...previous, [columnId]: width }))
  }

  const orderedColumns = columnOrder
    .map(id => DEFAULT_COLUMNS.find(c => c.id === id))
    .filter((c): c is ColumnDef => c !== undefined)

  const tableWidth =
    orderedColumns.reduce((sum, column) => sum + (columnWidths[column.id] ?? column.defaultWidth), 0) +
    ACTIONS_COLUMN_WIDTH

  return (
    <div className="space-y-4">
      <div className="overflow-auto max-h-[calc(100vh-340px)]">
        <DndContext
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragCancel={() => setActiveColumnId(null)}
          onDragEnd={handleDragEnd}
        >
          <table className="min-w-full table-fixed text-sm" style={{ width: tableWidth }}>
            <colgroup>
              {orderedColumns.map(column => (
                <col key={column.id} style={{ width: columnWidths[column.id] ?? column.defaultWidth }} />
              ))}
              <col style={{ width: ACTIONS_COLUMN_WIDTH }} />
            </colgroup>
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <SortableContext
                  items={columnOrder}
                  strategy={horizontalListSortingStrategy}
                >
                  {orderedColumns.map(column => (
                    <SortableHeaderCell
                      key={column.id}
                      column={column}
                      onResize={handleResize}
                      sortBy={sortBy}
                      sortOrder={sortOrder}
                      onSortChange={onSortChange}
                    />
                  ))}
                </SortableContext>
                <th className="text-left px-6 py-3 font-semibold text-gray-900 bg-gray-50 shadow-[inset_0_-1px_0_0_#e5e7eb]">Actions</th>
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
                        className="px-6 py-4 overflow-hidden"
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
          <DragOverlay>
            {activeColumnId && (
              <div className="px-3 py-2 bg-white border border-gray-300 rounded shadow-lg text-sm font-semibold text-gray-900">
                {DEFAULT_COLUMNS.find(c => c.id === activeColumnId)?.label}
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>
      <div className="mt-4">
        <Pagination page={page} pageSize={pageSize} total={total} onPageChange={onPageChange} />
      </div>
    </div>
  )
}
