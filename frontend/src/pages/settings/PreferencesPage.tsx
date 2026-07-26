import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { settingsApi } from '../../api/settings'
import Modal from '../../components/common/Modal'

export default function PreferencesPage() {
  const navigate = useNavigate()
  const [providers, setProviders] = useState<string[]>(['aws'])
  const [regions, setRegions] = useState<string[]>(['us-east-1'])
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [expandedProvider, setExpandedProvider] = useState<string>('')
  const [showPlansModal, setShowPlansModal] = useState(false)

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.get(),
  })

  const { data: regionsList } = useQuery({
    queryKey: ['regions'],
    queryFn: () => settingsApi.getRegions(),
  })

  const { data: plansList } = useQuery({
    queryKey: ['plans'],
    queryFn: () => settingsApi.getPlans(),
  })

  useEffect(() => {
    if (settings) {
      setProviders(settings.active_providers)
      setRegions(settings.active_regions)
    }
  }, [settings])

  const handleSave = async () => {
    setLoading(true)
    setSaved(false)
    try {
      await settingsApi.update(providers, regions)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Failed to save settings', error)
    }
    setLoading(false)
  }

  const frequencyLabel: Record<string, string> = {
    'DAILY': 'Daily',
    'EVERY_6H': 'Every 6 hours',
    'HOURLY': 'Hourly',
  }

  const frequencyDescription: Record<string, string> = {
    'DAILY': 'Scans run daily at midnight (00:00 UTC)',
    'EVERY_6H': 'Scans run every 6 hours (00:00, 06:00, 12:00, 18:00 UTC)',
    'HOURLY': 'Scans run every hour, on the hour',
  }

  const manualScansUsed = settings?.manual_scans_today || 0
  const manualScansLimit = settings?.manual_scans_limit === null ? '∞' : settings?.manual_scans_limit

  const allRegions = regionsList?.regions || {}

  const scanScheduleMessage = () => {
    if (!settings?.has_active_connection) {
      return (
        <div className="text-sm text-gray-700">
          <p>
            <button
              onClick={() => navigate('/connections')}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Add a cloud connection
            </button>
            {' '}to start scheduled scans
          </p>
        </div>
      )
    }

    if (settings?.next_scheduled_scan_at) {
      return (
        <div className="text-sm text-gray-700">
          <p className="mb-1">{frequencyDescription[settings.scan_frequency] || 'Scans are scheduled'}</p>
          <p className="text-gray-600">
            Next scheduled scan: {new Date(settings.next_scheduled_scan_at).toLocaleString()}
          </p>
        </div>
      )
    }

    return (
      <div className="text-sm text-gray-700">
        <p>Scheduling your first scan…</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

      <div className="max-w-2xl space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Cloud Providers</h2>
          <div className="space-y-4">
            {/* AWS Provider */}
            <div>
              <div className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer" onClick={() => setExpandedProvider(expandedProvider === 'aws' ? '' : 'aws')}>
                <input
                  type="checkbox"
                  id="provider-aws"
                  checked={providers.includes('aws')}
                  onChange={(e) => {
                    e.stopPropagation()
                    if (e.target.checked && !providers.includes('aws')) {
                      setProviders([...providers, 'aws'])
                    } else {
                      setProviders(providers.filter(p => p !== 'aws'))
                    }
                  }}
                  className="rounded border-gray-300"
                  onClick={(e) => e.stopPropagation()}
                />
                <label htmlFor="provider-aws" className="ml-4 text-gray-900 cursor-pointer flex items-center flex-1">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Amazon_Web_Services_Logo.svg/960px-Amazon_Web_Services_Logo.svg.png" alt="AWS" className="h-10 w-10 object-contain" />
                  <span className="font-medium ml-4">AWS</span>
                </label>
                <span className="text-gray-400 ml-2 transition-transform" style={{ transform: expandedProvider === 'aws' ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  ▼
                </span>
              </div>

              {expandedProvider === 'aws' && (
                <div className="p-4 bg-gray-50 border border-t-0 border-gray-200 rounded-b-lg">
                  <p className="text-sm text-gray-600 mb-4">Select the regions to scan for findings:</p>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {Object.entries(allRegions).map(([group, regionList]) => (
                      <div key={group}>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">{group}</h4>
                        <div className="grid grid-cols-2 gap-3 ml-2">
                          {regionList.map((region: any) => (
                            <label key={region.code} className="flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={regions.includes(region.code)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setRegions([...regions, region.code])
                                  } else {
                                    setRegions(regions.filter(r => r !== region.code))
                                  }
                                }}
                                className="rounded border-gray-300"
                              />
                              <span className="ml-2 text-sm text-gray-700">{region.name}</span>
                              <span className="ml-2 text-xs text-gray-500">{region.code}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* GCP Provider */}
            <div>
              <div className="flex items-center p-3 border border-gray-200 rounded-lg opacity-50 cursor-not-allowed hover:bg-gray-50" onClick={() => setExpandedProvider(expandedProvider === 'gcp' ? '' : 'gcp')}>
                <input
                  type="checkbox"
                  id="provider-gcp"
                  disabled
                  checked={false}
                  className="rounded border-gray-300"
                  onClick={(e) => e.stopPropagation()}
                />
                <label htmlFor="provider-gcp" className="ml-4 text-gray-900 flex items-center flex-1 cursor-not-allowed">
                  <img src="https://koul.io/images/tech/tech-gcp.svg" alt="GCP" className="h-10 w-10 object-contain" />
                  <div className="ml-4">
                    <span className="font-medium block">GCP</span>
                    <p className="text-sm text-gray-600">(coming soon)</p>
                  </div>
                </label>
                <span className="text-gray-400 ml-2 transition-transform" style={{ transform: expandedProvider === 'gcp' ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  ▼
                </span>
              </div>

              {expandedProvider === 'gcp' && (
                <div className="p-4 bg-gray-50 border border-t-0 border-gray-200 rounded-b-lg opacity-50">
                  <p className="text-sm text-gray-600 mb-4">Select the regions to scan for findings:</p>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    <p className="text-sm text-gray-600">Regions will be available when GCP support is enabled.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Azure Provider */}
            <div>
              <div className="flex items-center p-3 border border-gray-200 rounded-lg opacity-50 cursor-not-allowed hover:bg-gray-50" onClick={() => setExpandedProvider(expandedProvider === 'azure' ? '' : 'azure')}>
                <input
                  type="checkbox"
                  id="provider-azure"
                  disabled
                  checked={false}
                  className="rounded border-gray-300"
                  onClick={(e) => e.stopPropagation()}
                />
                <label htmlFor="provider-azure" className="ml-4 text-gray-900 flex items-center flex-1 cursor-not-allowed">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Microsoft_logo.svg/960px-Microsoft_logo.svg.png" alt="Azure" className="h-10 w-10 object-contain" />
                  <div className="ml-4">
                    <span className="font-medium block">Azure</span>
                    <p className="text-sm text-gray-600">(coming soon)</p>
                  </div>
                </label>
                <span className="text-gray-400 ml-2 transition-transform" style={{ transform: expandedProvider === 'azure' ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  ▼
                </span>
              </div>

              {expandedProvider === 'azure' && (
                <div className="p-4 bg-gray-50 border border-t-0 border-gray-200 rounded-b-lg opacity-50">
                  <p className="text-sm text-gray-600 mb-4">Select the regions to scan for findings:</p>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    <p className="text-sm text-gray-600">Regions will be available when Azure support is enabled.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Scan Schedule</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-700 mb-2">
                Scheduled scans run <span className="font-medium">{frequencyLabel[settings?.scan_frequency as keyof typeof frequencyLabel] || 'Daily'}</span> (included in your <span className="font-medium">{settings?.plan_name || 'Free'}</span> plan)
                {' '}
                <button
                  onClick={() => setShowPlansModal(true)}
                  className="text-blue-600 hover:text-blue-800 underline text-sm"
                >
                  See our other plans
                </button>
              </p>
              {scanScheduleMessage()}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
              <p>Manual scans used today: <span className="font-semibold">{manualScansUsed}/{manualScansLimit}</span></p>
              <p className="text-xs mt-1">Your plan allows you to run {manualScansLimit} manual scan(s) per day</p>
            </div>
          </div>
        </div>

        {saved && (
          <div className="bg-green-50 border border-green-200 rounded p-4 text-green-800 text-sm">
            Settings saved successfully!
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save provider settings'}
          </button>
        </div>
      </div>

      <Modal open={showPlansModal} onClose={() => setShowPlansModal(false)}>
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Compare Plans</h3>
          <div className="space-y-4">
            {plansList?.plans.map((plan) => (
              <div
                key={plan.key}
                className={`p-4 border rounded-lg ${
                  plan.name === settings?.plan_name
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">
                      {plan.name}
                      {plan.name === settings?.plan_name && (
                        <span className="ml-2 inline-block bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
                          Current Plan
                        </span>
                      )}
                    </h4>
                    <p className="text-sm text-gray-600 mt-2">
                      Scan frequency: <span className="font-medium">{frequencyLabel[plan.scan_frequency]}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Manual scans per day:{' '}
                      <span className="font-medium">
                        {plan.manual_scans_per_day_limit === null ? '∞' : plan.manual_scans_per_day_limit}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t pt-4 text-sm text-gray-500">
            Need something beyond these plans? Contact our sales team to discuss custom limits.
          </div>
        </div>
      </Modal>
    </div>
  )
}
