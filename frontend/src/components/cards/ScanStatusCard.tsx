import { Scan } from '../../types'
import StatusBadge from '../common/StatusBadge'

interface ScanStatusCardProps {
  scan: Scan | null
  loading?: boolean
}

export default function ScanStatusCard({ scan, loading = false }: ScanStatusCardProps) {
  const getVariant = (status?: string) => {
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

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Scan Status</h3>
      {loading ? (
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="text-gray-600">Scanning...</span>
        </div>
      ) : scan ? (
        <div className="space-y-3">
          <div>
            <span className="text-gray-600 text-sm">Status</span>
            <div className="mt-1">
              <StatusBadge status={scan.status} variant={getVariant(scan.status)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-gray-600 text-sm">Latest scan</span>
              <p className="font-medium text-gray-900 text-sm">{formatDate(scan.started_at)}</p>
            </div>
            <div>
              <span className="text-gray-600 text-sm">Finished</span>
              <p className="font-medium text-gray-900 text-sm">{formatDate(scan.finished_at)}</p>
            </div>
          </div>
          {scan.error_message && (
            <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-800">
              {scan.error_message}
            </div>
          )}
        </div>
      ) : (
        <p className="text-gray-600 text-sm">No scans yet</p>
      )}
    </div>
  )
}
