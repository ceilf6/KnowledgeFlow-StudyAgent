/**
 * 应用布局壳 — 功能页面的统一外层
 */
import type { ReactNode } from 'react'
import AppNav from './AppNav'

interface AppLayoutProps {
  children: ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="app-shell">
      <div className="container">
        <AppNav />
        <main className="app-main">{children}</main>
      </div>
    </div>
  )
}
