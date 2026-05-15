import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Phone, AlertTriangle, CheckCircle2, Circle } from 'lucide-react'
import { Spinner } from '../../components/Spinner/Spinner'
import InlineAlert from '../../components/InlineAlert/InlineAlert'
import { getSessionDetail, type SessionDetail } from '../../api/admin'
import { wizardStepLabels } from '../Wizard/wizardSteps'
import { SERVICE_LABELS, EMPLOYEE_TYPE_LABELS, OVERENSKOMST_STATUS_LABELS as OVERENSKOMST_LABELS } from '../Wizard/wizard.constants'
import styles from './SessionDetailPanel.module.scss'

const TOTAL_STEPS = 9

const dateFormatter = new Intl.DateTimeFormat('da-DK', { dateStyle: 'medium', timeStyle: 'short' })
const dayFormatter = new Intl.DateTimeFormat('da-DK', { dateStyle: 'long' })

const TIER_LABELS: Record<string, string> = {
  mikro: 'Mikrovirksomhed',
  smv: 'SMV',
  erhverv: 'Erhvervsvirksomhed',
}

const OVERENSKOMST_TYPE_LABELS: Record<string, string> = {
  direkte: 'Direkte overenskomst',
  vikaar: 'Vikåroverenskomst',
  anden: 'Anden overenskomst',
}

const INVOICE_LABELS: Record<string, string> = {
  email: 'Email',
  ean: 'EAN',
  post: 'Post',
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

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

function asString(v: unknown): string | null {
  return typeof v === 'string' && v ? v : null
}

function asNumber(v: unknown): number | null {
  return typeof v === 'number' ? v : null
}

function asStringArray(v: unknown): string[] | null {
  return Array.isArray(v) && v.every((x) => typeof x === 'string') ? (v as string[]) : null
}

function ContactRow({ contact, label }: { contact: Record<string, unknown>; label: string }) {
  const name = asString(contact.name)
  const email = asString(contact.email)
  const phone = asString(contact.phone)
  const title = asString(contact.title)
  if (!name && !email) return null
  return (
    <div className={styles.contactRow}>
      <dt>
        {label}
        {title ? <span className={styles.contactTitle}> ({title})</span> : null}
      </dt>
      <dd>
        {name && <span>{name}</span>}
        {email && (
          <a href={`mailto:${email}`} className={styles.link}>
            {email}
          </a>
        )}
        {phone && (
          <a href={`tel:${phone}`} className={styles.link}>
            {phone}
          </a>
        )}
      </dd>
    </div>
  )
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

  const sd = session.step_data as Record<string, unknown>
  const s1 = asRecord(sd['1'])
  const s3 = asRecord(sd['3'])
  const s4 = asRecord(sd['4'])
  const s5 = asRecord(sd['5'])
  const s6 = asRecord(sd['6'])
  const s7 = asRecord(sd['7'])
  const s8 = asRecord(sd['8'])

  const phone = getPhoneFromStepData(sd)
  const daysLeft = getDaysUntilExpiry(session.expires_at)
  const stepPct = Math.round(((session.current_step - 1) / TOTAL_STEPS) * 100)
  const expiryTier = daysLeft <= 3 ? 'critical' : daysLeft <= 7 ? 'warning' : 'ok'

  const companyName = s1 ? asString(s1.company_name) : null

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
              <div
                key={stepNum}
                className={styles.stepDot}
                data-done={done || undefined}
                data-current={current || undefined}
              >
                {done ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                <span className={styles.stepDot__label}>{label}</span>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Virksomhed ───────────────────────────────── */}
      <section className={styles.section}>
        <h3 className={styles.section__title}>Virksomhed</h3>
        {session.company_cvr || companyName || session.tier ? (
          <dl className={styles.dl}>
            {companyName && (
              <>
                <dt>Virksomhedsnavn</dt>
                <dd>{companyName}</dd>
              </>
            )}
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
        ) : (
          <p className={styles.noData}>Ingen virksomhedsdata endnu</p>
        )}
      </section>

      {/* ── Kontaktperson ────────────────────────────── */}
      <section className={styles.section}>
        <h3 className={styles.section__title}>Primær kontaktperson</h3>
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

      {/* ── Valgte services (step 3) ─────────────────── */}
      {s3 && (
        <section className={styles.section}>
          <h3 className={styles.section__title}>Ønsker og behov</h3>
          <dl className={styles.dl}>
            {(() => {
              const services = asStringArray(s3.selected_services)
              return services && services.length > 0 ? (
                <>
                  <dt>Valgte services</dt>
                  <dd>
                    <ul className={styles.tagList}>
                      {services.map((s) => (
                        <li key={s} className={styles.tag}>
                          {SERVICE_LABELS[s] ?? s}
                        </li>
                      ))}
                    </ul>
                  </dd>
                </>
              ) : null
            })()}
            {asString(s3.andet_beskrivelse) && (
              <>
                <dt>Beskrivelse (andet)</dt>
                <dd>{asString(s3.andet_beskrivelse)}</dd>
              </>
            )}
          </dl>
        </section>
      )}

      {/* ── Ansatte (step 4) ─────────────────────────── */}
      {s4 && (
        <section className={styles.section}>
          <h3 className={styles.section__title}>Virksomhedens ansatte</h3>
          <dl className={styles.dl}>
            {s4.no_employees === true ? (
              <>
                <dt>Ansatte</dt>
                <dd>Ingen ansatte</dd>
              </>
            ) : (
              asNumber(s4.employee_count) !== null && (
                <>
                  <dt>Antal ansatte</dt>
                  <dd>{asNumber(s4.employee_count)}</dd>
                </>
              )
            )}
            {(() => {
              const types = asStringArray(s4.employee_types)
              return types && types.length > 0 ? (
                <>
                  <dt>Medarbejdertyper</dt>
                  <dd>
                    <ul className={styles.tagList}>
                      {types.map((t) => (
                        <li key={t} className={styles.tag}>
                          {EMPLOYEE_TYPE_LABELS[t] ?? t}
                        </li>
                      ))}
                    </ul>
                  </dd>
                </>
              ) : null
            })()}
            {asNumber(s4.total_loensum) !== null && (
              <>
                <dt>Samlet lønsum</dt>
                <dd>
                  {new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK', maximumFractionDigits: 0 }).format(
                    asNumber(s4.total_loensum)!,
                  )}
                </dd>
              </>
            )}
          </dl>
        </section>
      )}

      {/* ── Overenskomst (step 5) ────────────────────── */}
      {s5 && (
        <section className={styles.section}>
          <h3 className={styles.section__title}>Overenskomst</h3>
          <dl className={styles.dl}>
            {asString(s5.overenskomst_status) && (
              <>
                <dt>Status</dt>
                <dd>{OVERENSKOMST_LABELS[asString(s5.overenskomst_status)!] ?? asString(s5.overenskomst_status)}</dd>
              </>
            )}
            {asString(s5.overenskomst_type) && (
              <>
                <dt>Type</dt>
                <dd>{OVERENSKOMST_TYPE_LABELS[asString(s5.overenskomst_type)!] ?? asString(s5.overenskomst_type)}</dd>
              </>
            )}
          </dl>
        </section>
      )}

      {/* ── Branchefællesskaber (step 6) ─────────────── */}
      {s6 && (
        <section className={styles.section}>
          <h3 className={styles.section__title}>Fællesskaber og foreninger</h3>
          {(() => {
            const faellesskaber = asStringArray(s6.branchefaellesskaber)
            return faellesskaber && faellesskaber.length > 0 ? (
              <ul className={styles.tagList}>
                {faellesskaber.map((f) => (
                  <li key={f} className={styles.tag}>
                    {f}
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.noData}>Ingen fællesskaber valgt</p>
            )
          })()}
        </section>
      )}

      {/* ── Medlemskab (step 7) ──────────────────────── */}
      {s7 && (
        <section className={styles.section}>
          <h3 className={styles.section__title}>Medlemskab</h3>
          <dl className={styles.dl}>
            {asString(s7.membership_type) && (
              <>
                <dt>Medlemskabstype</dt>
                <dd>{asString(s7.membership_type)}</dd>
              </>
            )}
            {typeof s7.accept_membership === 'boolean' && (
              <>
                <dt>Accepteret</dt>
                <dd>{s7.accept_membership ? 'Ja' : 'Nej'}</dd>
              </>
            )}
          </dl>
        </section>
      )}

      {/* ── Kontaktpersoner (step 8) ─────────────────── */}
      {s8 && (
        <section className={styles.section}>
          <h3 className={styles.section__title}>Kontaktpersoner</h3>
          <dl className={styles.dl}>
            {asRecord(s8.managing_director) && (
              <ContactRow contact={asRecord(s8.managing_director)!} label="Administrerende direktør" />
            )}
            {asRecord(s8.hr_contact) && (
              <ContactRow contact={asRecord(s8.hr_contact)!} label="HR-kontakt" />
            )}
            {asRecord(s8.payroll_contact) && (
              <ContactRow contact={asRecord(s8.payroll_contact)!} label="Lønsumsinberetter" />
            )}
            {asRecord(s8.authorized_signatory) && (
              <ContactRow contact={asRecord(s8.authorized_signatory)!} label="Tegningsberettiget" />
            )}
            {asString(s8.invoice_delivery) && (
              <>
                <dt>Fakturalevering</dt>
                <dd>{INVOICE_LABELS[asString(s8.invoice_delivery)!] ?? asString(s8.invoice_delivery)}</dd>
              </>
            )}
          </dl>
        </section>
      )}



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
