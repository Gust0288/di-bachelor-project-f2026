import styles from './WizardPage.module.scss'
import { wizardStepLabels } from './wizardSteps'

type WizardHeaderProps = {
  currentStepIndex: number
  progressPercentage: number
}

export default function WizardHeader({
  currentStepIndex,
  progressPercentage,
}: WizardHeaderProps) {
  const currentStepLabel = wizardStepLabels[currentStepIndex]

  return (
    <header className={styles.header}>
      <div className={styles.headerMeta}>
        <span>DI-medlemskab</span>
        <span>{progressPercentage}% udfyldt</span>
      </div>

      {currentStepIndex > 1 ? (
        <h1>{currentStepLabel}</h1>
      ) : currentStepIndex === 1 ? (
        <>
          <h1>Hvad laver din virksomhed?</h1>
          <p>
            Vi bruger virksomhedens brancheoplysninger fra CVR til at finde de
            relevante DI-fællesskaber og medlemsvilkår.
          </p>
        </>
      ) : (
        <>
          <h1>Indmeldelse i Dansk Industri</h1>
          <p>
            Tak for din interesse i et DI-medlemskab. For at kunne tilbyde det
            rette medlemskab skal vi bruge en række oplysninger om virksomheden.
          </p>
        </>
      )}
    </header>
  )
}
