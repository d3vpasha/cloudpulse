import apiClient from './client'
import { Settings, PlanDetails } from '../types'

export const settingsApi = {
  async get(): Promise<Settings> {
    const { data } = await apiClient.get('/settings')
    return data
  },

  async update(active_providers?: string[], active_regions?: string[]): Promise<Settings> {
    const { data } = await apiClient.put('/settings', {
      active_providers,
      active_regions,
    })
    return data
  },

  async getRegions(): Promise<{ regions: Record<string, Array<{ code: string; name: string }>> }> {
    const { data } = await apiClient.get('/meta/regions')
    return data
  },

  async getPlans(): Promise<{ plans: PlanDetails[] }> {
    const { data } = await apiClient.get('/meta/plans')
    return data
  },
}
