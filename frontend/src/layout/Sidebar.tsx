import NavItem from './NavItem'

export default function Sidebar() {
  return (
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-blue-600">CloudPulse</h1>
      </div>

      <nav className="flex-1 px-3 space-y-2">
        <div className="text-xs font-semibold text-gray-500 uppercase px-4 py-2">Scan</div>
        <NavItem label="Overview" icon="🏠" href="/overview" />
        <NavItem label="Scan history" icon="📊" href="/scan-history" />
        <NavItem label="Schedules" icon="⏰" href="/schedules" disabled={true} tooltip="Coming soon" />

        <div className="text-xs font-semibold text-gray-500 uppercase px-4 py-2 mt-4">Findings</div>
        <NavItem label="All findings" icon="🔍" href="/findings" />
        <NavItem label="By resource" icon="📦" href="/findings-resource" />
        <NavItem label="By category" icon="🏷️" href="/findings-category" />
        <NavItem label="Ignored" icon="🚫" href="/findings-ignored" />

        <div className="text-xs font-semibold text-gray-500 uppercase px-4 py-2 mt-4">Configuration</div>
        <NavItem label="Connections" icon="🔗" href="/connections" />
        <NavItem label="Settings" icon="⚙️" href="/settings" />

        <div className="text-xs font-semibold text-gray-500 uppercase px-4 py-2 mt-4">Settings</div>
        <NavItem label="Integrations" icon="🔌" disabled={true} tooltip="Coming soon" />
        <NavItem label="Notifications" icon="🔔" disabled={true} tooltip="Coming soon" />
        <NavItem label="Access" icon="👤" disabled={true} tooltip="Coming soon" />
        <NavItem label="Audit log" icon="📋" disabled={true} tooltip="Coming soon" />
      </nav>

      <div className="p-4 border-t border-gray-200 text-xs text-gray-500">
        CloudPulse v0.1.0
      </div>
    </div>
  )
}
