import ContentBox from '../../../components/ContentBox'
import InputField from '../../../components/InputField/InputField'
import SelectField from '../../../components/SelectField/SelectField'
import type {
  CompanyOption,
  WizardFieldUpdater,
  WizardFormData,
} from '../wizard.types'
import styles from '../WizardPage.module.scss'

type CompanyInformationStepProps = {
  companyOptions: CompanyOption[]
  formData: WizardFormData
  onFieldChange: WizardFieldUpdater
}

export default function CompanyInformationStep({
  companyOptions,
  formData,
  onFieldChange,
}: CompanyInformationStepProps) {
  return (
    <>
      <ContentBox
        title="Kontaktperson"
        description="Kontaktpersonen er typisk den person, der melder virksomheden ind."
      >
        <div className={styles.fieldGrid}>
          <InputField
            name="contactName"
            label="Navn"
            autoComplete="name"
            placeholder="Indtast navn"
            value={formData.contactName}
            onChange={(value) => onFieldChange('contactName', value)}
            isRequired
          />
          <InputField
            name="contactJobTitle"
            label="Stillingsbetegnelse"
            autoComplete="organization-title"
            placeholder="Indtast stillingsbetegnelse"
            value={formData.contactJobTitle}
            onChange={(value) => onFieldChange('contactJobTitle', value)}
            isRequired
          />
          <InputField
            name="contactEmail"
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="Indtast email"
            value={formData.contactEmail}
            onChange={(value) => onFieldChange('contactEmail', value)}
            isRequired
          />
          <InputField
            name="contactPhone"
            label="Telefonnummer"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="Indtast telefonnummer"
            value={formData.contactPhone}
            onChange={(value) => onFieldChange('contactPhone', value)}
            isRequired
          />
        </div>
      </ContentBox>

      <ContentBox
        title="Virksomhed"
        description="Søg på CVR-nummer eller virksomhedsnavn og vælg den korrekte virksomhed."
      >
        <SelectField
          name="company"
          label="CVR / Virksomhedsnavn"
          options={companyOptions}
          selectedKey={formData.companyId || null}
          onSelectionChange={(key) =>
            onFieldChange('companyId', String(key ?? ''))
          }
          isRequired
        />
      </ContentBox>

      <ContentBox
        title="Virksomhedens hjemmeside"
        description="Udfyld kun feltet, hvis virksomheden har en hjemmeside."
      >
        <InputField
          name="website"
          label="URL"
          type="url"
          inputMode="url"
          autoComplete="url"
          placeholder="https://www.eksempel.dk"
          value={formData.website}
          onChange={(value) => onFieldChange('website', value)}
        />
      </ContentBox>
    </>
  )
}
