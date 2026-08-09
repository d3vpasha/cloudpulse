import { useState } from 'react'
import NavItem from './NavItem'

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebar-collapsed') === 'true')

  const toggleCollapsed = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('sidebar-collapsed', String(next))
  }

  return (
    <div className={`${collapsed ? 'w-16' : 'w-64'} transition-all duration-200 overflow-hidden bg-white border-r border-gray-200 min-h-screen flex flex-col`}>
      <div className={`p-4 flex items-center ${collapsed ? 'justify-center' : ''}`}>
        {!collapsed && <h1 className="text-2xl font-bold text-blue-600">CloudPulse</h1>}
        <button
          onClick={toggleCollapsed}
          className="ml-auto flex items-center justify-center w-7 h-7 rounded bg-gray-800 text-white text-xs hover:bg-gray-700"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      <nav className="flex-1 px-3 space-y-2">
        {!collapsed && <div className="text-xs font-semibold text-gray-500 uppercase px-4 py-2">Scan</div>}
        <NavItem label="Overview" icon="🏠" href="/overview" collapsed={collapsed} />
        <NavItem label="Scan history" icon="📊" href="/scan-history" collapsed={collapsed} />

        {!collapsed && <div className="text-xs font-semibold text-gray-500 uppercase px-4 py-2 mt-4">Findings</div>}
        <NavItem label="All findings" icon="🔍" href="/findings" collapsed={collapsed} />

        {!collapsed && <div className="text-xs font-semibold text-gray-500 uppercase px-4 py-2 mt-4">Configuration</div>}
        <NavItem label="Connections" icon="🔗" href="/connections" collapsed={collapsed} />
        <NavItem label="Settings" icon="⚙️" href="/settings" collapsed={collapsed} />

        {!collapsed && <div className="text-xs font-semibold text-gray-500 uppercase px-4 py-2 mt-4">Settings</div>}
        <NavItem label="Integrations" icon="🔌" disabled={true} tooltip="Coming soon" collapsed={collapsed} />
        <NavItem label="Notifications" icon="🔔" disabled={true} tooltip="Coming soon" collapsed={collapsed} />
        <NavItem label="Access" icon="👤" disabled={true} tooltip="Coming soon" collapsed={collapsed} />
        <NavItem label="Audit log" icon="📋" disabled={true} tooltip="Coming soon" collapsed={collapsed} />
      </nav>

      {!collapsed && (
        <div className="p-4 border-t border-gray-200 text-xs text-gray-500">
          CloudPulse v0.1.0
        </div>
      )}
    </div>
  )
}
