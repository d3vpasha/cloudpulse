import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { settingsApi } from '../../api/settings'

export default function PreferencesPage() {
  const [providers, setProviders] = useState<string[]>(['aws'])
  const [regions, setRegions] = useState<string[]>(['us-east-1'])
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [expandedProvider, setExpandedProvider] = useState<string>('aws')

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
            <div className="flex items-center p-3 border border-gray-200 rounded-lg opacity-50 cursor-not-allowed">
              <input
                type="checkbox"
                id="provider-gcp"
                disabled
                checked={false}
                className="rounded border-gray-300"
              />
              <label htmlFor="provider-gcp" className="ml-4 text-gray-900 flex items-center flex-1">
                <img src="https://koul.io/images/tech/tech-gcp.svg" alt="GCP" className="h-10 w-10 object-contain" />
                <div className="ml-4">
                  <span className="font-medium block">GCP</span>
                  <p className="text-sm text-gray-600">(coming soon)</p>
                </div>
              </label>
            </div>

            {/* Azure Provider */}
            <div className="flex items-center p-3 border border-gray-200 rounded-lg opacity-50 cursor-not-allowed">
              <input
                type="checkbox"
                id="provider-azure"
                disabled
                checked={false}
                className="rounded border-gray-300"
              />
              <label htmlFor="provider-azure" className="ml-4 text-gray-900 flex items-center flex-1">
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Microsoft_logo.svg/960px-Microsoft_logo.svg.png" alt="Azure" className="h-10 w-10 object-contain" />
                <div className="ml-4">
                  <span className="font-medium block">Azure</span>
                  <p className="text-sm text-gray-600">(coming soon)</p>
                </div>
              </label>
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
            {loading ? 'Saving...' : 'Save settings'}
          </button>
        </div>
      </div>
    </div>
  )
}
