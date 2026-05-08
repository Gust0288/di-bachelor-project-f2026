import type { FormEvent } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CheckCircle2, Clock3, FileCheck2, Mail } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Button from '../../components/Button/Button'
import { Confirm, ConfirmContent, ConfirmFooter } from '../../components/Confirm'
import { Form } from '../../components/Form/Form'
import InlineAlert from '../../components/InlineAlert/InlineAlert'
import WizardStepsNavigation, {
  type WizardStep,
} from '../../components/WizardStepsNavigation/WizardStepsNavigation'
import WizardLayout from '../../layouts/WizardLayout/WizardLayout'
import CompanyInformationStep from './steps/01CompanyInformationStep'
import BranchStep from './steps/02BranchStep'
import NeedsStep from './steps/03NeedsStep'
import EmployeesStep from './steps/04EmployeesStep'
import AgreementStep from './steps/05AgreementStep'
import AssociationsStep from './steps/06AssociationsStep'
import MembershipStep from './steps/07MembershipStep'
import ContactsStep from './steps/08ContactsStep'
import ApprovalStep from './steps/09ApprovalStep'
import MitIdVerificationStep, {
  type MitIdStatus,
} from './steps/10MitIdVerificationStep'
import BlockingDialog from './BlockingDialog'
import EmailVerificationOverlay from './EmailVerificationOverlay'
import WizardHeader from './WizardHeader'
import styles from './WizardPage.module.scss'
import WizardSummary from './WizardSummary'
import { initialFormData } from './wizard.constants'
import { calculateAnsweredProgress, hasCompletedCompanyInformation } from './wizardProgress'
import { wizardStepLabels } from './wizardSteps'
import type { CompanyOption, WizardFormData } from './wizard.types'
import type { BlockingPopup, CvrHiddenFields } from './types'
import { useWizardSession } from './useWizardSession'
import type { ContactPerson } from './steps/ContactPersonFields'
import { submitRegistration } from '../../api/registration'

const wizardStepCount = wizardStepLabels.length
const mitIdStepIndex = wizardStepCount
const wizardStepHistoryStateKey = 'wizardStepIndex'

const emptyContact = (): ContactPerson => ({ name: '', email: '', phone: '', title: '' })

const ARBEJDSGIVER_SERVICES = new Set([
  'overenskomst',
  'personalejuridisk_raadgivning',
  'erhvervsjuridisk_raadgivning',
])
const BYGGERI_SERVICES = new Set(['byggegaranti', 'di_byggeri_sektion'])

function computeTier(employeeCount: number | undefined): string | null {
  if (employeeCount === undefined) return null
  if (employeeCount >= 50) return 'erhverv'
  if (employeeCount >= 10) return 'smv'
  return 'mikro'
}

function computeMembership(
  tier: string | null,
  established_ag: boolean,
  branchefaellesskaber: string[],
  selectedServices: string[],
): string | undefined {
  if (!tier) return undefined
  const services = new Set(selectedServices)
  const branches = new Set(branchefaellesskaber)
  if ([...services].some((s) => BYGGERI_SERVICES.has(s))) branches.add('di-byggeri')
  const hasBranch = branches.size > 0
  const serviceRequiresArbejdsgiver = [...services].some((s) => ARBEJDSGIVER_SERVICES.has(s))
  if (tier === 'erhverv') return hasBranch ? 'Branchemedlem' : 'Erhvervsmedlem'
  if (tier === 'smv') return established_ag || serviceRequiresArbejdsgiver ? 'Arbejdsgiver' : 'Associeret'
  return 'Associeret'
}

export default function WizardPage() {
  const navigate = useNavigate()

  // ── Step 1 state ──────────────────────────────────────────────
  const [formData, setFormData] = useState<WizardFormData>(initialFormData)
  const [selectedCompany, setSelectedCompany] = useState<CompanyOption | undefined>(undefined)
  const [cvrData, setCvrData] = useState<CvrHiddenFields | null>(null)
  const [cvrQuery, setCvrQuery] = useState('')

  // ── Step 2 state ──────────────────────────────────────────────
  const [cvrConfirmed, setCvrConfirmed] = useState(false)

  // ── Step 3 state ──────────────────────────────────────────────
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [andetBeskrivelse, setAndetBeskrivelse] = useState('')

  // ── Step 4 state ──────────────────────────────────────────────
  const [employeeCount, setEmployeeCount] = useState<number | ''>('')
  const [noEmployees, setNoEmployees] = useState(false)
  const [employeeTypes, setEmployeeTypes] = useState<string[]>([])
  const [totalLoensum, setTotalLoensum] = useState<number | ''>('')

  // ── Step 5 state ──────────────────────────────────────────────
  const [overenskomstStatus, setOverenskomstStatus] = useState('')
  const [overenskomstType, setOverenskomstType] = useState('')
  const [documentId, setDocumentId] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  // ── Step 6 state ──────────────────────────────────────────────
  const [selectedFaellesskaber, setSelectedFaellesskaber] = useState<string[]>([])
  const [allFaellesskaber, setAllFaellesskaber] = useState<{ id: string; name: string }[]>([])

  // ── Step 7 state ──────────────────────────────────────────────
  const [acceptMembership, setAcceptMembership] = useState(false)

  // ── Step 8 state ──────────────────────────────────────────────
  const [managingDirector, setManagingDirector] = useState<ContactPerson>(emptyContact())
  const [hrContact, setHrContact] = useState<ContactPerson | null>(null)
  const [payrollContact, setPayrollContact] = useState<ContactPerson | null>(null)
  const [authorizedSignatory, setAuthorizedSignatory] = useState<ContactPerson | null>(null)
  const [invoiceDelivery, setInvoiceDelivery] = useState('')

  // ── Step 9 state ──────────────────────────────────────────────
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [acceptAuthority, setAcceptAuthority] = useState(false)

  // ── Wizard navigation state ───────────────────────────────────
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [validationMessage, setValidationMessage] = useState<string>()

  const [mitIdStatus, setMitIdStatus] = useState<MitIdStatus>('idle')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submittedRegistrationId, setSubmittedRegistrationId] = useState<string | null>(null)
  const [submittedAt, setSubmittedAt] = useState<Date | null>(null)

  const [isSaving, setIsSaving] = useState(false)
  const [blockingPopup, setBlockingPopup] = useState<BlockingPopup | null>(null)
  const [emailVerificationPending, setEmailVerificationPending] = useState(false)
  const [verificationEmail, setVerificationEmail] = useState('')
  const [pendingHomeNavigation, setPendingHomeNavigation] = useState<string | null>(null)
  const currentStepIndexRef = useRef(currentStepIndex)
  const isSubmittedRef = useRef(isSubmitted)
  const isApplyingBrowserHistoryRef = useRef(false)
  const lastHistoryStepIndexRef = useRef(currentStepIndex)

  const { sessionId, saveStep, refetchSession, stepData, currentStep, resumedAt, sendEmailVerification, confirmEmailVerification, isLoading: sessionLoading, error: sessionError } =
    useWizardSession()

  const [showResumeSplash, setShowResumeSplash] = useState(false)
  useEffect(() => {
    if (!sessionLoading && resumedAt) {
      setShowResumeSplash(true)
      const t = setTimeout(() => setShowResumeSplash(false), 5000)
      return () => clearTimeout(t)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionLoading])

  useEffect(() => {
    if (!sessionLoading && currentStep > 1) {
      setCurrentStepIndex(currentStep - 1)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionLoading])

  // Hydrate individual step states from session data when resuming an existing session
  useEffect(() => {
    if (sessionLoading || Object.keys(stepData).length === 0) return

    const s1 = stepData['1']
    if (s1) {
      const cvrNumber = (s1.cvr_number as string) ?? ''
      const companyName = (s1.company_name as string) ?? ''
      const contactJobTitle =
        (s1.contact_job_title as string | undefined) ??
        (s1.contactJobTitle as string | undefined) ??
        (s1.contact_title as string | undefined) ??
        (s1.title as string | undefined) ??
        ''
      const cvrDisplayValue = companyName && cvrNumber
        ? `${companyName} (CVR: ${cvrNumber})`
        : companyName || cvrNumber

      setFormData({
        contactName: (s1.contact_name as string) ?? '',
        contactJobTitle,
        contactEmail: (s1.contact_email as string) ?? '',
        contactPhone: (s1.contact_phone as string) ?? '',
        companyId: cvrNumber,
        website: (s1.website as string) ?? '',
        branchCodesCorrect: '',
      })
      setCvrData({
        cvr_number: cvrNumber,
        company_name: companyName,
        company_type: (s1.company_type as string) ?? '',
        address: (s1.address as string) ?? '',
        zip_code: (s1.zip_code as string) ?? '',
        city: (s1.city as string) ?? '',
        industry_code: (s1.industry_code as string) ?? '',
        industry_description: (s1.industry_description as string) ?? '',
      })
      setSelectedCompany({
        id: cvrNumber,
        label: companyName,
        branchCodes: [],
      })
      setCvrQuery(cvrDisplayValue)
    }

    const s2 = stepData['2']
    if (s2?.cvr_confirmed) setCvrConfirmed(true)

    const s3 = stepData['3']
    if (s3) {
      setSelectedServices((s3.selected_services as string[]) ?? [])
      setAndetBeskrivelse((s3.andet_beskrivelse as string) ?? '')
    }

    const s4 = stepData['4']
    if (s4) {
      setNoEmployees(Boolean(s4.no_employees))
      setEmployeeCount((s4.employee_count as number | undefined) ?? '')
      setEmployeeTypes((s4.employee_types as string[]) ?? [])
      setTotalLoensum((s4.total_loensum as number | undefined) ?? '')
    }

    const s5 = stepData['5']
    if (s5) {
      setOverenskomstStatus((s5.overenskomst_status as string) ?? '')
      setOverenskomstType((s5.overenskomst_type as string) ?? '')
      setDocumentId((s5.document_id as string) ?? '')
    }

    const s6 = stepData['6']
    if (s6?.branchefaellesskaber) setSelectedFaellesskaber(s6.branchefaellesskaber as string[])

    const s7 = stepData['7']
    if (s7?.accept_membership) setAcceptMembership(Boolean(s7.accept_membership))

    const s8 = stepData['8']
    if (s8) {
      const toContact = (obj: unknown): ContactPerson => {
        const c = obj as Record<string, string>
        return { name: c?.name ?? '', email: c?.email ?? '', phone: c?.phone ?? '', title: c?.title ?? '' }
      }
      if (s8.managing_director) setManagingDirector(toContact(s8.managing_director))
      if (s8.hr_contact) setHrContact(toContact(s8.hr_contact))
      if (s8.payroll_contact) setPayrollContact(toContact(s8.payroll_contact))
      if (s8.authorized_signatory) setAuthorizedSignatory(toContact(s8.authorized_signatory))
      if (s8.invoice_delivery) setInvoiceDelivery(s8.invoice_delivery as string)
    }

    const s9 = stepData['9']
    if (s9) {
      setAcceptTerms(Boolean(s9.accept_terms))
      setAcceptAuthority(Boolean(s9.accept_authority))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionLoading])

  // Keep a stable ref to refetchSession so the effect below doesn't re-run on every render
  const refetchRef = useRef(refetchSession)
  useEffect(() => { refetchRef.current = refetchSession })

  const centerRef = useRef<HTMLElement>(null)
  const summaryRef = useRef<HTMLElement>(null)
  useEffect(() => {
    centerRef.current?.scrollTo({ top: 0 })

    const container = summaryRef.current
    const activeSection = container?.querySelector<HTMLElement>(
      `[data-step-index="${currentStepIndex}"]`,
    )
    if (container && activeSection) {
      const containerMid = container.clientHeight / 2
      const targetTop = activeSection.offsetTop - containerMid + activeSection.offsetHeight / 2
      container.scrollTo({ top: targetTop, behavior: 'smooth' })
    }
  }, [currentStepIndex])

  // Whenever step 7 (membership) becomes active, fetch the latest computed membership
  // from backend — handles going back and changing services/employees/overenskomst/branches
  useEffect(() => {
    if (currentStepIndex === 6 && sessionId) {
      refetchRef.current()
    }
  }, [currentStepIndex, sessionId])

  const isMitIdStep = currentStepIndex === mitIdStepIndex
  const isPostWizard = isMitIdStep || isSubmitted
  const isApprovalStep = currentStepIndex === wizardStepCount - 1

  const completedWizardSteps = useMemo(
    () => [
      hasCompletedCompanyInformation(formData) && Boolean(cvrData),
      cvrConfirmed,
      selectedServices.length > 0 &&
        (!selectedServices.includes('andet') || andetBeskrivelse.trim().length > 0),
      (noEmployees || employeeCount !== '') &&
        employeeTypes.length > 0 &&
        totalLoensum !== '',
      overenskomstStatus.length > 0 &&
        (overenskomstStatus !== 'ja' || overenskomstType.length > 0) &&
        (
          overenskomstStatus !== 'ja' ||
          overenskomstType !== 'direkte' ||
          documentId.length > 0
        ),
      selectedFaellesskaber.length > 0,
      acceptMembership,
      managingDirector.name.trim().length > 0 &&
        managingDirector.email.trim().length > 0 &&
        invoiceDelivery.length > 0,
      acceptTerms && acceptAuthority,
    ],
    [
      acceptAuthority,
      acceptMembership,
      acceptTerms,
      andetBeskrivelse,
      cvrConfirmed,
      cvrData,
      documentId,
      employeeCount,
      employeeTypes,
      formData,
      invoiceDelivery,
      managingDirector,
      noEmployees,
      overenskomstStatus,
      overenskomstType,
      selectedFaellesskaber,
      selectedServices,
      totalLoensum,
    ],
  )

  const canAccessWizardStep = useCallback((stepIndex: number) => {
    if (stepIndex <= 0) return true
    return completedWizardSteps
      .slice(0, stepIndex)
      .every(Boolean)
  }, [completedWizardSteps])

  useEffect(() => {
    currentStepIndexRef.current = currentStepIndex
  }, [currentStepIndex])

  useEffect(() => {
    isSubmittedRef.current = isSubmitted
  }, [isSubmitted])

  useEffect(() => {
    const handleHomeClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        isSubmittedRef.current
      ) {
        return
      }

      const target = event.target instanceof Element ? event.target : null
      const link = target?.closest<HTMLAnchorElement>('a[href]')
      if (!link) return

      const url = new URL(link.href, window.location.href)
      if (url.origin !== window.location.origin || url.pathname !== '/' || url.search || url.hash) {
        return
      }

      event.preventDefault()
      setPendingHomeNavigation(url.pathname)
    }

    document.addEventListener('click', handleHomeClick, true)
    return () => document.removeEventListener('click', handleHomeClick, true)
  }, [])

  useEffect(() => {
    const currentState = window.history.state as Record<string, unknown> | null
    window.history.replaceState(
      { ...(currentState ?? {}), [wizardStepHistoryStateKey]: currentStepIndexRef.current },
      '',
      window.location.href,
    )
    lastHistoryStepIndexRef.current = currentStepIndexRef.current

    const handlePopState = (event: PopStateEvent) => {
      const state = event.state as Record<string, unknown> | null
      const stepIndex = state?.[wizardStepHistoryStateKey]
      if (typeof stepIndex !== 'number' || isSubmittedRef.current) return
      const boundedStepIndex = Math.max(0, Math.min(stepIndex, mitIdStepIndex))

      setValidationMessage(undefined)
      setIsSubmitted(false)
      isApplyingBrowserHistoryRef.current = true
      lastHistoryStepIndexRef.current = boundedStepIndex
      setCurrentStepIndex(boundedStepIndex)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    if (isSubmitted) return

    if (isApplyingBrowserHistoryRef.current) {
      isApplyingBrowserHistoryRef.current = false
      lastHistoryStepIndexRef.current = currentStepIndex
      return
    }

    const lastStepIndex = lastHistoryStepIndexRef.current
    if (currentStepIndex === lastStepIndex) return

    if (currentStepIndex > lastStepIndex) {
      for (let stepIndex = lastStepIndex + 1; stepIndex <= currentStepIndex; stepIndex += 1) {
        const state = window.history.state as Record<string, unknown> | null
        window.history.pushState(
          { ...(state ?? {}), [wizardStepHistoryStateKey]: stepIndex },
          '',
          window.location.href,
        )
      }
    } else {
      const state = window.history.state as Record<string, unknown> | null
      window.history.replaceState(
        { ...(state ?? {}), [wizardStepHistoryStateKey]: currentStepIndex },
        '',
        window.location.href,
      )
    }

    lastHistoryStepIndexRef.current = currentStepIndex
  }, [currentStepIndex, isSubmitted])

  const wizardSteps = useMemo<WizardStep[]>(
    () =>
      wizardStepLabels.map((label, index) => ({
        label,
        isDisabled: !canAccessWizardStep(index),
        status:
          index < currentStepIndex && completedWizardSteps[index]
            ? 'complete'
            : index === currentStepIndex
              ? 'current'
              : 'upcoming',
      })),
    [canAccessWizardStep, completedWizardSteps, currentStepIndex],
  )

  const progressPercentage = useMemo(() => {
    const hasEmployeeCount = noEmployees || employeeCount !== ''
    const hasManagingDirector = managingDirector.name.trim().length > 0 && managingDirector.email.trim().length > 0

    return calculateAnsweredProgress([
      formData.contactName.trim().length > 0,
      formData.contactJobTitle.trim().length > 0,
      formData.contactEmail.trim().length > 0,
      formData.contactPhone.trim().length > 0,
      formData.companyId.trim().length > 0,
      cvrConfirmed,
      selectedServices.length > 0,
      selectedServices.includes('andet') ? andetBeskrivelse.trim().length > 0 : null,
      hasEmployeeCount,
      employeeTypes.length > 0,
      totalLoensum !== '',
      overenskomstStatus.length > 0,
      overenskomstStatus === 'ja' ? overenskomstType.length > 0 : null,
      overenskomstType === 'direkte' ? documentId.length > 0 : null,
      selectedFaellesskaber.length > 0,
      acceptMembership,
      hasManagingDirector,
      invoiceDelivery.length > 0,
      acceptTerms,
      acceptAuthority,
    ])
  }, [
    acceptAuthority,
    acceptMembership,
    acceptTerms,
    andetBeskrivelse,
    cvrConfirmed,
    documentId,
    employeeCount,
    employeeTypes,
    formData,
    invoiceDelivery,
    managingDirector,
    noEmployees,
    overenskomstStatus,
    overenskomstType,
    selectedFaellesskaber,
    selectedServices,
    totalLoensum,
  ])

  function updateField<Key extends keyof WizardFormData>(key: Key, value: WizardFormData[Key]) {
    setValidationMessage(undefined)
    setFormData((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isMitIdStep) {
      return
    }

    setValidationMessage(undefined)

    // ── Step 1 ──────────────────────────────────────────────────
    if (currentStepIndex === 0) {
      if (!hasCompletedCompanyInformation(formData)) {
        setValidationMessage(
          'Udfyld kontaktoplysningerne og vælg virksomheden fra CVR-søgningen, før du fortsætter.',
        )
        return
      }
      if (!cvrData) {
        setValidationMessage('Vælg en virksomhed fra CVR-søgningen, før du fortsætter.')
        return
      }
      setIsSaving(true)
      try {
        await saveStep(1, {
          cvr_number: cvrData.cvr_number,
          company_name: cvrData.company_name,
          company_type: cvrData.company_type,
          address: cvrData.address,
          zip_code: cvrData.zip_code,
          city: cvrData.city,
          industry_code: cvrData.industry_code,
          industry_description: cvrData.industry_description,
          contact_name: formData.contactName,
          contact_job_title: formData.contactJobTitle,
          contactJobTitle: formData.contactJobTitle,
          contact_email: formData.contactEmail,
          contact_phone: formData.contactPhone || undefined,
          website: formData.website || undefined,
        })
        const email = await sendEmailVerification()
        setVerificationEmail(email)
        setEmailVerificationPending(true)
      } catch (err) {
        setValidationMessage(err instanceof Error ? err.message : 'Noget gik galt. Prøv igen.')
      } finally {
        setIsSaving(false)
      }
      return
    }

    // ── Step 2 ──────────────────────────────────────────────────
    if (currentStepIndex === 1) {
      if (!cvrConfirmed) {
        setValidationMessage('Bekræft virksomhedsoplysningerne for at fortsætte.')
        return
      }
      setIsSaving(true)
      try {
        const response = await saveStep(2, { cvr_confirmed: cvrConfirmed })
        setCurrentStepIndex((response.next_step ?? 3) - 1)
      } catch {
        setValidationMessage('Noget gik galt. Prøv igen.')
      } finally {
        setIsSaving(false)
      }
      return
    }

    // ── Step 3 ──────────────────────────────────────────────────
    if (currentStepIndex === 2) {
      if (selectedServices.length === 0) {
        setValidationMessage('Vælg mindst én service for at fortsætte.')
        return
      }
      setIsSaving(true)
      try {
        const response = await saveStep(3, {
          selected_services: selectedServices,
          ...(andetBeskrivelse ? { andet_beskrivelse: andetBeskrivelse } : {}),
        })
        setCurrentStepIndex((response.next_step ?? 4) - 1)
      } catch {
        setValidationMessage('Noget gik galt. Prøv igen.')
      } finally {
        setIsSaving(false)
      }
      return
    }

    // ── Step 4 ──────────────────────────────────────────────────
    if (currentStepIndex === 3) {
      if (employeeTypes.length === 0) {
        setValidationMessage('Vælg mindst én medarbejdertype for at fortsætte.')
        return
      }
      if (totalLoensum === '') {
        setValidationMessage('Angiv den samlede lønsum for at fortsætte.')
        return
      }
      setIsSaving(true)
      try {
        const response = await saveStep(4, {
          employee_count: noEmployees ? 0 : (employeeCount === '' ? 0 : employeeCount),
          no_employees: noEmployees,
          employee_types: employeeTypes,
          total_loensum: totalLoensum,
        })
        setCurrentStepIndex((response.next_step ?? 5) - 1)
      } catch {
        setValidationMessage('Noget gik galt. Prøv igen.')
      } finally {
        setIsSaving(false)
      }
      return
    }

    // ── Step 5 ──────────────────────────────────────────────────
    if (currentStepIndex === 4) {
      if (!overenskomstStatus) {
        setValidationMessage('Angiv jeres overenskomstsituation for at fortsætte.')
        return
      }
      if (overenskomstStatus === 'ja' && !overenskomstType) {
        setValidationMessage('Angiv hvilken type overenskomst for at fortsætte.')
        return
      }
      if (overenskomstStatus === 'ja' && overenskomstType === 'direkte' && !documentId) {
        setValidationMessage('Upload overenskomstdokumentet for at fortsætte.')
        return
      }
      setIsSaving(true)
      try {
        const response = await saveStep(5, {
          overenskomst_status: overenskomstStatus,
          ...(overenskomstType && overenskomstStatus === 'ja' ? { overenskomst_type: overenskomstType } : {}),
          ...(documentId && overenskomstType === 'direkte' && overenskomstStatus === 'ja' ? { document_id: documentId } : {}),
        })
        if (response.is_blocked && response.blocking_popup) {
          setBlockingPopup(response.blocking_popup)
        } else {
          setCurrentStepIndex((response.next_step ?? 6) - 1)
        }
      } catch {
        setValidationMessage('Noget gik galt. Prøv igen.')
      } finally {
        setIsSaving(false)
      }
      return
    }

    // ── Step 6 ──────────────────────────────────────────────────
    if (currentStepIndex === 5) {
      if (selectedFaellesskaber.length === 0) {
        setValidationMessage('Vælg mindst ét branchefællesskab for at fortsætte.')
        return
      }
      setIsSaving(true)
      try {
        const response = await saveStep(6, { branchefaellesskaber: selectedFaellesskaber })
        await refetchSession()
        setCurrentStepIndex((response.next_step ?? 7) - 1)
      } catch {
        setValidationMessage('Noget gik galt. Prøv igen.')
      } finally {
        setIsSaving(false)
      }
      return
    }

    // ── Step 7 ──────────────────────────────────────────────────
    if (currentStepIndex === 6) {
      if (!acceptMembership) {
        setValidationMessage('Bekræft den anbefalede medlemskabstype for at fortsætte.')
        return
      }
      const step5 = stepData['5'] ?? {}
      const established_ag =
        step5.overenskomst_status === 'ja' && step5.overenskomst_type === 'direkte'
      const localMembership = computeMembership(
        computeTier(stepData['4']?.employee_count as number | undefined),
        Boolean(established_ag),
        stepData['6']?.branchefaellesskaber as string[] ?? [],
        stepData['3']?.selected_services as string[] ?? [],
      )
      setIsSaving(true)
      try {
        const response = await saveStep(7, {
          membership_type: localMembership ?? '',
          accept_membership: acceptMembership,
        })
        setCurrentStepIndex((response.next_step ?? 8) - 1)
      } catch {
        setValidationMessage('Noget gik galt. Prøv igen.')
      } finally {
        setIsSaving(false)
      }
      return
    }

    // ── Step 8 ──────────────────────────────────────────────────
    if (currentStepIndex === 7) {
      if (!managingDirector.name || !managingDirector.email) {
        setValidationMessage('Udfyld navn og email for administrerende direktør.')
        return
      }
      if (!invoiceDelivery) {
        setValidationMessage('Vælg hvordan I ønsker at modtage faktura.')
        return
      }
      const toContact = (c: ContactPerson) => ({
        name: c.name,
        email: c.email,
        ...(c.phone ? { phone: c.phone } : {}),
        ...(c.title ? { title: c.title } : {}),
      })
      setIsSaving(true)
      try {
        const response = await saveStep(8, {
          managing_director: toContact(managingDirector),
          hr_contact: hrContact ? toContact(hrContact) : null,
          payroll_contact: payrollContact ? toContact(payrollContact) : null,
          authorized_signatory: authorizedSignatory ? toContact(authorizedSignatory) : null,
          invoice_delivery: invoiceDelivery,
        })
        setCurrentStepIndex((response.next_step ?? 9) - 1)
      } catch {
        setValidationMessage('Noget gik galt. Prøv igen.')
      } finally {
        setIsSaving(false)
      }
      return
    }

    // ── Step 9 ──────────────────────────────────────────────────
    if (currentStepIndex === 8) {
      if (!acceptTerms || !acceptAuthority) {
        setValidationMessage('Acceptér begge betingelser for at fortsætte.')
        return
      }
      setIsSaving(true)
      try {
        await saveStep(9, { accept_terms: acceptTerms, accept_authority: acceptAuthority })
        setCurrentStepIndex(mitIdStepIndex)
      } catch {
        setValidationMessage('Noget gik galt. Prøv igen.')
      } finally {
        setIsSaving(false)
      }
      return
    }

    setCurrentStepIndex((stepIndex) => Math.min(stepIndex + 1, wizardStepCount - 1))
  }

  function handleBack() {
    setValidationMessage(undefined)
    setIsSubmitted(false)
    setCurrentStepIndex((stepIndex) => Math.max(stepIndex - 1, 0))
  }

  function cancelHomeNavigation() {
    setPendingHomeNavigation(null)
  }

  function confirmHomeNavigation() {
    const destination = pendingHomeNavigation ?? '/'
    setPendingHomeNavigation(null)
    navigate(destination)
  }

  function handleStepSelect(stepIndex: number) {
    if (stepIndex === currentStepIndex) return
    if (!canAccessWizardStep(stepIndex)) return
    setValidationMessage(undefined)
    setCurrentStepIndex(stepIndex)
  }

  async function completeMitIdVerification() {
    if (!sessionId) return

    setIsSaving(true)
    try {
      await saveStep(10, {})
      const result = await submitRegistration(sessionId)
      setSubmittedRegistrationId(result.registration_id)
      setSubmittedAt(new Date())
      setMitIdStatus('verified')
      setIsSubmitted(true)
    } catch {
      setMitIdStatus('login')
      setValidationMessage('Noget gik galt ved afslutningen. Prøv igen.')
    } finally {
      setIsSaving(false)
    }
  }

  function handleMitIdVerification() {
    setValidationMessage(undefined)

    if (mitIdStatus === 'idle') {
      setMitIdStatus('redirecting')

      window.setTimeout(() => {
        setMitIdStatus('login')
      }, 900)
      return
    }

    if (mitIdStatus === 'login') {
      setMitIdStatus('approving')

      window.setTimeout(() => {
        completeMitIdVerification()
      }, 1200)
    }
  }

  function renderCurrentStep() {
    if (isSubmitted) {
      const submittedDate = submittedAt
        ? submittedAt.toLocaleDateString('da-DK', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })
        : null

      return (
        <section className={styles.submissionReceipt} aria-live="polite">
          <div className={styles.submissionReceipt__hero}>
            <CheckCircle2 aria-hidden="true" />
            <span>Indsendt</span>
            <h2>Tak for din anmodning om indmeldelse</h2>
            <p>
              Vi har modtaget jeres oplysninger og gennemgår anmodningen. Vi vender tilbage på den angivne kontaktmail, hvis vi mangler yderligere oplysninger.
            </p>
          </div>

          <dl className={styles.submissionReceipt__details}>
            <div>
              <dt>Virksomhed</dt>
              <dd>{selectedCompany?.label ?? cvrData?.company_name ?? 'Ikke angivet'}</dd>
            </div>
            <div>
              <dt>Reference</dt>
              <dd>{submittedRegistrationId ?? sessionId}</dd>
            </div>
            <div>
              <dt>Indsendt</dt>
              <dd>{submittedDate ?? 'Netop nu'}</dd>
            </div>
            <div>
              <dt>Kontaktmail</dt>
              <dd>{formData.contactEmail || 'Ikke angivet'}</dd>
            </div>
          </dl>

          <div className={styles.submissionReceipt__nextSteps}>
            <h3>Hvad sker der nu?</h3>
            <ul>
              <li>
                <FileCheck2 aria-hidden="true" />
                <span>DI gennemgår indmeldelsen og de oplysninger, I har sendt.</span>
              </li>
              <li>
                <Mail aria-hidden="true" />
                <span>I får besked på kontaktmailen, når behandlingen er færdig, eller hvis vi har spørgsmål.</span>
              </li>
              <li>
                <Clock3 aria-hidden="true" />
                <span>I behøver ikke gøre mere lige nu. Gem gerne reference-id'et, hvis I kontakter DI om sagen.</span>
              </li>
            </ul>
          </div>
        </section>
      )
    }

    switch (currentStepIndex) {
      case 0:
        return (
          <CompanyInformationStep
            formData={formData}
            onFieldChange={updateField}
            onCompanyFound={setSelectedCompany}
            onCvrDataChange={setCvrData}
            cvrQuery={cvrQuery}
            onCvrQueryChange={setCvrQuery}
          />
        )
      case 1:
        return (
          <BranchStep
            cvrData={cvrData}
            cvrConfirmed={cvrConfirmed}
            onCvrConfirmedChange={setCvrConfirmed}
          />
        )
      case 2:
        return (
          <NeedsStep
            selectedServices={selectedServices}
            onServicesChange={setSelectedServices}
            andetBeskrivelse={andetBeskrivelse}
            onAndetChange={setAndetBeskrivelse}
          />
        )
      case 3:
        return (
          <EmployeesStep
            employeeCount={employeeCount}
            onEmployeeCountChange={setEmployeeCount}
            noEmployees={noEmployees}
            onNoEmployeesChange={setNoEmployees}
            employeeTypes={employeeTypes}
            onEmployeeTypesChange={setEmployeeTypes}
            totalLoensum={totalLoensum}
            onTotalLoensumChange={setTotalLoensum}
          />
        )
      case 4:
        return (
          <AgreementStep
            sessionId={sessionId ?? ''}
            overenskomstStatus={overenskomstStatus}
            onStatusChange={setOverenskomstStatus}
            overenskomstType={overenskomstType}
            onTypeChange={setOverenskomstType}
            documentId={documentId}
            onDocumentIdChange={setDocumentId}
            isUploading={isUploading}
            onUploadingChange={setIsUploading}
          />
        )
      case 5:
        return (
          <AssociationsStep
            sessionId={sessionId ?? ''}
            selectedFaellesskaber={selectedFaellesskaber}
            onSelectionChange={setSelectedFaellesskaber}
            onAllLoaded={setAllFaellesskaber}
          />
        )
      case 6: {
        const employeeCount = stepData['4']?.employee_count as number | undefined
        const localTier = computeTier(employeeCount)
        const step5 = stepData['5'] ?? {}
        const established_ag =
          step5.overenskomst_status === 'ja' && step5.overenskomst_type === 'direkte'
        const localMembership = computeMembership(
          localTier,
          Boolean(established_ag),
          stepData['6']?.branchefaellesskaber as string[] ?? [],
          stepData['3']?.selected_services as string[] ?? [],
        )
        return (
          <MembershipStep
            computedMembership={localMembership}
            tier={localTier}
            flags={{ established_ag: Boolean(established_ag) }}
            employeeCount={employeeCount}
            selectedServices={stepData['3']?.selected_services as string[] | undefined}
            overenskomstStatus={stepData['5']?.overenskomst_status as string | undefined}
            overenskomstType={stepData['5']?.overenskomst_type as string | undefined}
            branchefaellesskaber={stepData['6']?.branchefaellesskaber as string[] | undefined}
            acceptMembership={acceptMembership}
            onAcceptChange={setAcceptMembership}
          />
        )
      }
      case 7:
        return (
          <ContactsStep
            step1Contact={{
              name: formData.contactName,
              email: formData.contactEmail,
              phone: formData.contactPhone,
              title: formData.contactJobTitle,
            }}
            managingDirector={managingDirector}
            onManagingDirectorChange={setManagingDirector}
            hrContact={hrContact}
            onHrContactChange={setHrContact}
            payrollContact={payrollContact}
            onPayrollContactChange={setPayrollContact}
            authorizedSignatory={authorizedSignatory}
            onAuthorizedSignatoryChange={setAuthorizedSignatory}
            invoiceDelivery={invoiceDelivery}
            onInvoiceDeliveryChange={setInvoiceDelivery}
          />
        )
      case 8:
        return (
          <ApprovalStep
            acceptTerms={acceptTerms}
            onAcceptTermsChange={setAcceptTerms}
            acceptAuthority={acceptAuthority}
            onAcceptAuthorityChange={setAcceptAuthority}
          />
        )
      case 9:
        return (
          <MitIdVerificationStep
            status={mitIdStatus}
            onVerify={handleMitIdVerification}
          />
        )
      default:
        return null
    }
  }

  if (sessionLoading) {
    return (
      <WizardLayout progressIndicator={null} summary={null}>
        <p>Indlæser...</p>
      </WizardLayout>
    )
  }

  if (showResumeSplash && resumedAt) {
    const date = new Date(resumedAt).toLocaleDateString('da-DK', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    return (
      <div className={styles.resumeSplash}>
        <div className={styles.resumeSplash__inner}>
          <p className={styles.resumeSplash__text}>
            Du fortsætter dit indmeldingsflow fra din session d. {date}
          </p>
          <div className={styles.resumeSplash__track}>
            <div className={styles.resumeSplash__bar} />
          </div>
          <div className={styles.resumeSplash__contact}>
            <p>Brug for hjælp?</p>
            <a href="tel:+4533773377">33 77 33 77</a>
            <a href="mailto:di@di.dk">di@di.dk</a>
          </div>
        </div>
      </div>
    )
  }

  if (sessionError) {
    return (
      <WizardLayout progressIndicator={null} summary={null}>
        <InlineAlert tone="danger" title="Kunne ikke starte">
          {sessionError}
        </InlineAlert>
      </WizardLayout>
    )
  }

  const homeNavigationWarningDialog = (
    <Confirm
      headline="Forlad indmeldelsesflowet?"
      isOpen={pendingHomeNavigation !== null}
      onOpenChange={(open) => {
        if (!open) cancelHomeNavigation()
      }}
    >
      <ConfirmContent className={styles.homeNavigationWarning}>
        <p>
          Hvis du går til forsiden nu, forlader du indmeldelsesflowet.
          Oplysninger, der ikke er gemt på det nuværende trin, bliver slettet.
        </p>
      </ConfirmContent>
      <ConfirmFooter className={styles.homeNavigationWarningFooter}>
        <Button type="button" variant="outline" onPress={cancelHomeNavigation}>
          Bliv i flowet
        </Button>
        <Button type="button" variant="danger" onPress={confirmHomeNavigation}>
          Gå til forsiden
        </Button>
      </ConfirmFooter>
    </Confirm>
  )

  if (isPostWizard) {
    return (
      <main className={styles.postWizardPage}>
        <Form className={`${styles.form} ${styles.postWizardForm}`} noValidate onSubmit={handleSubmit}>
          {validationMessage ? (
            <InlineAlert tone="danger" title="Der mangler oplysninger">
              {validationMessage}
            </InlineAlert>
          ) : null}

          {renderCurrentStep()}
        </Form>

        <BlockingDialog
          popup={blockingPopup}
          onClose={() => setBlockingPopup(null)}
        />
        {homeNavigationWarningDialog}
      </main>
    )
  }

  return (
    <WizardLayout
      centerRef={centerRef}
      summaryRef={summaryRef}
      progressIndicator={
        <WizardStepsNavigation
          steps={wizardSteps}
          orientation="vertical"
          ariaLabel="Indmeldelsesflow"
          onStepSelect={handleStepSelect}
        />
      }
      summary={
        <WizardSummary
          currentStepIndex={currentStepIndex}
          formData={formData}
          selectedCompany={selectedCompany}
          selectedServices={selectedServices}
          andetBeskrivelse={andetBeskrivelse}
          employeeCount={employeeCount}
          noEmployees={noEmployees}
          overenskomstStatus={overenskomstStatus}
          selectedFaellesskaber={selectedFaellesskaber}
          allFaellesskaber={allFaellesskaber}
          managingDirector={managingDirector}
          hrContact={hrContact}
          payrollContact={payrollContact}
          authorizedSignatory={authorizedSignatory}
          invoiceDelivery={invoiceDelivery}
          computedMembership={computeMembership(
            computeTier(noEmployees ? 0 : (employeeCount !== '' ? employeeCount : undefined)),
            overenskomstStatus === 'ja',
            selectedFaellesskaber,
            selectedServices,
          )}
        />
      }
    >
      <Form className={styles.form} noValidate onSubmit={handleSubmit}>
        <WizardHeader
          currentStepIndex={currentStepIndex}
          progressPercentage={progressPercentage}
        />

        {validationMessage ? (
          <InlineAlert tone="danger" title="Der mangler oplysninger">
            {validationMessage}
          </InlineAlert>
        ) : null}

        {renderCurrentStep()}

        <footer className={styles.actions}>
          {currentStepIndex > 0 ? (
            <Button type="button" variant="outline" onPress={handleBack}>
              Tilbage
            </Button>
          ) : null}
          <Button
            type="submit"
            isDisabled={
              (isMitIdStep && (mitIdStatus !== 'verified' || isSubmitted)) ||
              isSaving ||
              !sessionId
            }
          >
            {isSaving ? 'Gemmer...' : isApprovalStep ? 'Bekræft' : 'Fortsæt'}
          </Button>
        </footer>
      </Form>

      <BlockingDialog
        popup={blockingPopup}
        onClose={() => setBlockingPopup(null)}
      />
      {homeNavigationWarningDialog}

      <EmailVerificationOverlay
        email={verificationEmail}
        isOpen={emailVerificationPending}
        onVerified={() => {
          setEmailVerificationPending(false)
          setCurrentStepIndex(1)
        }}
        onResend={() => sendEmailVerification().then(() => undefined)}
        onConfirm={confirmEmailVerification}
      />
    </WizardLayout>
  )
}
