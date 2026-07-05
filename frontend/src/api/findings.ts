import apiClient from './client'
import { Finding, FindingSummary } from '../types'

interface FindingsListResponse {
  findings: Finding[]
  total: number
  page: number
  page_size: number
}

export const findingsApi = {
  async list(
    page: number = 1,
    pageSize: number = 20,
    filters?: {
      status?: string
      category?: string
      resource_group?: string
      risk_level?: string
      region?: string
      connection_id?: string
      search?: string
      sort_by?: string
    }
  ): Promise<FindingsListResponse> {
    const params: any = { page, page_size: pageSize }
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params[key] = value
      })
    }
    const { data } = await apiClient.get('/findings', { params })
    return data
  },

  async get(id: string): Promise<Finding> {
    const { data } = await apiClient.get(`/findings/${id}`)
    return data
  },

  async ignore(id: string, reason?: string): Promise<{ success: boolean }> {
    const { data } = await apiClient.post(`/findings/${id}/ignore`, { reason })
    return data
  },

  async unignore(id: string): Promise<{ success: boolean }> {
    const { data } = await apiClient.post(`/findings/${id}/unignore`)
    return data
  },

  async getSummary(connectionId?: string): Promise<FindingSummary> {
    const params: any = {}
    if (connectionId) params.connection_id = connectionId
    const { data } = await apiClient.get('/findings/summary/by-risk', { params })
    return data
  },
}
