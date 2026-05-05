import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'
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
import WizardHeader from './WizardHeader'
import styles from './WizardPage.module.scss'
import WizardSummary from './WizardSummary'
import { initialFormData } from './wizard.constants'
import { hasCompletedCompanyInformation } from './wizardProgress'
import { wizardStepLabels } from './wizardSteps'
import type { CompanyOption, WizardFormData } from './wizard.types'
import type { CvrHiddenFields } from './types'
import { useWizardSession } from './useWizardSession'
import { calculateWizardProgress } from './wizardProgress'

const wizardStepCount = wizardStepLabels.length

export default function WizardPage() {
  const [formData, setFormData] = useState(initialFormData)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [selectedCompany, setSelectedCompany] = useState<CompanyOption | undefined>(undefined)
  const [validationMessage, setValidationMessage] = useState<string>()
  const [cvrData, setCvrData] = useState<CvrHiddenFields | null>(null)
  const [cvrConfirmed, setCvrConfirmed] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const { sessionId, saveStep, isLoading: sessionLoading, error: sessionError } = useWizardSession()

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

  function updateField<Key extends keyof WizardFormData>(
    key: Key,
    value: WizardFormData[Key],
  ) {
    setValidationMessage(undefined)
    setFormData((current) => ({
      ...current,
      [key]: value,
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setValidationMessage(undefined)

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
        const payload: Record<string, unknown> = {
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
        }
        const response = await saveStep(1, payload)
        setCurrentStepIndex((response.next_step ?? 2) - 1)
      } catch {
        setValidationMessage('Noget gik galt. Prøv igen.')
      } finally {
        setIsSaving(false)
      }
      return
    }

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

    setCurrentStepIndex((stepIndex) => Math.min(stepIndex + 1, wizardStepCount - 1))
  }

  function handleBack() {
    setValidationMessage(undefined)
    setCurrentStepIndex((stepIndex) => Math.max(stepIndex - 1, 0))
  }

  function handleStepSelect(stepIndex: number) {
    if (stepIndex === currentStepIndex) return

    if (stepIndex < currentStepIndex) {
      setValidationMessage(undefined)
      setCurrentStepIndex(stepIndex)
      return
    }

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
        return <NeedsStep />
      case 3:
        return <EmployeesStep />
      case 4:
        return <AgreementStep />
      case 5:
        return <AssociationsStep />
      case 6:
        return <MembershipStep />
      case 7:
        return <ContactsStep />
      case 8:
        return <ApprovalStep />
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
    </WizardLayout>
  )
}
