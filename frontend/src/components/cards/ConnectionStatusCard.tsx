import { Connection } from '../../types'
import StatusBadge from '../common/StatusBadge'

interface ConnectionStatusCardProps {
  connections: Connection[]
  scanningIds: string[]
  onScan: (connectionId: string) => void
  scanBlockedReason: string | null
}

export default function ConnectionStatusCard({ connections, scanningIds, onScan, scanBlockedReason }: ConnectionStatusCardProps) {
  const getVariant = (status?: string) => {
    switch (status) {
      case 'connected': return 'success'
      case 'error': return 'error'
      case 'pending': return 'warning'
      default: return 'default'
    }
  }

  const connectedCount = connections.filter(c => c.status === 'connected').length

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Connections</h3>
      {connections.length > 0 ? (
        <>
          <p className="text-sm text-gray-600 mb-3">
            <span className="font-semibold text-gray-900">{connectedCount} of {connections.length}</span> accounts connected
          </p>
          <div className="divide-y divide-gray-100">
            {connections.map(connection => {
              const scanning = scanningIds.includes(connection.id)
              const disabledReason = connection.status !== 'connected'
                ? 'Fix the connection before scanning'
                : scanBlockedReason
              return (
                <div key={connection.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{connection.name}</p>
                      {connection.aws_account_id && (
                        <p className="text-xs text-gray-500">{connection.aws_account_id}</p>
                      )}
                    </div>
                    <StatusBadge status={connection.status} variant={getVariant(connection.status)} />
                    <button
                      onClick={() => onScan(connection.id)}
                      disabled={scanning || disabledReason !== null}
                      title={disabledReason || undefined}
                      className="border border-gray-300 bg-white rounded-md px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {scanning ? 'Scanning...' : 'Scan'}
                    </button>
                  </div>
                  {connection.last_test_error && (
                    <div className="mt-2 bg-red-50 border border-red-200 rounded p-2 text-xs text-red-800">
                      {connection.last_test_error}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      ) : (
        <p className="text-gray-600 text-sm">No connection configured</p>
      )}
    </div>
  )
}
