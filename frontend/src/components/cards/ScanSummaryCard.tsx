import { FindingSummary } from '../../types'

interface ScanSummaryCardProps {
  summary: FindingSummary | null
}

export default function ScanSummaryCard({ summary }: ScanSummaryCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Scan Summary</h3>
      {summary ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="border-b pb-4">
              <span className="text-gray-600 text-sm">Resources analyzed</span>
              <p className="text-3xl font-bold text-gray-900">{summary.total_findings}</p>
            </div>
            <div className="border-b pb-4">
              <span className="text-gray-600 text-sm">Monthly savings potential</span>
              <p className="text-3xl font-bold text-green-600">${summary.total_monthly_savings.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
            </div>
          </div>
          <div>
            <span className="text-gray-600 text-sm">Findings by risk level</span>
            <div className="mt-2 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-red-600 font-medium">Critical</span>
                <span className="text-red-600 font-bold">{summary.critical}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-orange-600 font-medium">High</span>
                <span className="text-orange-600 font-bold">{summary.high}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-yellow-600 font-medium">Medium</span>
                <span className="text-yellow-600 font-bold">{summary.medium}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-600 font-medium">Low</span>
                <span className="text-blue-600 font-bold">{summary.low}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-gray-600 text-sm">No data available</p>
      )}
    </div>
  )
}
