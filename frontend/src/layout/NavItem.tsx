import { Link } from 'react-router-dom'

interface NavItemProps {
  label: string
  icon?: string
  href?: string
  disabled?: boolean
  tooltip?: string
  collapsed?: boolean
}

export default function NavItem({ label, icon, href, disabled = false, tooltip, collapsed }: NavItemProps) {
  const baseClass = 'flex items-center py-2 rounded-lg text-sm font-medium transition-colors'
  const paddingClass = collapsed ? 'justify-center px-2' : 'px-4'
  const enabledClass = 'text-gray-700 hover:bg-gray-100 cursor-pointer'
  const disabledClass = 'text-gray-400 cursor-not-allowed opacity-50'

  const content = (
    <div title={collapsed ? label : tooltip}>
      {icon && <span className={collapsed ? undefined : 'mr-3'}>{icon}</span>}
      {!collapsed && label}
    </div>
  )

  if (disabled) {
    return <div className={`${baseClass} ${paddingClass} ${disabledClass}`}>{content}</div>
  }

  return (
    <Link to={href || '#'} className={`${baseClass} ${paddingClass} ${enabledClass}`}>
      {content}
    </Link>
  )
}
