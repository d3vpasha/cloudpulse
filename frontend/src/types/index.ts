export interface Connection {
  id: string
  name: string
  provider: 'aws' | 'gcp' | 'azure'
  aws_account_id: string | null
  role_arn: string | null
  external_id: string
  status: 'pending' | 'connected' | 'error'
  last_tested_at: string | null
  last_test_error: string | null
  created_at: string
}

export interface Scan {
  id: string
  connection_id: string
  status: 'pending' | 'running' | 'succeeded' | 'partial_failure' | 'failed'
  trigger: 'manual' | 'scheduled'
  started_at: string | null
  finished_at: string | null
  regions_scanned: string[]
  resource_count: number
  finding_count: number
  error_message: string | null
  created_at: string
}

export interface Finding {
  id: string
  check_type: string
  category: 'cost' | 'security'
  resource_group: 'storage' | 'network' | 'compute'
  resource_type: string
  resource_id: string
  region: string
  title: string
  description: string
  risk_level: 'critical' | 'high' | 'medium' | 'low'
  priority_rank: number
  estimated_monthly_savings: number
  status: 'open' | 'ignored' | 'resolved'
  first_detected_at: string
  last_detected_at: string
  ignored_reason: string | null
  raw_metadata: Record<string, any>
}

export interface FindingSummary {
  total_findings: number
  critical: number
  high: number
  medium: number
  low: number
  informational: number
  total_monthly_savings: number
}

export interface Settings {
  active_providers: string[]
  active_regions: string[]
}

export interface DashboardOverview {
  connections: Connection[]
  latest_scan: Scan | null
  summary: FindingSummary
  risk_distribution: Record<string, number>
  top_findings: Finding[]
}

export interface TrustPolicy {
  local_account_id: string
  local_arn: string
  external_id: string
  trust_policy: Record<string, any>
  permissions_policy: Record<string, any>
}

export interface LocalIdentity {
  account: string
  arn: string
  user_id: string
}
