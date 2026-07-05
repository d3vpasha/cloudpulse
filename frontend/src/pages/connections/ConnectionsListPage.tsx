import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { connectionsApi } from '../../api/connections'
import StatusBadge from '../../components/common/StatusBadge'

export default function ConnectionsListPage() {
  const navigate = useNavigate()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const { data: connections = [], refetch } = useQuery({
    queryKey: ['connections'],
    queryFn: () => connectionsApi.list(),
  })

  const handleDelete = (id: string) => {
    setConfirmDeleteId(id)
  }

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return
    setDeletingId(confirmDeleteId)
    try {
      await connectionsApi.delete(confirmDeleteId)
      refetch()
    } catch (error) {
      console.error('Failed to delete connection', error)
    }
    setDeletingId(null)
    setConfirmDeleteId(null)
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'connected': return 'success'
      case 'error': return 'error'
      case 'pending': return 'warning'
      default: return 'default'
    }
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Connections</h1>
        <button
          onClick={() => navigate('/connections/new')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
        >
          Add connection
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {connections.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            <p>No connections yet. Click "Add connection" to get started.</p>
          </div>
        ) : (
          connections.map(conn => (
            <div key={conn.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{conn.name}</h3>
                <StatusBadge status={conn.status} variant={getStatusVariant(conn.status)} />
              </div>

              {conn.aws_account_id && (
                <p className="text-sm text-gray-600 mb-3">Account: {conn.aws_account_id}</p>
              )}

              {conn.last_test_error && (
                <div className="bg-red-50 border border-red-200 rounded p-2 mb-4 text-xs text-red-800">
                  {conn.last_test_error}
                </div>
              )}

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => navigate(`/connections/${conn.id}/edit`)}
                  className="flex-1 px-3 py-2 text-sm text-blue-600 border border-blue-600 rounded hover:bg-blue-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(conn.id)}
                  disabled={deletingId === conn.id}
                  className="flex-1 px-3 py-2 text-sm text-red-600 border border-red-600 rounded hover:bg-red-50 disabled:opacity-50"
                >
                  {deletingId === conn.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete connection?</h3>
            <p className="text-gray-600 mb-6">This will delete the connection and all associated scans. This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deletingId === confirmDeleteId}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deletingId === confirmDeleteId ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
