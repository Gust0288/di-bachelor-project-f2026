import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, X, FileText, ExternalLink, Pencil } from 'lucide-react'
import Button from '../../components/Button/Button'
import { Spinner } from '../../components/Spinner/Spinner'
import InlineAlert from '../../components/InlineAlert/InlineAlert'
import { Confirm, ConfirmContent, ConfirmFooter } from '../../components/Confirm/Confirm'
import { showToast } from '../../components/Toast/Toast'
import {
  getRegistration,
  getRegistrationDocuments,
  getNotes,
  addNote,
  approveRegistration,
  rejectRegistration,
  updateRegistration,
  fetchDocumentBlob,
  type RegistrationDetail,
  type RegistrationDocument,
  type RegistrationNote,
} from '../../api/admin'
import { wizardStepLabels } from '../Wizard/wizardSteps'
import { SERVICE_LABELS, OVERENSKOMST_STATUS_LABELS } from '../Wizard/wizard.constants'
import styles from './RegistrationDetailPanel.module.scss'

const OVERENSKOMST_TYPE_LABELS: Record<string, string> = {
  direkte: 'Direkte med et fagforbund',
}

type EditData = {
  company_name: string
  contact_name: string
  contact_email: string
  contact_phone: string
  industry_code: string
  employee_count: string
  website: string
  address_street: string
  address_zip: string
  address_city: string
}

function initEditData(reg: RegistrationDetail): EditData {
  const addr = reg.address
  return {
    company_name: reg.company_name ?? '',
    contact_name: reg.contact_name ?? '',
    contact_email: reg.contact_email ?? '',
    contact_phone: reg.contact_phone ?? '',
    industry_code: reg.industry_code ?? '',
    employee_count: reg.employee_count != null ? String(reg.employee_count) : '',
    website: reg.website ?? '',
    address_street: addr?.street ?? '',
    address_zip: addr?.zip ?? '',
    address_city: addr?.city ?? '',
  }
}

type ContactInfo = { name?: string; email?: string; phone?: string; title?: string }

function ContactCard({ label, contact }: { label: string; contact: ContactInfo }) {
  return (
    <div className={styles.contactCard}>
      <span className={styles.contactCard__label}>{label}</span>
      {contact.name && <span className={styles.contactCard__name}>{contact.name}</span>}
      {contact.title && <span className={styles.contactCard__detail}>{contact.title}</span>}
      {contact.email && <span className={styles.contactCard__detail}>{contact.email}</span>}
      {contact.phone && <span className={styles.contactCard__detail}>{contact.phone}</span>}
    </div>
  )
}

const dateFormatter = new Intl.DateTimeFormat('da-DK', { dateStyle: 'medium', timeStyle: 'short' })
const dayFormatter = new Intl.DateTimeFormat('da-DK', { dateStyle: 'medium' })

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface Props {
  registrationId: string
  onStatusChange: () => void
  showWizardSteps?: boolean
}

export default function RegistrationDetailPanel({
  registrationId,
  onStatusChange,
  showWizardSteps = false,
}: Props) {
  const navigate = useNavigate()
  const [registration, setRegistration] = useState<RegistrationDetail | null>(null)
  const [documents, setDocuments] = useState<RegistrationDocument[]>([])
  const [notes, setNotes] = useState<RegistrationNote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | null>(null)
  const [rejectNotes, setRejectNotes] = useState('')
  const [noteContent, setNoteContent] = useState('')
  const [noteLoading, setNoteLoading] = useState(false)
  const noteTextareaRef = useRef<HTMLTextAreaElement>(null)
  const [previewDoc, setPreviewDoc] = useState<RegistrationDocument | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<EditData | null>(null)
  const [editLoading, setEditLoading] = useState(false)

  useEffect(() => {
    if (!previewDoc) return
    setPreviewLoading(true)
    setPreviewUrl(null)
    fetchDocumentBlob(previewDoc.id)
      .then(({ blob }) => {
        setPreviewUrl(URL.createObjectURL(blob))
      })
      .catch(() => showToast({ title: 'Kunne ikke hente dokumentet', variant: 'danger' }))
      .finally(() => setPreviewLoading(false))
    return () => {
      setPreviewUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null })
    }
  }, [previewDoc])

  useEffect(() => {
    if (!previewDoc) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setPreviewDoc(null) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [previewDoc])

  function handleAuthError(err: Error) {
    if (err.message.includes('401')) {
      sessionStorage.removeItem('admin_token')
      navigate('/login')
      return true
    }
    return false
  }

  useEffect(() => {
    setIsLoading(true)
    setError(null)
    Promise.all([
      getRegistration(registrationId),
      getRegistrationDocuments(registrationId),
      getNotes(registrationId),
    ])
      .then(([reg, docs, n]) => {
        setRegistration(reg)
        setDocuments(docs)
        setNotes(n)
      })
      .catch((err: Error) => {
        if (!handleAuthError(err)) setError(err.message)
      })
      .finally(() => setIsLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registrationId])

  async function handleApprove() {
    setActionLoading(true)
    try {
      await approveRegistration(registrationId)
      const updated = await getRegistration(registrationId)
      setRegistration(updated)
      showToast({ title: 'Ansøgning godkendt', variant: 'success' })
      onStatusChange()
    } catch (err) {
      showToast({ title: (err as Error).message, variant: 'danger' })
    } finally {
      setActionLoading(false)
      setConfirmAction(null)
    }
  }

  async function handleReject() {
    if (!rejectNotes.trim()) return
    setActionLoading(true)
    try {
      await rejectRegistration(registrationId, rejectNotes.trim())
      const updated = await getRegistration(registrationId)
      setRegistration(updated)
      showToast({ title: 'Ansøgning afvist', variant: 'warning' })
      onStatusChange()
    } catch (err) {
      showToast({ title: (err as Error).message, variant: 'danger' })
    } finally {
      setActionLoading(false)
      setConfirmAction(null)
      setRejectNotes('')
    }
  }

  async function handleAddNote() {
    if (!noteContent.trim()) return
    setNoteLoading(true)
    try {
      const newNote = await addNote(registrationId, noteContent.trim())
      setNotes((prev) => [...prev, newNote])
      setNoteContent('')
    } catch (err) {
      if (!handleAuthError(err as Error)) {
        showToast({ title: (err as Error).message, variant: 'danger' })
      }
    } finally {
      setNoteLoading(false)
    }
  }

  function handleStartEdit() {
    if (!registration) return
    setEditData(initEditData(registration))
    setIsEditing(true)
  }

  function handleCancelEdit() {
    setIsEditing(false)
    setEditData(null)
  }

  async function handleSaveEdit() {
    if (!editData) return
    setEditLoading(true)
    try {
      const payload = {
        company_name: editData.company_name.trim() || undefined,
        contact_name: editData.contact_name.trim() || undefined,
        contact_email: editData.contact_email.trim() || undefined,
        contact_phone: editData.contact_phone.trim() || null,
        industry_code: editData.industry_code.trim() || null,
        employee_count: editData.employee_count !== '' ? Number(editData.employee_count) : null,
        website: editData.website.trim() || null,
        address: {
          street: editData.address_street.trim(),
          zip: editData.address_zip.trim(),
          city: editData.address_city.trim(),
        },
      }
      const updated = await updateRegistration(registrationId, payload)
      setRegistration(updated)
      setIsEditing(false)
      setEditData(null)
      showToast({ title: 'Oplysninger opdateret', variant: 'success' })
      onStatusChange()
    } catch (err) {
      if (!handleAuthError(err as Error)) {
        showToast({ title: (err as Error).message, variant: 'danger' })
      }
    } finally {
      setEditLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className={styles.spinnerWrapper}>
        <Spinner aria-label="Indlæser ansøgning" />
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.errorWrapper}>
        <InlineAlert tone="danger">{error}</InlineAlert>
      </div>
    )
  }

  if (!registration) return null

  const answers = registration.answers as Record<string, unknown>
  const services = answers?.services as string[] | undefined
  const overenskomst = answers?.overenskomst as Record<string, string> | undefined
  const branchefaellesskaber = answers?.branchefaellesskaber as string[] | undefined
  const kontaktpersoner = answers?.kontaktpersoner as {
    managing_director?: ContactInfo
    hr_contact?: ContactInfo | null
    payroll_contact?: ContactInfo | null
    authorized_signatory?: ContactInfo | null
    invoice_delivery?: string
  } | undefined
  const address = registration.address
  const currentStep = answers?.current_step as number | undefined

  const hasEmployeeSection = registration.employee_count != null || !!overenskomst?.overenskomst_status
  const hasTjenesterSection = (services?.length ?? 0) > 0 || (branchefaellesskaber?.length ?? 0) > 0 || !!registration.membership_type
  const hasKontaktpersonerSection = !!(
    kontaktpersoner?.managing_director ||
    kontaktpersoner?.hr_contact ||
    kontaktpersoner?.payroll_contact ||
    kontaktpersoner?.authorized_signatory ||
    kontaktpersoner?.invoice_delivery
  )

  return (
    <div className={styles.panel}>
      {/* ── Virksomhed ─────────────────────────────── */}
      <section className={styles.section}>
        <div className={styles.section__firmaHeader}>
          <div>
            {isEditing && editData ? (
              <input
                className={styles.editField}
                value={editData.company_name}
                onChange={(e) => setEditData({ ...editData, company_name: e.target.value })}
                aria-label="Virksomhedsnavn"
              />
            ) : (
              <h2 className={styles.firmaName}>{registration.company_name}</h2>
            )}
            <span className={styles.firmaCvr}>{registration.cvr_number}</span>
          </div>
          <div className={styles.section__firmaHeaderRight}>
            <span className={styles.statusBadge} data-status={registration.status}>
              {registration.status === 'pending' ? 'Afventer' : registration.status === 'approved' ? 'Godkendt' : 'Afvist'}
            </span>
            {registration.status === 'pending' && !isEditing && (
              <button className={styles.editIconBtn} onClick={handleStartEdit} aria-label="Rediger oplysninger" title="Rediger oplysninger">
                <Pencil size={14} />
              </button>
            )}
          </div>
        </div>
        <dl className={styles.infoList}>
          {(isEditing && editData) ? (
            <>
              <div className={styles.infoList__row}>
                <dt>Branche</dt>
                <dd>
                  <input
                    className={styles.editField}
                    value={editData.industry_code}
                    onChange={(e) => setEditData({ ...editData, industry_code: e.target.value })}
                    placeholder="Branchekode"
                    aria-label="Branchekode"
                  />
                </dd>
              </div>
              <div className={styles.infoList__row}>
                <dt>Hjemmeside</dt>
                <dd>
                  <input
                    className={styles.editField}
                    value={editData.website}
                    onChange={(e) => setEditData({ ...editData, website: e.target.value })}
                    placeholder="https://..."
                    aria-label="Hjemmeside"
                  />
                </dd>
              </div>
              <div className={styles.infoList__row}>
                <dt>Gade</dt>
                <dd>
                  <input
                    className={styles.editField}
                    value={editData.address_street}
                    onChange={(e) => setEditData({ ...editData, address_street: e.target.value })}
                    placeholder="Gadenavn og nummer"
                    aria-label="Gade"
                  />
                </dd>
              </div>
              <div className={styles.infoList__row}>
                <dt>Postnr.</dt>
                <dd>
                  <input
                    className={styles.editField}
                    value={editData.address_zip}
                    onChange={(e) => setEditData({ ...editData, address_zip: e.target.value })}
                    placeholder="Postnummer"
                    aria-label="Postnummer"
                  />
                </dd>
              </div>
              <div className={styles.infoList__row}>
                <dt>By</dt>
                <dd>
                  <input
                    className={styles.editField}
                    value={editData.address_city}
                    onChange={(e) => setEditData({ ...editData, address_city: e.target.value })}
                    placeholder="By"
                    aria-label="By"
                  />
                </dd>
              </div>
            </>
          ) : (
            <>
              {registration.industry_code && (
                <div className={styles.infoList__row}>
                  <dt>Branche</dt>
                  <dd>{registration.industry_code}</dd>
                </div>
              )}
              {registration.website && (
                <div className={styles.infoList__row}>
                  <dt>Hjemmeside</dt>
                  <dd>
                    <a className={styles.link} href={registration.website} target="_blank" rel="noopener noreferrer">
                      {registration.website}
                    </a>
                  </dd>
                </div>
              )}
              {address && (
                <div className={styles.infoList__row}>
                  <dt>Adresse</dt>
                  <dd>{address.street}, {address.zip} {address.city}</dd>
                </div>
              )}
            </>
          )}
          <div className={styles.infoList__row}>
            <dt>Indsendt</dt>
            <dd>{dayFormatter.format(new Date(registration.created_at))}</dd>
          </div>
        </dl>
      </section>

      {/* ── Primær kontaktperson ───────────────────── */}
      <section className={styles.section}>
        <h3 className={styles.section__title}>Primær kontaktperson</h3>
        {isEditing && editData ? (
          <dl className={styles.infoList}>
            <div className={styles.infoList__row}>
              <dt>Navn</dt>
              <dd>
                <input
                  className={styles.editField}
                  value={editData.contact_name}
                  onChange={(e) => setEditData({ ...editData, contact_name: e.target.value })}
                  aria-label="Kontaktpersonens navn"
                />
              </dd>
            </div>
            <div className={styles.infoList__row}>
              <dt>E-mail</dt>
              <dd>
                <input
                  className={styles.editField}
                  type="email"
                  value={editData.contact_email}
                  onChange={(e) => setEditData({ ...editData, contact_email: e.target.value })}
                  aria-label="E-mail"
                />
              </dd>
            </div>
            <div className={styles.infoList__row}>
              <dt>Telefon</dt>
              <dd>
                <input
                  className={styles.editField}
                  value={editData.contact_phone}
                  onChange={(e) => setEditData({ ...editData, contact_phone: e.target.value })}
                  placeholder="Telefonnummer"
                  aria-label="Telefonnummer"
                />
              </dd>
            </div>
          </dl>
        ) : (
          <>
            <dl className={styles.infoList}>
              <div className={styles.infoList__row}>
                <dt>Navn</dt>
                <dd>{registration.contact_name}</dd>
              </div>
            </dl>
            <div className={styles.contactActions}>
              <a className={styles.contactAction} href={`mailto:${registration.contact_email}`}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                {registration.contact_email}
              </a>
              {registration.contact_phone && (
                <a className={styles.contactAction} href={`tel:${registration.contact_phone}`}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.61 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.06 6.06l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  {registration.contact_phone}
                </a>
              )}
            </div>
          </>
        )}
      </section>

      {/* ── Medarbejdere & Overenskomst ────────────── */}
      {(hasEmployeeSection || isEditing) && (
        <section className={styles.section}>
          <h3 className={styles.section__title}>Medarbejdere & Overenskomst</h3>
          <dl className={styles.infoList}>
            {isEditing && editData ? (
              <div className={styles.infoList__row}>
                <dt>Ansatte</dt>
                <dd>
                  <input
                    className={styles.editField}
                    type="number"
                    min="0"
                    value={editData.employee_count}
                    onChange={(e) => setEditData({ ...editData, employee_count: e.target.value })}
                    placeholder="Antal ansatte"
                    aria-label="Antal ansatte"
                  />
                </dd>
              </div>
            ) : (
              <>
                {registration.employee_count != null && (
                  <div className={styles.infoList__row}>
                    <dt>Ansatte</dt>
                    <dd>{registration.employee_count === 0 ? 'Ingen ansatte' : registration.employee_count}</dd>
                  </div>
                )}
              </>
            )}
            {overenskomst?.overenskomst_status && (
              <div className={styles.infoList__row}>
                <dt>Overenskomst</dt>
                <dd>{OVERENSKOMST_STATUS_LABELS[overenskomst.overenskomst_status] ?? overenskomst.overenskomst_status}</dd>
              </div>
            )}
            {overenskomst?.overenskomst_type && (
              <div className={styles.infoList__row}>
                <dt>Type</dt>
                <dd>{OVERENSKOMST_TYPE_LABELS[overenskomst.overenskomst_type] ?? overenskomst.overenskomst_type}</dd>
              </div>
            )}
          </dl>
        </section>
      )}

      {/* ── Tjenester & Pakke ──────────────────────── */}
      {hasTjenesterSection && (
        <section className={styles.section}>
          <h3 className={styles.section__title}>Tjenester & Pakke</h3>
          {services && services.length > 0 && (
            <div>
              <p className={styles.subLabel}>Valgte tjenester</p>
              <ul className={styles.tagList}>
                {services.map((s) => (
                  <li key={s} className={styles.tag}>{SERVICE_LABELS[s] ?? s}</li>
                ))}
              </ul>
            </div>
          )}
          {branchefaellesskaber && branchefaellesskaber.length > 0 && (
            <div>
              <p className={styles.subLabel}>Branchefællesskaber</p>
              <ul className={styles.tagList}>
                {branchefaellesskaber.map((b) => (
                  <li key={b} className={styles.tag}>{b}</li>
                ))}
              </ul>
            </div>
          )}
          {registration.membership_type && (
            <dl className={styles.infoList}>
              <div className={styles.infoList__row}>
                <dt>Medlemskab</dt>
                <dd>{registration.membership_type}</dd>
              </div>
            </dl>
          )}
        </section>
      )}

      {/* ── Yderligere kontakter ───────────────────── */}
      {hasKontaktpersonerSection && (
        <section className={styles.section}>
          <h3 className={styles.section__title}>Yderligere kontakter</h3>
          <div className={styles.contactList}>
            {kontaktpersoner?.managing_director && (
              <ContactCard label="Direktør" contact={kontaktpersoner.managing_director} />
            )}
            {kontaktpersoner?.hr_contact && (
              <ContactCard label="HR-kontakt" contact={kontaktpersoner.hr_contact} />
            )}
            {kontaktpersoner?.payroll_contact && (
              <ContactCard label="Lønansvarlig" contact={kontaktpersoner.payroll_contact} />
            )}
            {kontaktpersoner?.authorized_signatory && (
              <ContactCard label="Tegningsberettiget" contact={kontaktpersoner.authorized_signatory} />
            )}
            {kontaktpersoner?.invoice_delivery && (
              <dl className={styles.infoList}>
                <div className={styles.infoList__row}>
                  <dt>Faktura</dt>
                  <dd>{kontaktpersoner.invoice_delivery}</dd>
                </div>
              </dl>
            )}
          </div>
        </section>
      )}

      {/* ── Handlinger ─────────────────────────────── */}
      {registration.status === 'pending' && (
        <section className={styles.section}>
          <h3 className={styles.section__title}>Handlinger</h3>
          {isEditing ? (
            <div className={styles.editActions}>
              <Button variant="default" onPress={handleSaveEdit} isDisabled={editLoading} isSpinning={editLoading}>
                Gem ændringer
              </Button>
              <Button variant="light" onPress={handleCancelEdit} isDisabled={editLoading}>
                Annuller
              </Button>
            </div>
          ) : (
            <div className={styles.actionBar}>
              <Button variant="default" onPress={() => setConfirmAction('approve')} isDisabled={actionLoading}>
                Godkend ansøgning
              </Button>
              <Button variant="danger" onPress={() => setConfirmAction('reject')} isDisabled={actionLoading}>
                Afvis ansøgning
              </Button>
            </div>
          )}
        </section>
      )}

      {registration.status !== 'pending' && (
        <section className={styles.section}>
          <h3 className={styles.section__title}>Afgørelse</h3>
          <dl className={styles.infoList}>
            <div className={styles.infoList__row}>
              <dt>Behandlet af</dt>
              <dd>{registration.reviewer_name ?? '—'}</dd>
            </div>
            {registration.reviewed_at && (
              <div className={styles.infoList__row}>
                <dt>Dato</dt>
                <dd>{dateFormatter.format(new Date(registration.reviewed_at))}</dd>
              </div>
            )}
          </dl>
          {registration.notes && (
            <div className={styles.rejectionNote}>{registration.notes}</div>
          )}
        </section>
      )}

      {/* ── Wizard-trin ────────────────────────────── */}
      {showWizardSteps && (
        <section className={styles.section}>
          <h3 className={styles.section__title}>Wizard-trin</h3>
          <ul className={styles.stepList}>
            {wizardStepLabels.map((label, idx) => {
              const stepNum = idx + 1
              const done = currentStep != null ? stepNum <= currentStep : false
              return (
                <li key={label} className={styles.stepItem} data-done={done || undefined}>
                  <span className={styles.stepItem__icon}>
                    {done ? <Check size={11} strokeWidth={3} /> : <X size={11} strokeWidth={3} />}
                  </span>
                  <span className={styles.stepItem__label}>{label}</span>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {/* ── Dokumenter ────────────────────────────── */}
      {documents.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.section__title}>Dokumenter</h3>
          <ul className={styles.docList}>
            {documents.map((doc) => (
              <li key={doc.id} className={styles.docItem}>
                <button className={styles.docItem__btn} onClick={() => setPreviewDoc(doc)}>
                  <FileText size={14} className={styles.docItem__icon} />
                  <span className={styles.docItem__name}>{doc.file_name}</span>
                </button>
                <span className={styles.docItem__meta}>{formatBytes(doc.file_size_bytes)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Noter ──────────────────────────────────── */}
      <section className={styles.section}>
        <h3 className={styles.section__title}>Noter</h3>
        {notes.length > 0 && (
          <div className={styles.noteList}>
            {notes.map((note) => (
              <div key={note.id} className={styles.noteCard}>
                <div className={styles.noteCard__header}>
                  <span className={styles.noteCard__author}>{note.admin_name}</span>
                  <span className={styles.noteCard__date}>
                    {dateFormatter.format(new Date(note.created_at))}
                  </span>
                </div>
                <p className={styles.noteCard__content}>{note.content}</p>
              </div>
            ))}
          </div>
        )}
        <div className={styles.noteForm}>
          <textarea
            ref={noteTextareaRef}
            className={styles.noteTextarea}
            placeholder="Tilføj intern note…"
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            rows={3}
          />
          <Button
            variant="light"
            size="small"
            onPress={handleAddNote}
            isDisabled={noteLoading || !noteContent.trim()}
            isSpinning={noteLoading}
          >
            Gem note
          </Button>
        </div>
      </section>

      {/* ── Confirm modaler ────────────────────────── */}
      <Confirm
        isOpen={confirmAction === 'approve'}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        headline="Bekræft godkendelse"
      >
        <ConfirmContent>
          <p>Er du sikker på, at du vil godkende ansøgningen fra <strong>{registration.company_name}</strong>?</p>
        </ConfirmContent>
        <ConfirmFooter>
          <Button variant="default" onPress={handleApprove} isDisabled={actionLoading} isSpinning={actionLoading}>
            Bekræft
          </Button>
          <Button variant="light" onPress={() => setConfirmAction(null)} isDisabled={actionLoading}>
            Annuller
          </Button>
        </ConfirmFooter>
      </Confirm>

      <Confirm
        isOpen={confirmAction === 'reject'}
        onOpenChange={(open) => { if (!open) { setConfirmAction(null); setRejectNotes('') } }}
        headline="Afvis ansøgning"
      >
        <ConfirmContent>
          <label className={styles.rejectLabel}>Begrundelse</label>
          <textarea
            className={styles.noteTextarea}
            rows={4}
            placeholder="Angiv begrundelse for afvisningen..."
            value={rejectNotes}
            onChange={(e) => setRejectNotes(e.target.value)}
          />
        </ConfirmContent>
        <ConfirmFooter>
          <Button
            variant="danger"
            onPress={handleReject}
            isDisabled={actionLoading || !rejectNotes.trim()}
            isSpinning={actionLoading}
          >
            Bekræft afvisning
          </Button>
          <Button variant="light" onPress={() => { setConfirmAction(null); setRejectNotes('') }} isDisabled={actionLoading}>
            Annuller
          </Button>
        </ConfirmFooter>
      </Confirm>

      {/* ── Dokument-preview ───────────────────────── */}
      {previewDoc && (
        <div className={styles.previewOverlay} onClick={() => setPreviewDoc(null)}>
          <div className={styles.previewModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.previewModal__header}>
              <span className={styles.previewModal__title}>{previewDoc.file_name}</span>
              <div className={styles.previewModal__actions}>
                {previewUrl && (
                  <a
                    className={styles.previewModal__externalLink}
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Åbn i ny fane"
                  >
                    <ExternalLink size={16} />
                  </a>
                )}
                <button className={styles.previewModal__close} onClick={() => setPreviewDoc(null)} aria-label="Luk">
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className={styles.previewModal__body}>
              {previewLoading && (
                <div className={styles.previewModal__spinner}>
                  <Spinner aria-label="Indlæser dokument" />
                </div>
              )}
              {!previewLoading && previewUrl && previewDoc.content_type === 'application/pdf' && (
                <iframe
                  className={styles.previewModal__iframe}
                  src={previewUrl}
                  title={previewDoc.file_name}
                />
              )}
              {!previewLoading && previewUrl && previewDoc.content_type.startsWith('image/') && (
                <img
                  className={styles.previewModal__img}
                  src={previewUrl}
                  alt={previewDoc.file_name}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
