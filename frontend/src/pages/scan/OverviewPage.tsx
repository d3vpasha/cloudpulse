import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../../api/dashboard'
import { scansApi } from '../../api/scans'
import { connectionsApi } from '../../api/connections'
import { settingsApi } from '../../api/settings'
import ConnectionStatusCard from '../../components/cards/ConnectionStatusCard'
import ScanStatusCard from '../../components/cards/ScanStatusCard'
import RiskBar from '../../components/findings/RiskBar'

const riskChipClass = (risk: string) => {
  switch (risk) {
    case 'critical': return 'bg-red-100 text-red-800'
    case 'high': return 'bg-orange-100 text-orange-800'
    case 'medium': return 'bg-yellow-100 text-yellow-800'
    default: return 'bg-blue-100 text-blue-800'
  }
}

export default function OverviewPage() {
  const navigate = useNavigate()
  const [scanningIds, setScanningIds] = useState<string[]>([])
  const [scanError, setScanError] = useState<string | null>(null)
  const pollIntervals = useRef<Record<string, ReturnType<typeof setInterval>>>({})

  useEffect(() => {
    return () => {
      Object.values(pollIntervals.current).forEach(clearInterval)
    }
  }, [])

  const { data: overview, isLoading, refetch } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: () => dashboardApi.getOverview(),
    refetchInterval: scanningIds.length > 0 ? 2000 : false,
  })

  const { data: connections = [] } = useQuery({
    queryKey: ['connections'],
    queryFn: () => connectionsApi.list(),
  })

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.get(),
  })

  const connectedConnections = connections.filter(c => c.status === 'connected')
  const hasEnabledProviders = settings?.active_providers && settings.active_providers.length > 0
  const hasSelectedRegions = settings?.active_regions && settings.active_regions.length > 0
  const hasManualScansRemaining = settings && (settings.manual_scans_limit === null || settings.manual_scans_today < settings.manual_scans_limit)

  const scanBlockedReason =
    !settings ? 'Loading settings...'
    : !hasEnabledProviders ? 'Enable at least one provider in Settings'
    : !hasSelectedRegions ? 'Select at least one region in Settings'
    : !hasManualScansRemaining ? 'Daily manual scan limit reached'
    : null

  const latestScanConnection = connections.find(c => c.id === overview?.latest_scan?.connection_id)
  const latestScanAccount = latestScanConnection?.name
    || (overview?.latest_scan?.connection_name ? `${overview.latest_scan.connection_name} (deleted)` : null)

  const handleRunScan = async (connectionId: string) => {
    setScanError(null)
    setScanningIds(prev => [...prev, connectionId])

    const stopScanning = () => setScanningIds(prev => prev.filter(id => id !== connectionId))

    try {
      const scan = await scansApi.trigger(connectionId)
      pollIntervals.current[connectionId] = setInterval(async () => {
        const updated = await scansApi.get(scan.id)
        if (updated.status !== 'pending' && updated.status !== 'running') {
          clearInterval(pollIntervals.current[connectionId])
          delete pollIntervals.current[connectionId]
          stopScanning()
          refetch()
        }
      }, 2000)
    } catch (error: any) {
      console.error('Failed to trigger scan', error)
      const name = connections.find(c => c.id === connectionId)?.name || connectionId
      setScanError(`${name}: ${error.response?.data?.detail || 'Failed to trigger scan'}`)
      stopScanning()
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Overview</h1>
      </div>

      {connectedConnections.length === 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 mb-6">
          <p className="text-amber-900 text-sm">
            ⚠️ No connected accounts. <button onClick={() => navigate('/connections')} className="font-semibold text-amber-700 hover:underline">
              Add a connection to get started
            </button>
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6 mb-8">
        <ConnectionStatusCard
          connections={connections}
          scanningIds={scanningIds}
          onScan={handleRunScan}
          scanBlockedReason={scanBlockedReason}
        />
        <ScanStatusCard scan={overview?.latest_scan || null} connectionName={latestScanAccount} />
      </div>

      {scanError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800 text-sm">{scanError}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Findings</h3>
        {overview && (
          <>
            <div className="flex gap-12 mb-6">
              <div>
                <span className="text-gray-600 text-sm">Issues to fix</span>
                <p className="text-3xl font-bold text-gray-900">{overview.summary.total_findings}</p>
              </div>
              <div>
                <span className="text-gray-600 text-sm">Monthly savings potential</span>
                <p className="text-3xl font-bold text-green-600">${overview.summary.total_monthly_savings.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
              </div>
            </div>
            <RiskBar distribution={overview.risk_distribution} />
          </>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-baseline justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Most common issues</h3>
          <button onClick={() => navigate('/findings')} className="text-sm text-blue-600 hover:underline">
            View all findings
          </button>
        </div>
        {overview?.common_issues.length ? (
          <div className="divide-y divide-gray-100">
            {overview.common_issues.map(issue => (
              <div key={issue.check_type} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">{issue.display_name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${riskChipClass(issue.risk_level)}`}>
                      {issue.risk_level}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      {issue.category}
                    </span>
                    <span className="text-xs text-gray-500">{issue.resource_type}</span>
                  </div>
                </div>
                <span className={`text-sm ${issue.monthly_savings > 0 ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                  {issue.monthly_savings > 0 ? `$${issue.monthly_savings.toLocaleString('en-US', { maximumFractionDigits: 2 })}` : '-'}
                </span>
                <span className="text-base font-bold text-gray-900 w-10 text-right">{issue.count}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 text-sm">No open findings</p>
        )}
      </div>
    </div>
  )
}
