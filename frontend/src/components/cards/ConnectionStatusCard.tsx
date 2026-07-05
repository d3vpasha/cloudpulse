import { Connection } from '../../types'
import StatusBadge from '../common/StatusBadge'

interface ConnectionStatusCardProps {
  connection: Connection | null
}

export default function ConnectionStatusCard({ connection }: ConnectionStatusCardProps) {
  const getVariant = (status?: string) => {
    switch (status) {
      case 'connected': return 'success'
      case 'error': return 'error'
      case 'pending': return 'warning'
      default: return 'default'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Connection</h3>
      {connection ? (
        <div className="space-y-3">
          <div>
            <span className="text-gray-600 text-sm">Status</span>
            <div className="mt-1">
              <StatusBadge status={connection.status} variant={getVariant(connection.status)} />
            </div>
          </div>
          <div>
            <span className="text-gray-600 text-sm">Name</span>
            <p className="font-medium text-gray-900">{connection.name}</p>
          </div>
          {connection.aws_account_id && (
            <div>
              <span className="text-gray-600 text-sm">AWS Account</span>
              <p className="font-medium text-gray-900">{connection.aws_account_id}</p>
            </div>
          )}
          {connection.last_test_error && (
            <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-800">
              {connection.last_test_error}
            </div>
          )}
        </div>
      ) : (
        <p className="text-gray-600 text-sm">No connection configured</p>
      )}
    </div>
  )
}
