import apiClient from './client'
import { DashboardOverview } from '../types'

export const dashboardApi = {
  async getOverview(): Promise<DashboardOverview> {
    const { data } = await apiClient.get('/dashboard/overview')
    return data
  },
}
