import type { FormEvent } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import Button from '../../components/Button/Button'
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
import BlockingDialog from './BlockingDialog'
import WizardHeader from './WizardHeader'
import styles from './WizardPage.module.scss'
import WizardSummary from './WizardSummary'
import { initialFormData } from './wizard.constants'
import { calculateWizardProgress, hasCompletedCompanyInformation } from './wizardProgress'
import { wizardStepLabels } from './wizardSteps'
import type { CompanyOption, WizardFormData } from './wizard.types'
import type { BlockingPopup, CvrHiddenFields } from './types'
import { useWizardSession } from './useWizardSession'
import type { ContactPerson } from './steps/ContactPersonFields'

const wizardStepCount = wizardStepLabels.length

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
  // ── Step 1 state ──────────────────────────────────────────────
  const [formData, setFormData] = useState<WizardFormData>(initialFormData)
  const [selectedCompany, setSelectedCompany] = useState<CompanyOption | undefined>(undefined)
  const [cvrData, setCvrData] = useState<CvrHiddenFields | null>(null)

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
  const [isSaving, setIsSaving] = useState(false)
  const [blockingPopup, setBlockingPopup] = useState<BlockingPopup | null>(null)

  const { sessionId, saveStep, refetchSession, stepData, isLoading: sessionLoading, error: sessionError } =
    useWizardSession()

  // Keep a stable ref to refetchSession so the effect below doesn't re-run on every render
  const refetchRef = useRef(refetchSession)
  useEffect(() => { refetchRef.current = refetchSession })

  // Whenever step 7 (membership) becomes active, fetch the latest computed membership
  // from backend — handles going back and changing services/employees/overenskomst/branches
  useEffect(() => {
    if (currentStepIndex === 6 && sessionId) {
      refetchRef.current()
    }
  }, [currentStepIndex, sessionId])

  const canAccessBranchStep = hasCompletedCompanyInformation(formData)

  const wizardSteps = useMemo<WizardStep[]>(
    () =>
      wizardStepLabels.map((label, index) => ({
        label,
        isDisabled: index === 1 && !canAccessBranchStep,
        status:
          index < currentStepIndex
            ? 'complete'
            : index === currentStepIndex
              ? 'current'
              : 'upcoming',
      })),
    [canAccessBranchStep, currentStepIndex],
  )

  const progressPercentage = useMemo(
    () => calculateWizardProgress(formData),
    [formData],
  )

  function updateField<Key extends keyof WizardFormData>(key: Key, value: WizardFormData[Key]) {
    setValidationMessage(undefined)
    setFormData((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
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
        const response = await saveStep(1, {
          cvr_number: cvrData.cvr_number,
          company_name: cvrData.company_name,
          company_type: cvrData.company_type,
          address: cvrData.address,
          zip_code: cvrData.zip_code,
          city: cvrData.city,
          industry_code: cvrData.industry_code,
          industry_description: cvrData.industry_description,
          contact_name: formData.contactName,
          contact_email: formData.contactEmail,
          contact_phone: formData.contactPhone || undefined,
          website: formData.website || undefined,
        })
        setCurrentStepIndex((response.next_step ?? 2) - 1)
      } catch {
        setValidationMessage('Noget gik galt. Prøv igen.')
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
      if (overenskomstType === 'direkte' && !documentId) {
        setValidationMessage('Upload overenskomstdokumentet for at fortsætte.')
        return
      }
      setIsSaving(true)
      try {
        const response = await saveStep(5, {
          overenskomst_status: overenskomstStatus,
          ...(overenskomstType ? { overenskomst_type: overenskomstType } : {}),
          ...(documentId ? { document_id: documentId } : {}),
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
        setCurrentStepIndex((prev) => Math.min(prev + 1, wizardStepCount - 1))
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
    setCurrentStepIndex((stepIndex) => Math.max(stepIndex - 1, 0))
  }

  function handleStepSelect(stepIndex: number) {
    if (stepIndex === currentStepIndex) return
    setValidationMessage(undefined)
    setCurrentStepIndex(stepIndex)
  }

  function renderCurrentStep() {
    switch (currentStepIndex) {
      case 0:
        return (
          <CompanyInformationStep
            formData={formData}
            onFieldChange={updateField}
            onCompanyFound={setSelectedCompany}
            onCvrDataChange={setCvrData}
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

  if (sessionError) {
    return (
      <WizardLayout progressIndicator={null} summary={null}>
        <InlineAlert tone="danger" title="Kunne ikke starte">
          {sessionError}
        </InlineAlert>
      </WizardLayout>
    )
  }

  return (
    <WizardLayout
      progressIndicator={
        <WizardStepsNavigation
          steps={wizardSteps}
          orientation="vertical"
          ariaLabel="Indmeldelsesflow"
          onStepSelect={handleStepSelect}
        />
      }
      summary={
        <WizardSummary formData={formData} selectedCompany={selectedCompany} />
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
          <Button type="submit" isDisabled={isSaving || !sessionId}>
            {isSaving ? 'Gemmer...' : 'Fortsæt'}
          </Button>
        </footer>
      </Form>

      <BlockingDialog
        popup={blockingPopup}
        onClose={() => setBlockingPopup(null)}
      />
    </WizardLayout>
  )
}
