import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout, { type AdminSection } from '../../layouts/AdminLayout/AdminLayout'
import OverviewSection from './OverviewSection'
import PendingSection from './PendingSection'
import ActivitySection from './ActivitySection'
import SessionsSection from './SessionsSection'
import { getStats, type AdminStats } from '../../api/admin'

const VALID_SECTIONS: AdminSection[] = ['overview', 'pending', 'activity', 'sessions']

function getSectionFromHash(): AdminSection {
  const hash = window.location.hash.slice(1) as AdminSection
  return VALID_SECTIONS.includes(hash) ? hash : 'overview'
}

export default function AdminPage() {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState<AdminSection>(getSectionFromHash)
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

  useEffect(() => {
    const handleHashChange = () => setActiveSection(getSectionFromHash())
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  function handleSectionChange(section: AdminSection) {
    window.location.hash = section
    setActiveSection(section)
  }

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
      onSectionChange={handleSectionChange}
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
