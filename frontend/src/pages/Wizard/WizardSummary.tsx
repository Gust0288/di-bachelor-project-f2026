import { emptyValue } from './wizard.constants'
import type { CompanyOption, WizardFormData } from './wizard.types'
import styles from './WizardPage.module.scss'

type WizardSummaryProps = {
  formData: WizardFormData
  selectedCompany?: CompanyOption
}

export default function WizardSummary({
  formData,
  selectedCompany,
}: WizardSummaryProps) {
  const primaryBranch = selectedCompany?.branchCodes[0]
  const summaryItems = [
    {
      label: 'Virksomhedens navn',
      value: selectedCompany
        ? `${selectedCompany.label} (CVR: ${selectedCompany.id})`
        : emptyValue,
      isEmpty: !selectedCompany,
    },
    {
      label: 'Primær branche',
      value: primaryBranch
        ? `${primaryBranch.code} - ${primaryBranch.title}`
        : emptyValue,
      isEmpty: !primaryBranch,
    },
    {
      label: 'Kontaktperson',
      value: formData.contactName || emptyValue,
      isEmpty: !formData.contactName,
    },
    { label: 'Medlemstype', value: emptyValue, isEmpty: true },
    { label: 'Antal ansatte', value: emptyValue, isEmpty: true },
    { label: 'Samlet lønsum', value: emptyValue, isEmpty: true },
    {
      label: 'Estimeret pris - DI-medlemskab',
      value: emptyValue,
      isEmpty: true,
    },
    {
      label: 'Foreninger og branchefællesskaber',
      value: emptyValue,
      isEmpty: true,
    },
  ]

  return (
    <section className={styles.summary} aria-labelledby="wizard-summary-title">
      <header className={styles.summaryHeader}>
        <h2 id="wizard-summary-title">Opsummering af dine valg</h2>
      </header>

      <dl className={styles.summaryDetails}>
        {summaryItems.map((item) => (
          <div key={item.label}>
            <dt>{item.label}</dt>
            <dd className={item.isEmpty ? styles.summaryValueMuted : undefined}>
              {item.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className={styles.summaryTotal}>
        <span>Estimeret pris</span>
        <strong>Afventer oplysninger</strong>
        <small>pr. medarbejder / md.</small>
      </div>
    </section>
  )
}
