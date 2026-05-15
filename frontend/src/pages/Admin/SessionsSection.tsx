import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, ChevronLeft } from 'lucide-react'
import { Spinner } from '../../components/Spinner/Spinner'
import InlineAlert from '../../components/InlineAlert/InlineAlert'
import { listSessions, type SessionListItem } from '../../api/admin'
import SessionDetailPanel from './SessionDetailPanel'
import AgeBadge from './AgeBadge'
import { getDaysAgo } from './getDaysAgo'
import { usePanelResize } from './usePanelResize'
import styles from './SessionsSection.module.scss'

const dateFormatter = new Intl.DateTimeFormat('da-DK', { dateStyle: 'medium' })

const TOTAL_STEPS = 10

function getDaysUntilExpiry(expiresAt: string): number {
  const ms = new Date(expiresAt).getTime() - Date.now()
  return Math.ceil(ms / (1000 * 60 * 60 * 24))
}

function ExpiryBadge({ expiresAt }: { expiresAt: string }) {
  const days = getDaysUntilExpiry(expiresAt)
  const tier = days <= 3 ? 'critical' : days <= 7 ? 'warning' : 'normal'
  if (tier === 'normal') return null
  return (
    <span className={styles.expiryBadge} data-tier={tier}>
      Udløber om {days} dag{days !== 1 ? 'e' : ''}
    </span>
  )
}

function ProgressBar({ currentStep }: { currentStep: number }) {
  const pct = Math.min(100, (currentStep / TOTAL_STEPS) * 100)
  return (
    <div className={styles.progressTrack}>
      <div className={styles.progressFill} style={{ width: `${pct}%` }} />
    </div>
  )
}

export default function SessionsSection() {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState<SessionListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { width: panelWidth, onMouseDown: handleResizeStart } = usePanelResize(420)

  useEffect(() => {
    setIsLoading(true)
    setError(null)
    listSessions()
      .then((rows) => {
        setSessions(rows)
        if (selectedId && !rows.find((s) => s.id === selectedId)) {
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
  }, [navigate, selectedId])

  const expiringSoon = useMemo(
    () => sessions.filter((s) => getDaysUntilExpiry(s.expires_at) <= 3),
    [sessions],
  )
  const active24h = useMemo(
    () => sessions.filter((s) => getDaysAgo(s.updated_at) === 0),
    [sessions],
  )
  const stagnated = useMemo(
    () => sessions.filter((s) => getDaysAgo(s.updated_at) >= 3),
    [sessions],
  )
  const regular = useMemo(
    () => sessions.filter((s) => getDaysUntilExpiry(s.expires_at) > 3),
    [sessions],
  )

  function renderCard(session: SessionListItem) {
    const stepPct = Math.round((session.current_step / TOTAL_STEPS) * 100)
    return (
      <div
        key={session.id}
        className={styles.card}
        data-selected={selectedId === session.id || undefined}
        data-expiring={getDaysUntilExpiry(session.expires_at) <= 3 || undefined}
        onClick={() => setSelectedId(session.id)}
      >
        <div className={styles.card__header}>
          <span className={styles.card__name}>
            {session.company_cvr ? `CVR ${session.company_cvr}` : 'Ukendt virksomhed'}
          </span>
          <AgeBadge submittedAt={session.created_at} />
        </div>
        {session.contact_name && (
          <div className={styles.card__contact}>
            <span>{session.contact_name}</span>
            {session.contact_email && (
              <span className={styles.card__email}>{session.contact_email}</span>
            )}
          </div>
        )}
        <div className={styles.card__footer}>
          <span className={styles.card__stepLabel}>
            Trin {session.current_step} af {TOTAL_STEPS} ({stepPct}%)
          </span>
          <ExpiryBadge expiresAt={session.expires_at} />
        </div>
        <ProgressBar currentStep={session.current_step} />
        <div className={styles.card__date}>
          Sidst aktiv: {dateFormatter.format(new Date(session.updated_at))}
        </div>
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
            <span className={styles.metricCard__label}>I gang i alt</span>
            <span className={styles.metricCard__value}>{sessions.length}</span>
          </div>
          <div className={styles.metricCard}>
            <span className={styles.metricCard__label}>Aktive 24 timer</span>
            <span className={styles.metricCard__value}>{active24h.length}</span>
          </div>
          <div className={styles.metricCard} data-accent="warning">
            <span className={styles.metricCard__label}>Stagneret &gt;3 dage</span>
            <span className={styles.metricCard__value}>{stagnated.length}</span>
          </div>
          <div className={styles.metricCard} data-accent="danger">
            <span className={styles.metricCard__label}>Udløber om &lt;3 dage</span>
            <span className={styles.metricCard__value}>{expiringSoon.length}</span>
          </div>
        </div>

        {error && <InlineAlert tone="danger">{error}</InlineAlert>}

        {isLoading ? (
          <div className={styles.spinnerWrapper}>
            <Spinner aria-label="Indlæser igangværende sessioner" />
          </div>
        ) : sessions.length === 0 ? (
          <p className={styles.empty}>Ingen igangværende sessioner.</p>
        ) : (
          <div className={styles.cardList}>
            {expiringSoon.length > 0 && (
              <div className={styles.section}>
                <div className={styles.section__urgentHeader}>
                  <AlertCircle size={14} />
                  <span>Data slettes snart — kontakt disse brugere nu</span>
                </div>
                {expiringSoon.map(renderCard)}
              </div>
            )}

            {regular.length > 0 && (
              <div className={styles.section}>
                {expiringSoon.length > 0 && (
                  <div className={styles.section__header}>Øvrige aktive sessioner</div>
                )}
                {regular.map(renderCard)}
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
            <SessionDetailPanel key={selectedId} sessionId={selectedId} />
          </>
        ) : (
          <div className={styles.emptyPanel}>
            <p>Vælg en session for at se detaljer</p>
          </div>
        )}
      </div>
    </div>
  )
}
