import { Link } from 'react-router-dom'

interface NavItemProps {
  label: string
  icon?: string
  href?: string
  disabled?: boolean
  tooltip?: string
}

export default function NavItem({ label, icon, href, disabled = false, tooltip }: NavItemProps) {
  const baseClass = 'flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors'
  const enabledClass = 'text-gray-700 hover:bg-gray-100 cursor-pointer'
  const disabledClass = 'text-gray-400 cursor-not-allowed opacity-50'

  const content = (
    <div title={tooltip}>
      {icon && <span className="mr-3">{icon}</span>}
      {label}
    </div>
  )

  if (disabled) {
    return <div className={`${baseClass} ${disabledClass}`}>{content}</div>
  }

  return (
    <Link to={href || '#'} className={`${baseClass} ${enabledClass}`}>
      {content}
    </Link>
  )
}
