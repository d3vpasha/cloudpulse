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
import FindingsTable from '../../components/findings/FindingsTable'

export default function OverviewPage() {
  const navigate = useNavigate()
  const [scanningIds, setScanningIds] = useState<string[]>([])
  const [scanPage, setScanPage] = useState(1)
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
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Top prioritized findings</h3>
        {overview?.top_findings && (
          <FindingsTable
            findings={overview.top_findings.slice(0, 5)}
            total={overview.summary?.total_findings || 0}
            page={scanPage}
            pageSize={5}
            onPageChange={setScanPage}
          />
        )}
      </div>
    </div>
  )
}
