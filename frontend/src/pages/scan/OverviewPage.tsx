import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../../api/dashboard'
import { scansApi } from '../../api/scans'
import { connectionsApi } from '../../api/connections'
import { settingsApi } from '../../api/settings'
import ConnectionStatusCard from '../../components/cards/ConnectionStatusCard'
import ScanStatusCard from '../../components/cards/ScanStatusCard'
import ScanSummaryCard from '../../components/cards/ScanSummaryCard'
import RiskBar from '../../components/findings/RiskBar'
import FindingsTable from '../../components/findings/FindingsTable'

export default function OverviewPage() {
  const navigate = useNavigate()
  const [scanningConnectionId, setScanningConnectionId] = useState<string | null>(null)
  const [scanPage, setScanPage] = useState(1)

  const { data: overview, isLoading, refetch } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: () => dashboardApi.getOverview(),
    refetchInterval: scanningConnectionId ? 2000 : false,
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
  const canRunScan = connectedConnections.length > 0 && hasEnabledProviders && hasSelectedRegions

  const handleRunScan = async () => {
    if (connectedConnections.length === 0) return

    const connectionId = connectedConnections[0].id
    setScanningConnectionId(connectionId)

    try {
      const scan = await scansApi.trigger(connectionId)
      const pollScan = setInterval(async () => {
        const updated = await scansApi.get(scan.id)
        if (updated.status !== 'pending' && updated.status !== 'running') {
          clearInterval(pollScan)
          setScanningConnectionId(null)
          refetch()
        }
      }, 2000)
    } catch (error) {
      console.error('Failed to trigger scan', error)
      setScanningConnectionId(null)
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

      <div className="grid grid-cols-3 gap-6 mb-8">
        <ConnectionStatusCard connection={connectedConnections[0] || null} />
        <ScanStatusCard scan={overview?.latest_scan || null} loading={scanningConnectionId !== null} />
        <ScanSummaryCard summary={overview?.summary || null} />
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Findings by risk level</h3>
            {overview && <RiskBar distribution={overview.risk_distribution} />}
          </div>
          <div className="relative group">
            <button
              onClick={handleRunScan}
              disabled={!canRunScan || scanningConnectionId !== null}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {scanningConnectionId ? 'Scanning...' : 'Run new scan'}
            </button>
            {connectedConnections.length === 0 && (
              <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block bg-gray-800 text-white text-sm rounded px-3 py-2 whitespace-nowrap z-10">
                <p className="font-semibold mb-1">No connected accounts</p>
                <p className="text-gray-300">Go to Connections menu and add a new connection</p>
                <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-800"></div>
              </div>
            )}
            {!hasEnabledProviders && connectedConnections.length > 0 && (
              <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block bg-gray-800 text-white text-sm rounded px-3 py-2 whitespace-nowrap z-10">
                <p className="font-semibold mb-1">No providers enabled</p>
                <p className="text-gray-300">Go to Settings and enable at least one provider</p>
                <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-800"></div>
              </div>
            )}
            {!hasSelectedRegions && hasEnabledProviders && connectedConnections.length > 0 && (
              <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block bg-gray-800 text-white text-sm rounded px-3 py-2 whitespace-nowrap z-10">
                <p className="font-semibold mb-1">No regions selected</p>
                <p className="text-gray-300">Go to Settings and select at least one region</p>
                <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-800"></div>
              </div>
            )}
            {scanningConnectionId && (
              <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block bg-gray-800 text-white text-sm rounded px-3 py-2 whitespace-nowrap z-10">
                <p>Scan in progress...</p>
                <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-800"></div>
              </div>
            )}
          </div>
        </div>
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
