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

export default function WizardSummary({
  formData,
  selectedCompany,
}: WizardSummaryProps) {
  const primaryBranch = selectedCompany?.branchCodes[0]
  const summaryItems = [
    selectedCompany && {
      label: 'Virksomhedens navn',
      value: `${selectedCompany.label} (CVR: ${selectedCompany.id})`,
    },
    primaryBranch && {
      label: 'Primær branche',
      value: `${primaryBranch.code} ${primaryBranch.title}`,
    },
    formData.contactName && {
      label: 'Kontaktperson',
      value: formData.contactName,
    },
  ].filter((item): item is SummaryItem => Boolean(item))

  const priceRows: SummaryItem[] = []
  const estimatedPrice = undefined

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

      {priceRows.length > 0 ? (
        <dl className={styles.summaryPriceRows}>
          {priceRows.map((item) => (
            <div key={item.label}>
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      <div className={styles.summaryTotal}>
        <span>Estimeret pris</span>
        {estimatedPrice ? (
          <>
            <strong>{estimatedPrice}</strong>
            <small>pr. medarbejder / md.</small>
          </>
        ) : (
          <strong>Afventer oplysninger</strong>
        )}
      </div>
    </section>
  )
}
