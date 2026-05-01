import ContentBox from '../../../components/ContentBox'
import RadioCardGroup from '../../../components/RadioCardGroup/RadioCardGroup'
import { emptyValue } from '../wizard.constants'
import type {
  CompanyOption,
  WizardFieldUpdater,
  WizardFormData,
} from '../wizard.types'
import styles from '../WizardPage.module.scss'

type BranchStepProps = {
  formData: WizardFormData
  selectedCompany?: CompanyOption
  onFieldChange: WizardFieldUpdater
}

export default function BranchStep({
  formData,
  selectedCompany,
  onFieldChange,
}: BranchStepProps) {
  return (
    <>
      <ContentBox
        title="Oplysninger hentet fra CVR"
        description="Hvis oplysningerne ikke er korrekte, skal de ændres på virk.dk."
      >
        <dl className={styles.companyDetails}>
          <div>
            <dt>Navn</dt>
            <dd>{selectedCompany?.label ?? emptyValue}</dd>
          </div>
          <div>
            <dt>CVR-nr.</dt>
            <dd>{selectedCompany?.id ?? emptyValue}</dd>
          </div>
          <div>
            <dt>Virksomhedsform</dt>
            <dd>{selectedCompany?.companyType ?? emptyValue}</dd>
          </div>
          <div>
            <dt>Adresse</dt>
            <dd>{selectedCompany?.address ?? emptyValue}</dd>
          </div>
          <div>
            <dt>Postnummer og by</dt>
            <dd>{selectedCompany?.postalCodeAndCity ?? emptyValue}</dd>
          </div>
          <div>
            <dt>Startdato</dt>
            <dd>{selectedCompany?.startDate ?? emptyValue}</dd>
          </div>
          <div>
            <dt>Branchekode</dt>
            <dd>
              {selectedCompany?.branchCodes
                .map((branch) => `${branch.code} - ${branch.title}`)
                .join(', ') ?? emptyValue}
            </dd>
          </div>
          <div className={styles.companyDetails__wide}>
            <dt>Formål</dt>
            <dd>{selectedCompany?.purpose ?? emptyValue}</dd>
          </div>
        </dl>
      </ContentBox>

      <ContentBox title="Din virksomheds brancher">
        <div className={styles.branchList}>
          {selectedCompany?.branchCodes.map((branch) => (
            <article key={branch.code} className={styles.branchItem}>
              <strong>{branch.code}</strong>
              <span>{branch.title}</span>
            </article>
          )) ?? <p>{emptyValue}</p>}
        </div>

        <RadioCardGroup
          label="Er det korrekt branchekode/r?"
          options={[
            {
              value: 'yes',
              title: 'Ja',
              description: 'Branchekoden passer til virksomheden.',
            },
            {
              value: 'no',
              title: 'Nej',
              description: 'Branchekoden skal kontrolleres på virk.dk.',
            },
          ]}
          value={formData.branchCodesCorrect}
          onChange={(value) => onFieldChange('branchCodesCorrect', value)}
          isRequired
        />
      </ContentBox>
    </>
  )
}
