import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout, { type AdminSection } from '../../layouts/AdminLayout/AdminLayout'
import OverviewSection from './OverviewSection'
import PendingSection from './PendingSection'
import ActivitySection from './ActivitySection'
import SessionsSection from './SessionsSection'
import { getStats, type AdminStats } from '../../api/admin'

export default function AdminPage() {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState<AdminSection>('overview')
  const [stats, setStats] = useState<AdminStats>({ total: 0, pending: 0, approved: 0, rejected: 0 })
  const [statsKey, setStatsKey] = useState(0)

  useEffect(() => {
    if (!sessionStorage.getItem('admin_token')) {
      navigate('/login')
    }
  }, [navigate])

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch((err: Error) => {
        if (err.message.includes('401')) {
          sessionStorage.removeItem('admin_token')
          navigate('/login')
        }
      })
  }, [statsKey, navigate])

  function handleLogout() {
    sessionStorage.removeItem('admin_token')
    navigate('/login')
  }

  function handleStatusChange() {
    setStatsKey((k) => k + 1)
  }

  return (
    <AdminLayout
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      pendingCount={stats.pending}
      onLogout={handleLogout}
    >
      {activeSection === 'overview' && (
        <OverviewSection stats={stats} onStatusChange={handleStatusChange} />
      )}
      {activeSection === 'pending' && (
        <PendingSection onStatusChange={handleStatusChange} />
      )}
      {activeSection === 'sessions' && <SessionsSection />}
      {activeSection === 'activity' && <ActivitySection />}
    </AdminLayout>
  )
}
