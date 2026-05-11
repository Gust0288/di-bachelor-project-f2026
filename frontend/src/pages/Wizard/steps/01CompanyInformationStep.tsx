import ContentBox from '../../../components/ContentBox'
import InputField from '../../../components/InputField/InputField'
import CvrSearchField from '../CvrSearchField'
import styles from '../WizardPage.module.scss'
import type {
  CompanyOption,
  WizardFieldUpdater,
  WizardFormData,
} from '../wizard.types'
import type { CvrHiddenFields } from '../types'

type CompanyInformationStepProps = {
  formData: WizardFormData
  onFieldChange: WizardFieldUpdater
  onCompanyFound: (company: CompanyOption) => void
  onCvrDataChange: (fields: CvrHiddenFields) => void
  cvrQuery: string
  onCvrQueryChange: (query: string) => void
  invalidField?: string
  validationMessage?: string
}

export default function CompanyInformationStep({
  formData,
  onFieldChange,
  onCompanyFound,
  onCvrDataChange,
  cvrQuery,
  onCvrQueryChange,
  invalidField,
  validationMessage,
}: CompanyInformationStepProps) {
  function fieldError(field: string) {
    return invalidField === field ? validationMessage : undefined
  }

  function handleCompanySelect(company: CompanyOption) {
    onFieldChange('companyId', company.id)
    onCompanyFound(company)

    const firstBranch = company.branchCodes[0]
    const postalParts = company.postalCodeAndCity?.split(' ') ?? []
    onCvrDataChange({
      cvr_number: company.id,
      company_name: company.label,
      company_type: company.companyType ?? '',
      address: company.address ?? '',
      zip_code: postalParts[0] ?? '',
      city: postalParts.slice(1).join(' '),
      industry_code: firstBranch?.code ?? '',
      industry_description: firstBranch?.title ?? '',
    })
  }

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
            isInvalid={Boolean(fieldError('contactName'))}
            errorMessage={fieldError('contactName')}
          />
          <InputField
            name="contactJobTitle"
            label="Stillingsbetegnelse"
            autoComplete="organization-title"
            placeholder="Indtast stillingsbetegnelse"
            value={formData.contactJobTitle}
            onChange={(value) => onFieldChange('contactJobTitle', value)}
            isRequired
            isInvalid={Boolean(fieldError('contactJobTitle'))}
            errorMessage={fieldError('contactJobTitle')}
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
            isInvalid={Boolean(fieldError('contactEmail'))}
            errorMessage={fieldError('contactEmail')}
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
            isInvalid={Boolean(fieldError('contactPhone'))}
            errorMessage={fieldError('contactPhone')}
          />
        </div>
      </ContentBox>

      <ContentBox
        title="Virksomhed"
        description="Søg på CVR-nummer eller virksomhedsnavn og vælg den korrekte virksomhed."
      >
        <CvrSearchField
          onCompanySelect={handleCompanySelect}
          initialQuery={cvrQuery}
          onQueryChange={onCvrQueryChange}
          isInvalid={invalidField === 'company'}
          errorMessage={fieldError('company')}
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
          isInvalid={Boolean(fieldError('website'))}
          errorMessage={fieldError('website')}
        />
      </ContentBox>
    </>
  )
}
