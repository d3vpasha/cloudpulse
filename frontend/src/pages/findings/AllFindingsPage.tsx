import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { findingsApi } from '../../api/findings'
import FindingsTable from '../../components/findings/FindingsTable'

const STORAGE_KEY = 'findings_filters'

export default function AllFindingsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [openFilterType, setOpenFilterType] = useState<string | null>(null)
  const [tempFilterValue, setTempFilterValue] = useState('')
  const [isInitialized, setIsInitialized] = useState(false)

  // On mount: restore filters from localStorage if URL is clean
  useEffect(() => {
    if (!isInitialized) {
      const hasUrlParams = searchParams.toString().length > 0
      if (!hasUrlParams) {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
          setSearchParams(new URLSearchParams(saved))
        }
      }
      setIsInitialized(true)
    }
  }, [])

  // Whenever URL params change, save to localStorage
  useEffect(() => {
    if (isInitialized) {
      const paramString = searchParams.toString()
      if (paramString) {
        localStorage.setItem(STORAGE_KEY, paramString)
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  }, [searchParams, isInitialized])

  const page = Number(searchParams.get('page')) || 1
  const filters = {
    status: searchParams.get('status') || undefined,
    risk_level: searchParams.get('risk_level') || undefined,
    category: searchParams.get('category') || undefined,
    resource_group: searchParams.get('resource_group') || undefined,
    search: searchParams.get('search') || undefined,
  }
  const sort = {
    sortBy: searchParams.get('sort_by') || 'priority_rank',
    sortOrder: (searchParams.get('sort_order') as 'asc' | 'desc') || 'asc',
  }

  const filterTypes = [
    { key: 'status', label: 'Status', values: { open: 'Open', ignored: 'Ignored', resolved: 'Resolved' } },
    { key: 'risk_level', label: 'Risk Level', values: { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' } },
    { key: 'category', label: 'Category', values: { cost: 'Cost', security: 'Security' } },
    { key: 'resource_group', label: 'Resource Group', values: { storage: 'Storage', network: 'Network', compute: 'Compute' } },
    { key: 'search', label: 'Search', isText: true },
  ]

  const getFilterLabel = (filterKey: string, value: string) => {
    const filterType = filterTypes.find(f => f.key === filterKey)
    if (!filterType) return value
    if (filterType.isText) return value
    return filterType.values?.[value as keyof typeof filterType.values] || value
  }

  const addFilter = (filterKey: string, value: string) => {
    if (filterKey === 'status') handleStatusChange(value)
    else if (filterKey === 'risk_level') handleRiskChange(value)
    else if (filterKey === 'category') handleCategoryChange(value)
    else if (filterKey === 'resource_group') handleResourceGroupChange(value)
    else if (filterKey === 'search') handleSearchChange(value)
    setOpenFilterType(null)
    setTempFilterValue('')
  }

  const removeFilter = (filterKey: string) => {
    if (filterKey === 'status') handleStatusChange('')
    else if (filterKey === 'risk_level') handleRiskChange('')
    else if (filterKey === 'category') handleCategoryChange('')
    else if (filterKey === 'resource_group') handleResourceGroupChange('')
    else if (filterKey === 'search') handleSearchChange('')
  }

  const clearAllFilters = () => {
    const next = new URLSearchParams()
    next.set('page', '1')
    setSearchParams(next)
  }

  const getActiveFilters = () => {
    return Object.entries(filters)
      .filter(([_, value]) => value)
      .map(([key, value]) => ({ key, value }))
  }

  const getAvailableFilterTypes = () => {
    const activeKeys = Object.keys(filters).filter(k => filters[k as keyof typeof filters])
    return filterTypes.filter(f => !activeKeys.includes(f.key))
  }

  const { data: findings, refetch } = useQuery({
    queryKey: ['findings', searchParams.toString()],
    queryFn: () =>
      findingsApi.list(page, 20, {
        status: filters.status,
        risk_level: filters.risk_level,
        category: filters.category,
        resource_group: filters.resource_group,
        search: filters.search,
        sort_by: sort.sortBy,
        sort_order: sort.sortOrder,
      }),
  })

  const updateParams = (updates: Record<string, string | undefined>) => {
    const next = new URLSearchParams(searchParams)
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        next.set(key, value)
      } else {
        next.delete(key)
      }
    })
    next.set('page', '1')
    setSearchParams(next)
  }

  const handleStatusChange = (status: string) => {
    updateParams({ status: status || undefined })
  }

  const handleRiskChange = (risk: string) => {
    updateParams({ risk_level: risk || undefined })
  }

  const handleSearchChange = (search: string) => {
    updateParams({ search: search || undefined })
  }

  const handleCategoryChange = (category: string) => {
    updateParams({ category: category || undefined })
  }

  const handleResourceGroupChange = (resourceGroup: string) => {
    updateParams({ resource_group: resourceGroup || undefined })
  }

  const handleSortChange = (column: string) => {
    const newSortOrder = sort.sortBy === column && sort.sortOrder === 'asc' ? 'desc' : 'asc'
    updateParams({ sort_by: column, sort_order: newSortOrder })
  }

  const handlePageChange = (newPage: number) => {
    const next = new URLSearchParams(searchParams)
    next.set('page', String(newPage))
    setSearchParams(next)
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">All findings</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {getActiveFilters().map(({ key, value }) => (
            <div key={key} className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              <span>
                {filterTypes.find(f => f.key === key)?.label}: {getFilterLabel(key, value)}
              </span>
              <button
                onClick={() => removeFilter(key)}
                className="ml-1 font-bold hover:text-blue-900 cursor-pointer"
              >
                ×
              </button>
            </div>
          ))}

          <div className="relative">
            <button
              onClick={() => setOpenFilterType(openFilterType ? null : 'menu')}
              disabled={getAvailableFilterTypes().length === 0}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              + Add Filter {openFilterType === 'menu' ? '▲' : '▼'}
            </button>

            {openFilterType === 'menu' && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-max">
                {getAvailableFilterTypes().map(filterType => (
                  <button
                    key={filterType.key}
                    onClick={() => setOpenFilterType(filterType.key)}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg"
                  >
                    {filterType.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {openFilterType && openFilterType !== 'menu' && (
            <div className="relative flex items-center gap-2">
              {(() => {
                const filterType = filterTypes.find(f => f.key === openFilterType)
                if (!filterType) return null
                if (filterType.isText) {
                  return (
                    <>
                      <input
                        type="text"
                        autoFocus
                        placeholder={`Enter ${filterType.label.toLowerCase()}...`}
                        value={tempFilterValue}
                        onChange={(e) => setTempFilterValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && tempFilterValue) {
                            addFilter(openFilterType, tempFilterValue)
                          } else if (e.key === 'Escape') {
                            setOpenFilterType(null)
                            setTempFilterValue('')
                          }
                        }}
                        className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                      />
                      <button
                        onClick={() => {
                          if (tempFilterValue) addFilter(openFilterType, tempFilterValue)
                        }}
                        className="px-2 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        Add
                      </button>
                    </>
                  )
                } else {
                  return (
                    <select
                      autoFocus
                      value={tempFilterValue}
                      onChange={(e) => {
                        if (e.target.value) {
                          addFilter(openFilterType, e.target.value)
                        }
                      }}
                      className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                    >
                      <option value="">Select...</option>
                      {Object.entries(filterType.values!).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  )
                }
              })()}
              <button
                onClick={() => {
                  setOpenFilterType(null)
                  setTempFilterValue('')
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
          )}

          {getActiveFilters().length > 0 && (
            <button
              onClick={clearAllFilters}
              className="ml-auto text-sm text-gray-600 hover:text-gray-900 underline"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {findings && (
          <FindingsTable
            findings={findings.findings}
            total={findings.total}
            page={page}
            pageSize={20}
            onPageChange={handlePageChange}
            onFindingIgnore={() => refetch()}
            onFindingUnignore={() => refetch()}
            sortBy={sort.sortBy}
            sortOrder={sort.sortOrder}
            onSortChange={handleSortChange}
          />
        )}
      </div>
    </div>
  )
}
