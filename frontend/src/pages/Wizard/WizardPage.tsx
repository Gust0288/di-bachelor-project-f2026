import WizardLayout from '../../layouts/WizardLayout/WizardLayout'

export default function WizardPage() {
  return (
    <WizardLayout
      progressIndicator={<p>Progress indicator</p>}
      summary={<p>Summary</p>}
    >
      <p>Wizard indhold her</p>
    </WizardLayout>
  )
}
