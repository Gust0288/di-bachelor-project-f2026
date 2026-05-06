import styles from './WizardPage.module.scss'
import { wizardSteps } from './wizardSteps'

type WizardHeaderProps = {
  currentStepIndex: number
  progressPercentage: number
}

export default function WizardHeader({
  currentStepIndex,
  progressPercentage,
}: WizardHeaderProps) {
  const currentStep = wizardSteps[currentStepIndex]

  return (
    <header className={styles.header}>
      <div className={styles.headerMeta}>
        <span>DI-medlemskab</span>
        <span className={styles.headerProgress}>{progressPercentage}% udfyldt</span>
      </div>

      {currentStep ? (
        <>
          <h1>{currentStep.title}</h1>
          <p>{currentStep.description}</p>
        </>
      ) : null}
    </header>
  )
}
