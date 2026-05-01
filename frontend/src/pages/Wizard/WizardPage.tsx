import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'
import Button from '../../components/Button/Button'
import { Form } from '../../components/Form/Form'
import InlineAlert from '../../components/InlineAlert/InlineAlert'
import WizardStepsNavigation, {
  type WizardStep,
} from '../../components/WizardStepsNavigation/WizardStepsNavigation'
import WizardLayout from '../../layouts/WizardLayout/WizardLayout'
import BranchStep from './steps/BranchStep'
import CompanyInformationStep from './steps/CompanyInformationStep'
import WizardHeader from './WizardHeader'
import styles from './WizardPage.module.scss'
import WizardSummary from './WizardSummary'
import { initialFormData } from './wizard.constants'
import {
  calculateWizardProgress,
  hasCompletedBranchInformation,
  hasCompletedCompanyInformation,
} from './wizardProgress'
import { wizardStepLabels } from './wizardSteps'
import type { CompanyOption, WizardFormData } from './wizard.types'

const implementedStepCount = 2

function getStepValidationMessage(
  stepIndex: number,
  formData: WizardFormData,
) {
  if (stepIndex === 0 && !hasCompletedCompanyInformation(formData)) {
    return 'Udfyld kontaktoplysningerne og vælg virksomheden fra CVR-søgningen, før du fortsætter.'
  }

  if (stepIndex === 1 && !hasCompletedBranchInformation(formData)) {
    return 'Bekræft om branchekoden er korrekt, før du fortsætter.'
  }

  return undefined
}

export default function WizardPage() {
  const [formData, setFormData] = useState(initialFormData)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [selectedCompany, setSelectedCompany] = useState<CompanyOption | undefined>(undefined)
  const [validationMessage, setValidationMessage] = useState<string>()
  const canAccessBranchStep = hasCompletedCompanyInformation(formData)

  const wizardSteps = useMemo<WizardStep[]>(
    () =>
      wizardStepLabels.map((label, index) => ({
        label,
        isDisabled:
          index >= implementedStepCount ||
          (index === 1 && !canAccessBranchStep),
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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const message = getStepValidationMessage(currentStepIndex, formData)

    if (message) {
      setValidationMessage(message)
      return
    }

    setValidationMessage(undefined)
    setCurrentStepIndex((stepIndex) =>
      Math.min(stepIndex + 1, implementedStepCount - 1),
    )
  }

  function handleBack() {
    setValidationMessage(undefined)
    setCurrentStepIndex((stepIndex) => Math.max(stepIndex - 1, 0))
  }

  function handleStepSelect(stepIndex: number) {
    if (stepIndex >= implementedStepCount || stepIndex === currentStepIndex) {
      return
    }

    if (stepIndex < currentStepIndex) {
      setValidationMessage(undefined)
      setCurrentStepIndex(stepIndex)
      return
    }

    const message = getStepValidationMessage(currentStepIndex, formData)

    if (message) {
      setValidationMessage(message)
      return
    }

    setValidationMessage(undefined)
    setCurrentStepIndex(stepIndex)
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

        {currentStepIndex === 1 ? (
          <BranchStep
            formData={formData}
            selectedCompany={selectedCompany}
            onFieldChange={updateField}
          />
        ) : (
          <CompanyInformationStep
            formData={formData}
            onFieldChange={updateField}
            onCompanyFound={setSelectedCompany}
          />
        )}

        <footer className={styles.actions}>
          {currentStepIndex > 0 ? (
            <Button type="button" variant="outline" onPress={handleBack}>
              Tilbage
            </Button>
          ) : null}
          <Button type="submit">Fortsæt</Button>
        </footer>
      </Form>
    </WizardLayout>
  )
}
