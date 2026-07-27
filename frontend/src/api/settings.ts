import apiClient from './client'
import { Settings, PlanDetails } from '../types'

export const settingsApi = {
  async get(): Promise<Settings> {
    const { data } = await apiClient.get('/settings')
    return data
  },

  async update(updates: {
    active_providers?: string[]
    active_regions?: string[]
    log_retention_threshold_days?: number
  }): Promise<Settings> {
    const { data } = await apiClient.put('/settings', updates)
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
