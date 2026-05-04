import { useEffect, useState } from 'react'
import { lookupByName, lookupByVat } from '../../api/cvr'
import InputField from '../../components/InputField/InputField'
import type { CompanyOption, CvrResult } from './wizard.types'
import styles from './CvrSearchField.module.scss'

type CvrSearchFieldProps = {
  onCompanySelect: (company: CompanyOption) => void
}

function mapCvrResultToCompanyOption(company: CvrResult): CompanyOption {
  return {
    id: String(company.cvr),
    label: company.navn,
    companyType: company.virksomhedsform,
    address: company.adresse,
    postalCodeAndCity: `${company.postnummer} ${company.by}`,
    branchCodes: company.branchekode
      ? [{ code: String(company.branchekode), title: company.branchetekst }]
      : [],
  }
}

export default function CvrSearchField({
  onCompanySelect,
}: CvrSearchFieldProps) {
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
    onCompanySelect(mapCvrResultToCompanyOption(company))
  }

  return (
    <div className={styles.cvrSearchField}>
      <InputField
        name="company"
        label={
          isLoading ? 'CVR / Virksomhedsnavn (søger...)' : 'CVR / Virksomhedsnavn'
        }
        placeholder="Fx 16077593 eller Novo Nordisk"
        value={query}
        onChange={setQuery}
        isRequired
      />
      {isOpen && result ? (
        <ul className={styles.cvrSearchField__dropdown}>
          <li
            className={styles.cvrSearchField__dropdownItem}
            onClick={() => handleSelect(result)}
          >
            <span className={styles.cvrSearchField__dropdownName}>
              {result.navn}
            </span>
            <span className={styles.cvrSearchField__dropdownMeta}>
              CVR: {result.cvr} - {result.postnummer} {result.by}
            </span>
          </li>
        </ul>
      ) : null}
      {error ? <p className={styles.cvrSearchField__error}>{error}</p> : null}
    </div>
  )
}
