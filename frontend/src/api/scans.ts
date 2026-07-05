import apiClient from './client'
import { Scan } from '../types'

interface ScanListResponse {
  scans: Scan[]
  total: number
  page: number
  page_size: number
}

export const scansApi = {
  async trigger(connectionId: string): Promise<Scan> {
    const { data } = await apiClient.post(`/connections/${connectionId}/scans`)
    return data
  },

  async list(page: number = 1, pageSize: number = 10, connectionId?: string): Promise<ScanListResponse> {
    const params: any = { page, page_size: pageSize }
    if (connectionId) params.connection_id = connectionId
    const { data } = await apiClient.get('/scans', { params })
    return data
  },

  async get(id: string): Promise<Scan> {
    const { data } = await apiClient.get(`/scans/${id}`)
    return data
  },

  async getLatest(connectionId: string): Promise<Scan> {
    const { data } = await apiClient.get(`/scans/latest/by-connection/${connectionId}`)
    return data
  },
}
