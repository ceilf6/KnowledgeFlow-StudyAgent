import { NavLink } from 'react-router-dom'
import { useSettingsStore } from '../store/settingsStore'
import ThemeSwitcher from './ThemeSwitcher'

const NAV_ITEMS = [
  { to: '/study', label: '智能学习' },
  { to: '/plans', label: '学习计划' },
  { to: '/practice', label: '练习测试' },
  { to: '/resources', label: '资源管理' },
  { to: '/settings', label: '设置' },
]

export default function AppNav() {
  const provider = useSettingsStore((s) => s.provider)

  return (
    <nav className="app-nav">
      <NavLink to="/" className="nav-logo">
        <div className="nav-logo-mark"></div>
        <span className="nav-logo-text">KnowledgeFlow</span>
      </NavLink>
      <ul className="app-nav-links">
        {NAV_ITEMS.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                `app-nav-link ${isActive ? 'active' : ''}`
              }
            >
              {item.label}
            </NavLink>
          </li>
        ))}
        {provider === 'demo' && (
          <li>
            <span className="badge badge-demo">演示模式</span>
          </li>
        )}
        <li>
          <ThemeSwitcher />
        </li>
      </ul>
    </nav>
  )
}
