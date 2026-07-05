interface RiskBarProps {
  distribution: {
    critical?: number
    high?: number
    medium?: number
    low?: number
  }
}

export default function RiskBar({ distribution }: RiskBarProps) {
  const total = (distribution.critical || 0) + (distribution.high || 0) + (distribution.medium || 0) + (distribution.low || 0)

  if (total === 0) {
    return <p className="text-gray-600 text-sm">No findings</p>
  }

  const critical = ((distribution.critical || 0) / total) * 100
  const high = ((distribution.high || 0) / total) * 100
  const medium = ((distribution.medium || 0) / total) * 100
  const low = ((distribution.low || 0) / total) * 100

  return (
    <div className="space-y-2">
      <div className="flex h-8 rounded-lg overflow-hidden border">
        {critical > 0 && <div style={{ width: `${critical}%` }} className="bg-red-600"></div>}
        {high > 0 && <div style={{ width: `${high}%` }} className="bg-orange-500"></div>}
        {medium > 0 && <div style={{ width: `${medium}%` }} className="bg-yellow-400"></div>}
        {low > 0 && <div style={{ width: `${low}%` }} className="bg-blue-400"></div>}
      </div>
      <div className="flex flex-wrap gap-4 text-xs">
        {(distribution.critical || 0) > 0 && (
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-600 rounded"></div>
            <span>Critical {distribution.critical}</span>
          </div>
        )}
        {(distribution.high || 0) > 0 && (
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-orange-500 rounded"></div>
            <span>High {distribution.high}</span>
          </div>
        )}
        {(distribution.medium || 0) > 0 && (
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-400 rounded"></div>
            <span>Medium {distribution.medium}</span>
          </div>
        )}
        {(distribution.low || 0) > 0 && (
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-400 rounded"></div>
            <span>Low {distribution.low}</span>
          </div>
        )}
      </div>
    </div>
  )
}
