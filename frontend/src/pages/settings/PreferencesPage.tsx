import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { settingsApi } from '../../api/settings'

export default function PreferencesPage() {
  const [providers, setProviders] = useState<string[]>(['aws'])
  const [regions, setRegions] = useState<string[]>(['us-east-1'])
  const [scheduledScansEnabled, setScheduledScansEnabled] = useState(true)
  const [scanFrequency, setScanFrequency] = useState('DAILY')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [expandedProvider, setExpandedProvider] = useState<string>('')

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.get(),
  })

  const { data: regionsList } = useQuery({
    queryKey: ['regions'],
    queryFn: () => settingsApi.getRegions(),
  })

  useEffect(() => {
    if (settings) {
      setProviders(settings.active_providers)
      setRegions(settings.active_regions)
      setScheduledScansEnabled(settings.scheduled_scans_enabled)
      setScanFrequency(settings.scan_frequency)
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

  const handleSaveScanSchedule = async () => {
    setLoading(true)
    setSaved(false)
    try {
      await settingsApi.updateScanSchedule(scheduledScansEnabled, scanFrequency)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Failed to save scan schedule', error)
    }
    setLoading(false)
  }

  const nextScanTime = settings?.next_scheduled_scan_at ? new Date(settings.next_scheduled_scan_at).toLocaleString() : 'Not scheduled'
  const manualScansUsed = settings?.manual_scans_today || 0
  const manualScansLimit = settings?.manual_scans_limit === null ? '∞' : settings?.manual_scans_limit

  const allRegions = regionsList?.regions || {}

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
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={scheduledScansEnabled}
                  onChange={(e) => setScheduledScansEnabled(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="ml-2 text-gray-900 font-medium">Enable scheduled scans</span>
              </label>
              <p className="text-sm text-gray-600 mt-2 ml-6">Automatically scan your connections on a regular schedule</p>
            </div>

            {scheduledScansEnabled && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Scan Frequency</label>
                <select
                  value={scanFrequency}
                  onChange={(e) => setScanFrequency(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                >
                  <option value="DAILY">Daily</option>
                  <option value="EVERY_6H">Every 6 hours</option>
                  <option value="HOURLY">Hourly</option>
                </select>
                <p className="text-sm text-gray-600 mt-2">Next scheduled scan: {nextScanTime}</p>
              </div>
            )}

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
          <button
            onClick={handleSaveScanSchedule}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save scan schedule'}
          </button>
        </div>
      </div>
    </div>
  )
}
