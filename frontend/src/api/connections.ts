import apiClient from './client'
import { Connection, TrustPolicy, LocalIdentity } from '../types'

export const connectionsApi = {
  async create(name: string, provider: string = 'aws'): Promise<Connection> {
    const { data } = await apiClient.post('/connections', { name, provider })
    return data
  },

  async list(): Promise<Connection[]> {
    const { data } = await apiClient.get('/connections')
    return data
  },

  async get(id: string): Promise<Connection> {
    const { data } = await apiClient.get(`/connections/${id}`)
    return data
  },

  async update(id: string, role_arn: string): Promise<Connection> {
    const { data } = await apiClient.patch(`/connections/${id}`, { role_arn })
    return data
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/connections/${id}`)
  },

  async test(id: string): Promise<{ success: boolean; message: string; aws_account_id: string | null }> {
    const { data } = await apiClient.post(`/connections/${id}/test`)
    return data
  },

  async getTrustPolicy(id: string): Promise<TrustPolicy> {
    const { data } = await apiClient.get(`/connections/${id}/trust-policy`)
    return data
  },

  async getLocalIdentity(): Promise<LocalIdentity> {
    const { data } = await apiClient.get('/meta/local-identity')
    return data
  },
}
