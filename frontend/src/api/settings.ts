import apiClient from './client'
import { Settings } from '../types'

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

  async getRegions(): Promise<{ regions: string[] }> {
    const { data } = await apiClient.get('/meta/regions')
    return data
  },
}
