import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Phone, AlertTriangle, CheckCircle2, Circle } from 'lucide-react'
import { Spinner } from '../../components/Spinner/Spinner'
import InlineAlert from '../../components/InlineAlert/InlineAlert'
import { getSessionDetail, type SessionDetail } from '../../api/admin'
import { wizardStepLabels } from '../Wizard/wizardSteps'
import styles from './SessionDetailPanel.module.scss'

const TOTAL_STEPS = 10

const dateFormatter = new Intl.DateTimeFormat('da-DK', { dateStyle: 'medium', timeStyle: 'short' })
const dayFormatter = new Intl.DateTimeFormat('da-DK', { dateStyle: 'long' })

const TIER_LABELS: Record<string, string> = {
  mikro: 'Mikrovirksomhed',
  smv: 'SMV',
  erhverv: 'Erhvervsvirksomhed',
}

function getDaysUntilExpiry(expiresAt: string): number {
  const ms = new Date(expiresAt).getTime() - Date.now()
  return Math.ceil(ms / (1000 * 60 * 60 * 24))
}

function getPhoneFromStepData(stepData: Record<string, unknown>): string | null {
  for (const stepKey of Object.keys(stepData)) {
    const step = stepData[stepKey]
    if (step && typeof step === 'object') {
      const s = step as Record<string, unknown>
      if (typeof s.contact_phone === 'string' && s.contact_phone) return s.contact_phone
      if (typeof s.phone === 'string' && s.phone) return s.phone
    }
  }
  return null
}

interface Props {
  sessionId: string
}

export default function SessionDetailPanel({ sessionId }: Props) {
  const navigate = useNavigate()
  const [session, setSession] = useState<SessionDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setIsLoading(true)
    setError(null)
    getSessionDetail(sessionId)
      .then(setSession)
      .catch((err: Error) => {
        if (err.message.includes('401')) {
          sessionStorage.removeItem('admin_token')
          navigate('/login')
          return
        }
        setError(err.message)
      })
      .finally(() => setIsLoading(false))
  }, [sessionId, navigate])

  if (isLoading) {
    return (
      <div className={styles.loadingWrapper}>
        <Spinner aria-label="Indlæser session" />
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className={styles.errorWrapper}>
        <InlineAlert tone="danger">{error ?? 'Session ikke fundet'}</InlineAlert>
      </div>
    )
  }

  const phone = getPhoneFromStepData(session.step_data)
  const daysLeft = getDaysUntilExpiry(session.expires_at)
  const stepPct = Math.round((session.current_step / TOTAL_STEPS) * 100)
  const expiryTier = daysLeft <= 3 ? 'critical' : daysLeft <= 7 ? 'warning' : 'ok'

  const emailSubject = encodeURIComponent('Vi savner dig hos Dansk Industri')
  const emailBody = encodeURIComponent(
    `Hej${session.contact_name ? ` ${session.contact_name}` : ''},\n\nVi har bemærket, at du er gået i gang med at ansøge om medlemskab hos Dansk Industri, men ikke har afsluttet din ansøgning endnu.\n\nVi vil gerne hjælpe dig videre. Kontakt os gerne, hvis du har spørgsmål.\n\nMed venlig hilsen\nDansk Industri`,
  )

  return (
    <div className={styles.panel}>
      {/* ── Expiry alert ─────────────────────────────── */}
      {expiryTier !== 'ok' && (
        <div className={styles.expiryAlert} data-tier={expiryTier}>
          <AlertTriangle size={16} />
          <span>
            {expiryTier === 'critical'
              ? `Data slettes om ${daysLeft} dag${daysLeft !== 1 ? 'e' : ''} — kontakt brugeren nu`
              : `Sessionen udløber om ${daysLeft} dage (${dayFormatter.format(new Date(session.expires_at))})`}
          </span>
        </div>
      )}

      {/* ── Contact buttons ──────────────────────────── */}
      {(session.contact_email || phone) && (
        <div className={styles.contactActions}>
          {session.contact_email && (
            <a
              href={`mailto:${session.contact_email}?subject=${emailSubject}&body=${emailBody}`}
              className={styles.contactBtn}
              data-variant="email"
            >
              <Mail size={15} />
              Send email
            </a>
          )}
          {phone && (
            <a href={`tel:${phone}`} className={styles.contactBtn} data-variant="phone">
              <Phone size={15} />
              Ring op
            </a>
          )}
        </div>
      )}

      {/* ── Progress ─────────────────────────────────── */}
      <section className={styles.section}>
        <h3 className={styles.section__title}>Fremskridt</h3>
        <div className={styles.progressHeader}>
          <span className={styles.progressLabel}>
            Trin {session.current_step} af {TOTAL_STEPS}
          </span>
          <span className={styles.progressPct}>{stepPct}%</span>
        </div>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${stepPct}%` }} />
        </div>
        <div className={styles.stepDots}>
          {wizardStepLabels.map((label, i) => {
            const stepNum = i + 1
            const done = stepNum < session.current_step
            const current = stepNum === session.current_step
            return (
              <div key={stepNum} className={styles.stepDot} data-done={done || undefined} data-current={current || undefined}>
                {done ? (
                  <CheckCircle2 size={14} />
                ) : (
                  <Circle size={14} />
                )}
                <span className={styles.stepDot__label}>{label}</span>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Virksomhed ───────────────────────────────── */}
      <section className={styles.section}>
        <h3 className={styles.section__title}>Virksomhed</h3>
        <dl className={styles.dl}>
          {session.company_cvr && (
            <>
              <dt>CVR-nummer</dt>
              <dd className={styles.mono}>{session.company_cvr}</dd>
            </>
          )}
          {session.tier && (
            <>
              <dt>Størrelse</dt>
              <dd>{TIER_LABELS[session.tier] ?? session.tier}</dd>
            </>
          )}
        </dl>
        {!session.company_cvr && !session.tier && (
          <p className={styles.noData}>Ingen virksomhedsdata endnu — brugeren er ikke nået til trin 1</p>
        )}
      </section>

      {/* ── Kontakt ──────────────────────────────────── */}
      <section className={styles.section}>
        <h3 className={styles.section__title}>Kontaktperson</h3>
        {session.contact_name || session.contact_email || phone ? (
          <dl className={styles.dl}>
            {session.contact_name && (
              <>
                <dt>Navn</dt>
                <dd>{session.contact_name}</dd>
              </>
            )}
            {session.contact_email && (
              <>
                <dt>Email</dt>
                <dd>
                  <a href={`mailto:${session.contact_email}`} className={styles.link}>
                    {session.contact_email}
                  </a>
                </dd>
              </>
            )}
            {phone && (
              <>
                <dt>Telefon</dt>
                <dd>
                  <a href={`tel:${phone}`} className={styles.link}>
                    {phone}
                  </a>
                </dd>
              </>
            )}
          </dl>
        ) : (
          <p className={styles.noData}>Ingen kontaktoplysninger endnu</p>
        )}
      </section>

      {/* ── Aktivitet ────────────────────────────────── */}
      <section className={styles.section}>
        <h3 className={styles.section__title}>Aktivitet</h3>
        <dl className={styles.dl}>
          <dt>Session oprettet</dt>
          <dd>{dateFormatter.format(new Date(session.created_at))}</dd>
          <dt>Sidst aktiv</dt>
          <dd>{dateFormatter.format(new Date(session.updated_at))}</dd>
          <dt>Udløber</dt>
          <dd className={styles.expiryDate} data-tier={expiryTier}>
            {dayFormatter.format(new Date(session.expires_at))}
            {expiryTier !== 'ok' && ` (om ${daysLeft} dag${daysLeft !== 1 ? 'e' : ''})`}
          </dd>
        </dl>
      </section>
    </div>
  )
}
