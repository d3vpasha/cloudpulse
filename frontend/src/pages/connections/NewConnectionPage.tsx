import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { connectionsApi } from '../../api/connections'

function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 inline-flex items-center gap-1"
    >
      {copied ? '✓ Copied' : `📋 ${label}`}
    </button>
  )
}

export default function NewConnectionPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()
  const [step, setStep] = useState<1 | 2 | 3 | 4>(id ? 2 : 1)
  const [name, setName] = useState('')
  const [roleArn, setRoleArn] = useState('')
  const [connectionId, setConnectionId] = useState(id)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [expandedOption, setExpandedOption] = useState<'console' | 'cli' | null>(null)

  const { data: connection } = useQuery({
    queryKey: ['connection', connectionId],
    queryFn: () => connectionId ? connectionsApi.get(connectionId) : null,
    enabled: !!connectionId,
  })

  // Load existing role ARN when editing a connection
  useEffect(() => {
    if (connection && connection.role_arn && !roleArn) {
      setRoleArn(connection.role_arn)
    }
  }, [connection, roleArn])

  const { data: trustPolicy } = useQuery({
    queryKey: ['trust-policy', connectionId],
    queryFn: () => connectionId ? connectionsApi.getTrustPolicy(connectionId) : null,
    enabled: connectionId !== undefined && step >= 2,
  })

  const handleCreateConnection = async () => {
    setLoading(true)
    setError(null)
    try {
      const conn = await connectionsApi.create(name)
      setConnectionId(conn.id)
      setStep(2)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create connection')
    }
    setLoading(false)
  }

  const handleUpdateRoleArn = async () => {
    if (!connectionId) return
    setLoading(true)
    setError(null)
    try {
      await connectionsApi.update(connectionId, roleArn)
      setStep(4)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update connection')
    }
    setLoading(false)
  }

  const handleTestConnection = async () => {
    if (!connectionId) return
    setLoading(true)
    setError(null)
    setTestResult(null)
    try {
      const result = await connectionsApi.test(connectionId)
      setTestResult(result)
      if (result.success) {
        setStep(4)
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Connection test failed')
      setTestResult({ success: false, message: err.response?.data?.detail || 'Test failed' })
    }
    setLoading(false)
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Add AWS Connection</h1>

      <div className="max-w-2xl">
        {step === 1 && connectionId === undefined && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Step 1: Connection Name</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Connection name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Production AWS Account"
                  className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {error && <div className="bg-red-50 border border-red-200 rounded p-3 text-red-800 text-sm">{error}</div>}
              <button
                onClick={handleCreateConnection}
                disabled={!name || loading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Continue'}
              </button>
            </div>
          </div>
        )}

        {step === 2 && connectionId && trustPolicy && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Step 2: Create IAM Role in Your Target AWS Account</h2>
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <p className="font-semibold text-blue-900 mb-2">📋 Connection Details</p>
                <div className="space-y-2 text-sm">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">CloudPulse Principal:</span>
                      <CopyButton text={trustPolicy.local_arn} label="Copy" />
                    </div>
                    <code className="block bg-white px-2 py-1 rounded border border-blue-200 font-mono text-xs text-blue-600 mt-1 break-all">
                      {trustPolicy.local_arn}
                    </code>
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">External ID (secret):</span>
                      <CopyButton text={trustPolicy.external_id} label="Copy" />
                    </div>
                    <code className="block bg-white px-2 py-1 rounded border border-blue-200 font-mono text-xs text-blue-600 mt-1">
                      {trustPolicy.external_id}
                    </code>
                  </div>
                </div>
              </div>

              {/* AWS Console Method */}
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedOption(expandedOption === 'console' ? null : 'console')}
                  className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between font-semibold text-gray-900"
                >
                  <span>Option 1: AWS Console (Step-by-step)</span>
                  <span className="text-lg">{expandedOption === 'console' ? '▼' : '▶'}</span>
                </button>
                {expandedOption === 'console' && (
                <div className="px-4 py-3 border-t border-gray-300">
                  <h3 className="font-semibold text-gray-900 mb-3">AWS Console Instructions</h3>
                <ol className="space-y-3 text-sm text-gray-700">
                  <li>
                    <span className="font-medium">1. Go to AWS Console</span>
                  </li>
                  <li>
                    <span className="font-medium">2. Log into your target AWS account</span>
                  </li>
                  <li>
                    <span className="font-medium">3. Navigate to IAM → Roles</span>
                  </li>
                  <li>
                    <span className="font-medium">4. Click "Create role"</span>
                  </li>
                  <li>
                    <span className="font-medium">5. Select "AWS account" as the trusted entity type</span>
                  </li>
                  <li>
                    <span className="font-medium">6. Click "Another AWS account"</span>
                  </li>
                  <li>
                    <span className="font-medium">7. Enter the AWS Account ID</span>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 bg-gray-100 px-2 py-1 rounded font-mono text-xs text-gray-800">
                        {trustPolicy.local_account_id}
                      </code>
                      <CopyButton text={trustPolicy.local_account_id} />
                    </div>
                    <p className="text-xs text-gray-600 mt-1">This is our account ID at CloudPulse</p>
                  </li>
                  <li>
                    <span className="font-medium">8. Check "Require external ID" & enter the following external ID:</span>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 bg-gray-100 px-2 py-1 rounded font-mono text-xs text-gray-800">
                        {trustPolicy.external_id}
                      </code>
                      <CopyButton text={trustPolicy.external_id} />
                    </div>
                  </li>
                  <li>
                    <span className="font-medium">9. Create the role (without permissions yet)</span>
                    <p className="text-xs text-gray-600 mt-1">Click "Create role" — you'll add permissions next</p>
                  </li>
                  <li>
                    <span className="font-medium">10. Add permissions policy</span>
                    <p className="text-xs text-gray-600 mt-1">Once the role is created, follow these steps:</p>
                    <ul className="text-xs text-gray-600 mt-2 ml-4 space-y-1">
                      <li>• Click on the role name to open it</li>
                      <li>• Go to <span className="font-medium">Permissions</span> tab</li>
                      <li>• Under <span className="font-medium">Permissions policies</span>, click <span className="font-medium">Add permissions</span></li>
                      <li>• Click <span className="font-medium">Create inline policy</span></li>
                      <li>• Choose the <span className="font-medium">JSON</span> tab</li>
                      <li>• Paste this policy:</li>
                    </ul>
                    <div className="flex items-start gap-2 mt-2">
                      <pre className="flex-1 bg-gray-100 px-2 py-1 rounded font-mono text-xs overflow-auto max-h-32">
                        {JSON.stringify(trustPolicy.permissions_policy, null, 2)}
                      </pre>
                      <CopyButton text={JSON.stringify(trustPolicy.permissions_policy, null, 2)} label="Copy" />
                    </div>
                    <ul className="text-xs text-gray-600 mt-2 ml-4 space-y-1">
                      <li>• Set a policy name (e.g., "CloudPulseReadOnly") and click <span className="font-medium">Create policy</span></li>
                    </ul>
                  </li>
                  <li>
                    <span className="font-medium">7. Copy the role ARN</span>
                    <p className="text-xs text-gray-600 mt-1">You'll need this in the next step. Find it in the role summary at the top of the page</p>
                  </li>
                </ol>
                </div>
                )}
              </div>

              {/* AWS CLI Method */}
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedOption(expandedOption === 'cli' ? null : 'cli')}
                  className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between font-semibold text-gray-900"
                >
                  <span>Option 2: AWS CLI (Faster)</span>
                  <span className="text-lg">{expandedOption === 'cli' ? '▼' : '▶'}</span>
                </button>
                {expandedOption === 'cli' && (
                <div className="px-4 py-3 border-t border-gray-300">
                  <h3 className="font-semibold text-gray-900 mb-3">AWS CLI Commands</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Run these commands in your target AWS account:
                </p>

                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-medium text-gray-700">Step 1: Create trust policy file</p>
                      <CopyButton text={`cat > /tmp/trust-policy.json <<'EOF'\n${JSON.stringify(trustPolicy.trust_policy, null, 2)}\nEOF`} label="Copy command" />
                    </div>
                    <code className="block bg-gray-900 text-gray-100 px-3 py-2 rounded font-mono text-xs overflow-x-auto">
                      cat &gt; /tmp/trust-policy.json &lt;&lt;'EOF'{'\n'}
                      {JSON.stringify(trustPolicy.trust_policy, null, 2)}{'\n'}
                      EOF
                    </code>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-medium text-gray-700">Step 2: Create permissions policy file</p>
                      <CopyButton text={`cat > /tmp/permissions-policy.json <<'EOF'\n${JSON.stringify(trustPolicy.permissions_policy, null, 2)}\nEOF`} label="Copy command" />
                    </div>
                    <code className="block bg-gray-900 text-gray-100 px-3 py-2 rounded font-mono text-xs overflow-x-auto">
                      cat &gt; /tmp/permissions-policy.json &lt;&lt;'EOF'{'\n'}
                      {JSON.stringify(trustPolicy.permissions_policy, null, 2)}{'\n'}
                      EOF
                    </code>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-medium text-gray-700">Step 3: Create the role</p>
                      <CopyButton text={`aws iam create-role \\\n  --role-name CloudPulse-ReadOnly \\\n  --assume-role-policy-document file:///tmp/trust-policy.json`} label="Copy command" />
                    </div>
                    <code className="block bg-gray-900 text-gray-100 px-3 py-2 rounded font-mono text-xs overflow-x-auto">
                      aws iam create-role \{'\n'}
                      {'  '}--role-name CloudPulse-ReadOnly \{'\n'}
                      {'  '}--assume-role-policy-document file:///tmp/trust-policy.json
                    </code>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-medium text-gray-700">Step 4: Attach permissions</p>
                      <CopyButton text={`aws iam put-role-policy \\\n  --role-name CloudPulse-ReadOnly \\\n  --policy-name CloudPulseReadOnly \\\n  --policy-document file:///tmp/permissions-policy.json`} label="Copy command" />
                    </div>
                    <code className="block bg-gray-900 text-gray-100 px-3 py-2 rounded font-mono text-xs overflow-x-auto">
                      aws iam put-role-policy \{'\n'}
                      {'  '}--role-name CloudPulse-ReadOnly \{'\n'}
                      {'  '}--policy-name CloudPulseReadOnly \{'\n'}
                      {'  '}--policy-document file:///tmp/permissions-policy.json
                    </code>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-medium text-gray-700">Step 5: Get the role ARN</p>
                      <CopyButton text={`aws iam get-role --role-name CloudPulse-ReadOnly --query 'Role.Arn' --output text`} label="Copy command" />
                    </div>
                    <code className="block bg-gray-900 text-gray-100 px-3 py-2 rounded font-mono text-xs overflow-x-auto">
                      aws iam get-role --role-name CloudPulse-ReadOnly --query 'Role.Arn' --output text
                    </code>
                    <p className="text-xs text-gray-600 mt-1">Copy the output (the role ARN) for Step 3</p>
                  </div>
                </div>
                </div>
                )}
              </div>

              <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300"
                >
                  ← Previous
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                >
                  Next: Paste Role ARN →
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && connectionId && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Step 3: Paste IAM Role ARN</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role ARN</label>
                <input
                  type="text"
                  value={roleArn}
                  onChange={(e) => setRoleArn(e.target.value)}
                  placeholder="arn:aws:iam::123456789012:role/CloudPulse-ReadOnly"
                  className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
              </div>
              {error && <div className="bg-red-50 border border-red-200 rounded p-3 text-red-800 text-sm">{error}</div>}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300"
                >
                  ← Previous
                </button>
                <button
                  onClick={handleUpdateRoleArn}
                  disabled={!roleArn || loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Confirm Role →'}
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 4 && connectionId && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Step 4: Test Connection</h2>
            <div className="space-y-4">
              <p className="text-gray-600 text-sm">Test the connection to verify the IAM role is properly configured.</p>
              {testResult && (
                <div className={`border rounded p-3 text-sm ${
                  testResult.success
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                  {testResult.message}
                </div>
              )}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300"
                >
                  ← Previous
                </button>
                <button
                  onClick={handleTestConnection}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Testing...' : 'Test Connection →'}
                </button>
              </div>
              {testResult?.success && (
                <button
                  onClick={() => navigate('/connections')}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 mt-3"
                >
                  Done
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
