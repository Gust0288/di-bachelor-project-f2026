import styles from './WizardPage.module.scss'

type WizardHeaderProps = {
  currentStepIndex: number
}

export default function WizardHeader({ currentStepIndex }: WizardHeaderProps) {
  return (
    <header className={styles.header}>
      {currentStepIndex === 1 ? (
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
