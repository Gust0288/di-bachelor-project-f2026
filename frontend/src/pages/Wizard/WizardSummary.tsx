import ContentBox from '../../components/ContentBox'
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

  return (
    <ContentBox className={styles.summary} title="Opsummering af dine valg">
      <dl className={styles.summaryDetails}>
        <div>
          <dt>Virksomhedens navn</dt>
          <dd>
            {selectedCompany
              ? `${selectedCompany.label} (CVR: ${selectedCompany.id})`
              : emptyValue}
          </dd>
        </div>
        <div>
          <dt>Primær branche</dt>
          <dd>
            {primaryBranch
              ? `${primaryBranch.code} - ${primaryBranch.title}`
              : emptyValue}
          </dd>
        </div>
        <div>
          <dt>Kontaktperson</dt>
          <dd>{formData.contactName || emptyValue}</dd>
        </div>
        <div>
          <dt>Medlemstype</dt>
          <dd>{emptyValue}</dd>
        </div>
        <div>
          <dt>Antal ansatte</dt>
          <dd>{emptyValue}</dd>
        </div>
        <div>
          <dt>Samlet lønsum</dt>
          <dd>{emptyValue}</dd>
        </div>
        <div>
          <dt>Estimeret pris - DI-medlemskab</dt>
          <dd>{emptyValue}</dd>
        </div>
        <div>
          <dt>Foreninger og branchefællesskaber</dt>
          <dd>{emptyValue}</dd>
        </div>
      </dl>

      <div className={styles.summaryTotal}>
        <span>Estimeret pris</span>
        <strong>Afventer oplysninger</strong>
        <small>pr. medarbejder / md.</small>
      </div>
    </ContentBox>
  )
}
