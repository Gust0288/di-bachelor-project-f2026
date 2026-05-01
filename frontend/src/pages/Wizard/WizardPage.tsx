import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'
import Button from '../../components/Button/Button'
import { Form } from '../../components/Form/Form'
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
import { wizardStepLabels } from './wizardSteps'
import type { CompanyOption, WizardFormData } from './wizard.types'

const implementedStepCount = 2
const companyOptions: CompanyOption[] = []

export default function WizardPage() {
  const [formData, setFormData] = useState(initialFormData)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)

  const wizardSteps = useMemo<WizardStep[]>(
    () =>
      wizardStepLabels.map((label, index) => ({
        label,
        status:
          index < currentStepIndex
            ? 'complete'
            : index === currentStepIndex
              ? 'current'
              : 'upcoming',
      })),
    [currentStepIndex],
  )

  const selectedCompany = useMemo(
    () => companyOptions.find((option) => option.id === formData.companyId),
    [formData.companyId],
  )

  function updateField<Key extends keyof WizardFormData>(
    key: Key,
    value: WizardFormData[Key],
  ) {
    setFormData((current) => ({
      ...current,
      [key]: value,
    }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setCurrentStepIndex((stepIndex) =>
      Math.min(stepIndex + 1, implementedStepCount - 1),
    )
  }

  function handleBack() {
    setCurrentStepIndex((stepIndex) => Math.max(stepIndex - 1, 0))
  }

  return (
    <WizardLayout
      progressIndicator={
        <WizardStepsNavigation
          steps={wizardSteps}
          orientation="vertical"
          ariaLabel="Indmeldelsesflow"
        />
      }
      summary={
        <WizardSummary formData={formData} selectedCompany={selectedCompany} />
      }
    >
      <Form className={styles.form} onSubmit={handleSubmit}>
        <WizardHeader currentStepIndex={currentStepIndex} />

        {currentStepIndex === 1 ? (
          <BranchStep
            formData={formData}
            selectedCompany={selectedCompany}
            onFieldChange={updateField}
          />
        ) : (
          <CompanyInformationStep
            companyOptions={companyOptions}
            formData={formData}
            onFieldChange={updateField}
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
