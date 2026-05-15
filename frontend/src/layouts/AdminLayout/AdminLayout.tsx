import type { ReactNode } from 'react'
import { LayoutGrid, Clock, List, LogOut, Timer } from 'lucide-react'
import Logo from '../../components/Logo/Logo'
import styles from './AdminLayout.module.scss'

export type AdminSection = 'overview' | 'pending' | 'activity' | 'sessions'

interface NavItem {
  id: AdminSection
  label: string
  icon: ReactNode
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Oversigt', icon: <LayoutGrid size={16} /> },
  { id: 'pending', label: 'Afventer', icon: <Clock size={16} /> },
  { id: 'sessions', label: 'Igangværende', icon: <Timer size={16} /> },
  { id: 'activity', label: 'Aktivitetslog', icon: <List size={16} /> },
]

interface AdminLayoutProps {
  children: ReactNode
  activeSection: AdminSection
  onSectionChange: (section: AdminSection) => void
  pendingCount: number
  onLogout: () => void
}

export default function AdminLayout({
  children,
  activeSection,
  onSectionChange,
  pendingCount,
  onLogout,
}: AdminLayoutProps) {
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebar__brand}>
          <Logo href="/" />
          <span className={styles.sidebar__brandLabel}>Admin</span>
        </div>

        <nav className={styles.sidebar__nav}>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={styles.sidebar__navItem}
              data-active={item.id === activeSection || undefined}
              onClick={() => onSectionChange(item.id)}
            >
              <span className={styles.sidebar__navIcon}>{item.icon}</span>
              <span className={styles.sidebar__navLabel}>{item.label}</span>
              {item.id === 'pending' && pendingCount > 0 && (
                <span className={styles.sidebar__badge}>{pendingCount}</span>
              )}
            </button>
          ))}
        </nav>

        <div className={styles.sidebar__footer}>
          <button className={styles.sidebar__logoutBtn} onClick={onLogout}>
            <LogOut size={16} />
            <span>Log ud</span>
          </button>
        </div>
      </aside>

      <div className={styles.content}>{children}</div>
    </div>
  )
}
