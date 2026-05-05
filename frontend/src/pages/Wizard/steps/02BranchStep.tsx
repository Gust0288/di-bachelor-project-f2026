import Checkbox from '../../../components/Checkbox/Checkbox'
import ContentBox from '../../../components/ContentBox'
import type { CvrHiddenFields } from '../types'
import { emptyValue } from '../wizard.constants'
import styles from '../WizardPage.module.scss'

type BranchStepProps = {
  cvrData: CvrHiddenFields | null
  cvrConfirmed: boolean
  onCvrConfirmedChange: (value: boolean) => void
}

export default function BranchStep({
  cvrData,
  cvrConfirmed,
  onCvrConfirmedChange,
}: BranchStepProps) {
  const postalCodeAndCity =
    cvrData && cvrData.zip_code
      ? `${cvrData.zip_code} ${cvrData.city}`.trim()
      : null

  const branchLabel =
    cvrData?.industry_code
      ? `${cvrData.industry_code}${cvrData.industry_description ? ` - ${cvrData.industry_description}` : ''}`
      : null

  return (
    <>
      <ContentBox
        title="Oplysninger hentet fra CVR"
        description="Hvis oplysningerne ikke er korrekte, skal de ændres på virk.dk."
      >
        <dl className={styles.companyDetails}>
          <div>
            <dt>Navn</dt>
            <dd>{cvrData?.company_name ?? emptyValue}</dd>
          </div>
          <div>
            <dt>CVR-nr.</dt>
            <dd>{cvrData?.cvr_number ?? emptyValue}</dd>
          </div>
          <div>
            <dt>Virksomhedsform</dt>
            <dd>{cvrData?.company_type || emptyValue}</dd>
          </div>
          <div>
            <dt>Adresse</dt>
            <dd>{cvrData?.address || emptyValue}</dd>
          </div>
          <div>
            <dt>Postnummer og by</dt>
            <dd>{postalCodeAndCity || emptyValue}</dd>
          </div>
          <div>
            <dt>Branchekode</dt>
            <dd>{branchLabel || emptyValue}</dd>
          </div>
        </dl>

        <Checkbox
          isSelected={cvrConfirmed}
          onChange={onCvrConfirmedChange}
          isRequired
        >
          Jeg bekræfter at ovenstående virksomhedsoplysninger er korrekte
        </Checkbox>
      </ContentBox>
    </>
  )
}
