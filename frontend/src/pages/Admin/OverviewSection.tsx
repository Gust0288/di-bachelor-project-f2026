import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { Spinner } from '../../components/Spinner/Spinner'
import InlineAlert from '../../components/InlineAlert/InlineAlert'
import { listRegistrations, type AdminStats, type RegistrationListItem } from '../../api/admin'
import RegistrationDetailPanel from './RegistrationDetailPanel'
import { usePanelResize } from './usePanelResize'
import styles from './OverviewSection.module.scss'

const STATUS_FILTERS = [
  { value: '', label: 'Alle' },
  { value: 'pending', label: 'Afventer' },
  { value: 'approved', label: 'Godkendt' },
  { value: 'rejected', label: 'Afvist' },
] as const

const STATUS_LABELS: Record<string, string> = {
  pending: 'Afventer',
  approved: 'Godkendt',
  rejected: 'Afvist',
}

const dateFormatter = new Intl.DateTimeFormat('da-DK', { dateStyle: 'medium' })

function MetricCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={styles.metricCard} data-accent={accent || undefined}>
      <span className={styles.metricCard__label}>{label}</span>
      <span className={styles.metricCard__value}>{value}</span>
    </div>
  )
}

interface Props {
  stats: AdminStats
  onStatusChange: () => void
}

export default function OverviewSection({ stats, onStatusChange }: Props) {
  const navigate = useNavigate()
  const [registrations, setRegistrations] = useState<RegistrationListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'' | 'pending' | 'approved' | 'rejected'>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [listKey, setListKey] = useState(0)
  const { width: panelWidth, onMouseDown: handleResizeStart } = usePanelResize(420)

  useEffect(() => {
    setIsLoading(true)
    setError(null)
    listRegistrations(statusFilter || undefined)
      .then((rows) => {
        setRegistrations(rows)
        if (selectedId && !rows.find((r) => r.id === selectedId)) {
          setSelectedId(null)
        }
      })
      .catch((err: Error) => {
        if (err.message.includes('401')) {
          sessionStorage.removeItem('admin_token')
          navigate('/login')
          return
        }
        setError(err.message)
      })
      .finally(() => setIsLoading(false))
  }, [statusFilter, listKey, navigate, selectedId])

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return registrations
    const q = searchQuery.toLowerCase()
    return registrations.filter(
      (r) =>
        r.company_name.toLowerCase().includes(q) ||
        r.cvr_number.toLowerCase().includes(q) ||
        r.contact_name.toLowerCase().includes(q),
    )
  }, [registrations, searchQuery])

  function handleStatusChange() {
    setListKey((k) => k + 1)
    onStatusChange()
  }

  return (
    <div className={styles.container} data-has-selection={selectedId ? '' : undefined}>
      {/* ── Left column ─────────────────────────────── */}
      <div className={styles.left}>
        {/* Metrics */}
        <div className={styles.metrics}>
          <MetricCard label="Total" value={stats.total} />
          <MetricCard label="Afventer" value={stats.pending} accent />
          <MetricCard label="Godkendt" value={stats.approved} />
          <MetricCard label="Afvist" value={stats.rejected} />
        </div>

        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.filterPills}>
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                className={styles.filterPill}
                data-active={statusFilter === f.value || undefined}
                onClick={() => setStatusFilter(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <input
            className={styles.search}
            type="text"
            placeholder="Søg firma eller CVR…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Table */}
        {error && <InlineAlert tone="danger">{error}</InlineAlert>}

        {isLoading ? (
          <div className={styles.spinnerWrapper}>
            <Spinner aria-label="Indlæser ansøgninger" />
          </div>
        ) : filtered.length === 0 ? (
          <p className={styles.empty}>Ingen ansøgninger fundet.</p>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <colgroup>
                <col style={{ width: '28%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '24%' }} />
                <col style={{ width: '18%' }} />
                <col style={{ width: '16%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Firma</th>
                  <th>CVR</th>
                  <th>Kontaktperson</th>
                  <th>Dato</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((reg) => (
                  <tr
                    key={reg.id}
                    data-selected={selectedId === reg.id || undefined}
                    onClick={() => setSelectedId(reg.id)}
                  >
                    <td className={styles.cellFirma}>{reg.company_name}</td>
                    <td className={styles.cellCvr}>{reg.cvr_number}</td>
                    <td>
                      <span>{reg.contact_name}</span>
                      <span className={styles.cellSub}>{reg.contact_email}</span>
                    </td>
                    <td>{dateFormatter.format(new Date(reg.created_at))}</td>
                    <td>
                      <span className={styles.statusBadge} data-status={reg.status}>
                        {STATUS_LABELS[reg.status] ?? reg.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Resize handle ───────────────────────────── */}
      <div className={styles.resizeHandle} onMouseDown={handleResizeStart} />

      {/* ── Right column (detail panel) ──────────────── */}
      <div className={styles.right} style={{ width: panelWidth, minWidth: panelWidth }}>
        {selectedId ? (
          <>
            <button className={styles.mobileBack} onClick={() => setSelectedId(null)}>
              <ChevronLeft size={16} />
              Tilbage til listen
            </button>
            <RegistrationDetailPanel
              key={selectedId}
              registrationId={selectedId}
              onStatusChange={handleStatusChange}
            />
          </>
        ) : (
          <div className={styles.emptyPanel}>
            <p>Vælg en ansøgning for at se detaljer</p>
          </div>
        )}
      </div>
    </div>
  )
}
