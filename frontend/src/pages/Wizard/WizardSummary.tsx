import type { CompanyOption, WizardFormData } from './wizard.types'
import styles from './WizardPage.module.scss'

type WizardSummaryProps = {
  formData: WizardFormData
  selectedCompany?: CompanyOption
}

type SummaryItem = {
  label: string
  value: string
}

function getBranchConfirmation(value: WizardFormData['branchCodesCorrect']) {
  if (value === 'yes') {
    return 'Ja, branchekoden er korrekt'
  }

  if (value === 'no') {
    return 'Nej, branchekoden skal kontrolleres'
  }

  return undefined
}

export default function WizardSummary({
  formData,
  selectedCompany,
}: WizardSummaryProps) {
  const primaryBranch = selectedCompany?.branchCodes[0]
  const branchConfirmation = getBranchConfirmation(
    formData.branchCodesCorrect,
  )
  const summaryItems = [
    selectedCompany && {
      label: 'Virksomhedens navn',
      value: `${selectedCompany.label} (CVR: ${selectedCompany.id})`,
    },
    primaryBranch && {
      label: 'Primær branche',
      value: `${primaryBranch.code} - ${primaryBranch.title}`,
    },
    formData.contactName && {
      label: 'Kontaktperson',
      value: formData.contactName,
    },
    formData.contactJobTitle && {
      label: 'Stillingsbetegnelse',
      value: formData.contactJobTitle,
    },
    formData.contactEmail && {
      label: 'Email',
      value: formData.contactEmail,
    },
    formData.contactPhone && {
      label: 'Telefonnummer',
      value: formData.contactPhone,
    },
    formData.website && {
      label: 'Hjemmeside',
      value: formData.website,
    },
    branchConfirmation && {
      label: 'Branchekode',
      value: branchConfirmation,
    },
  ].filter((item): item is SummaryItem => Boolean(item))

  return (
    <section className={styles.summary} aria-labelledby="wizard-summary-title">
      <header className={styles.summaryHeader}>
        <h2 id="wizard-summary-title">Opsummering af dine valg</h2>
      </header>

      {summaryItems.length > 0 ? (
        <dl className={styles.summaryDetails}>
          {summaryItems.map((item) => (
            <div key={item.label}>
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className={styles.summaryValueMuted}>
          Dine oplysninger vises her, efterhånden som du udfylder formularen.
        </p>
      )}

      <div className={styles.summaryTotal}>
        <span>Estimeret pris</span>
        <strong>Afventer oplysninger</strong>
        <small>pr. medarbejder / md.</small>
      </div>
    </section>
  )
}
