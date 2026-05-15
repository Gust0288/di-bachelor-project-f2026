import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, ChevronLeft } from 'lucide-react'
import { Spinner } from '../../components/Spinner/Spinner'
import InlineAlert from '../../components/InlineAlert/InlineAlert'
import { listRegistrations, type RegistrationListItem } from '../../api/admin'
import RegistrationDetailPanel from './RegistrationDetailPanel'
import AgeBadge from './AgeBadge'
import { getDaysAgo } from './getDaysAgo'
import { usePanelResize } from './usePanelResize'
import styles from './PendingSection.module.scss'

const dateFormatter = new Intl.DateTimeFormat('da-DK', { dateStyle: 'medium' })

function AgeBar({ submittedAt }: { submittedAt: string }) {
  const days = getDaysAgo(submittedAt)
  const pct = Math.min(100, (days / 14) * 100)
  const tier = days <= 3 ? 'low' : days <= 7 ? 'medium' : 'high'
  return (
    <div className={styles.ageBarTrack} data-tier={tier}>
      <div className={styles.ageBarFill} style={{ width: `${pct}%` }} />
    </div>
  )
}

interface Props {
  onStatusChange: () => void
}

export default function PendingSection({ onStatusChange }: Props) {
  const navigate = useNavigate()
  const [registrations, setRegistrations] = useState<RegistrationListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [listKey, setListKey] = useState(0)
  const { width: panelWidth, onMouseDown: handleResizeStart } = usePanelResize(420)

  useEffect(() => {
    setIsLoading(true)
    setError(null)
    listRegistrations('pending')
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
  }, [listKey, navigate, selectedId])

  const urgent = useMemo(
    () => registrations.filter((r) => getDaysAgo(r.created_at) > 7),
    [registrations],
  )
  const recent = useMemo(
    () => registrations.filter((r) => getDaysAgo(r.created_at) <= 7),
    [registrations],
  )

  const todayCount = useMemo(
    () => registrations.filter((r) => getDaysAgo(r.created_at) === 0).length,
    [registrations],
  )

  function handleStatusChange() {
    setListKey((k) => k + 1)
    onStatusChange()
  }

  function renderCard(reg: RegistrationListItem) {
    return (
      <div
        key={reg.id}
        className={styles.card}
        data-selected={selectedId === reg.id || undefined}
        data-urgent={getDaysAgo(reg.created_at) > 7 || undefined}
        onClick={() => setSelectedId(reg.id)}
      >
        <div className={styles.card__header}>
          <span className={styles.card__name}>{reg.company_name}</span>
          <AgeBadge submittedAt={reg.created_at} />
        </div>
        <span className={styles.card__cvr}>{reg.cvr_number}</span>
        <div className={styles.card__contact}>
          <span>{reg.contact_name}</span>
          <span className={styles.card__email}>{reg.contact_email}</span>
        </div>
        <div className={styles.card__footer}>
          <span className={styles.card__date}>{dateFormatter.format(new Date(reg.created_at))}</span>
        </div>
        <AgeBar submittedAt={reg.created_at} />
      </div>
    )
  }

  return (
    <div className={styles.container} data-has-selection={selectedId ? '' : undefined}>
      {/* ── Left column ─────────────────────────────── */}
      <div className={styles.left}>
        {/* Metrics */}
        <div className={styles.metrics}>
          <div className={styles.metricCard}>
            <span className={styles.metricCard__label}>Afventer i alt</span>
            <span className={styles.metricCard__value}>{registrations.length}</span>
          </div>
          <div className={styles.metricCard} data-accent="danger">
            <span className={styles.metricCard__label}>Over 7 dage</span>
            <span className={styles.metricCard__value}>{urgent.length}</span>
          </div>
          <div className={styles.metricCard}>
            <span className={styles.metricCard__label}>Indsendt i dag</span>
            <span className={styles.metricCard__value}>{todayCount}</span>
          </div>
        </div>

        {error && <InlineAlert tone="danger">{error}</InlineAlert>}

        {isLoading ? (
          <div className={styles.spinnerWrapper}>
            <Spinner aria-label="Indlæser afventende ansøgninger" />
          </div>
        ) : registrations.length === 0 ? (
          <p className={styles.empty}>Ingen afventende ansøgninger.</p>
        ) : (
          <div className={styles.cardList}>
            {urgent.length > 0 && (
              <div className={styles.section}>
                <div className={styles.section__urgentHeader}>
                  <AlertCircle size={14} />
                  <span>Afventer over 7 dage — kræver handling</span>
                </div>
                {urgent.map(renderCard)}
              </div>
            )}

            {recent.length > 0 && (
              <div className={styles.section}>
                {urgent.length > 0 && (
                  <div className={styles.section__header}>Nyere ansøgninger</div>
                )}
                {recent.map(renderCard)}
              </div>
            )}
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
