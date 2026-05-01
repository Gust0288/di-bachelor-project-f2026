import { useEffect, useState } from 'react'
import { lookupByName, lookupByVat } from '../../../api/cvr'
import ContentBox from '../../../components/ContentBox'
import InputField from '../../../components/InputField/InputField'
import styles from '../WizardPage.module.scss'
import type {
  CompanyOption,
  CvrResult,
  WizardFieldUpdater,
  WizardFormData,
} from '../wizard.types'

type CompanyInformationStepProps = {
  formData: WizardFormData
  onFieldChange: WizardFieldUpdater
  onCompanyFound: (company: CompanyOption) => void
}

export default function CompanyInformationStep({
  formData,
  onFieldChange,
  onCompanyFound,
}: CompanyInformationStepProps) {
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<CvrResult | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const trimmed = query.trim()
    const isVat = /^\d+$/.test(trimmed)

    if (isVat && trimmed.length !== 8) {
      setResult(null)
      setIsOpen(false)
      setError(null)
      return
    }
    if (!isVat && trimmed.length < 3) {
      setResult(null)
      setIsOpen(false)
      setError(null)
      return
    }

    const delay = isVat ? 0 : 700
    const timer = setTimeout(async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data = isVat
          ? await lookupByVat(trimmed)
          : await lookupByName(trimmed)
        setResult(data)
        setIsOpen(true)
      } catch {
        setError('Virksomhed ikke fundet. Tjek CVR-nr eller navn.')
        setResult(null)
        setIsOpen(false)
      } finally {
        setIsLoading(false)
      }
    }, delay)

    return () => clearTimeout(timer)
  }, [query])

  function handleSelect(company: CvrResult) {
    setQuery(`${company.navn} (CVR: ${company.cvr})`)
    setIsOpen(false)
    onFieldChange('companyId', String(company.cvr))
    onCompanyFound({
      id: String(company.cvr),
      label: company.navn,
      companyType: company.virksomhedsform,
      address: company.adresse,
      postalCodeAndCity: `${company.postnummer} ${company.by}`,
      branchCodes: company.branchekode
        ? [{ code: String(company.branchekode), title: company.branchetekst }]
        : [],
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
        <div className={styles.cvrSearchWrapper}>
          <InputField
            name="company"
            label={isLoading ? 'CVR / Virksomhedsnavn (søger…)' : 'CVR / Virksomhedsnavn'}
            placeholder="Fx 16077593 eller Novo Nordisk"
            value={query}
            onChange={setQuery}
            isRequired
          />
          {isOpen && result && (
            <ul className={styles.cvrDropdown}>
              <li
                className={styles.cvrDropdownItem}
                onClick={() => handleSelect(result)}
              >
                <span className={styles.cvrDropdownName}>{result.navn}</span>
                <span className={styles.cvrDropdownMeta}>
                  CVR: {result.cvr} · {result.postnummer} {result.by}
                </span>
              </li>
            </ul>
          )}
          {error && <p className={styles.cvrError}>{error}</p>}
        </div>
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
