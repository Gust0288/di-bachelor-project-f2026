import { useMemo, useState } from 'react'
import Button from '../../components/Button/Button'
import ContentBox from '../../components/ContentBox'
import { Form } from '../../components/Form/Form'
import InputField from '../../components/InputField/InputField'
import SelectField from '../../components/SelectField/SelectField'
import WizardStepsNavigation, {
  type WizardStep,
} from '../../components/WizardStepsNavigation/WizardStepsNavigation'
import WizardLayout from '../../layouts/WizardLayout/WizardLayout'
import styles from './WizardPage.module.scss'

const wizardSteps: WizardStep[] = [
  { label: 'Virksomhedsinformation', status: 'current' },
  { label: 'Branche', status: 'upcoming' },
  { label: 'Medarbejdere', status: 'upcoming' },
  { label: 'Lokationer', status: 'upcoming' },
  { label: 'Overenskomst', status: 'upcoming' },
  { label: 'Ydelser', status: 'upcoming' },
  { label: 'Betaling', status: 'upcoming' },
  { label: 'Gennemse', status: 'upcoming' },
  { label: 'Kvittering', status: 'upcoming' },
]

const companyOptions = [
  {
    id: '12345678',
    label: 'Eksempel Produktion A/S',
    description: 'CVR 12345678 - København',
  },
  {
    id: '87654321',
    label: 'Eksempel Service ApS',
    description: 'CVR 87654321 - Aarhus',
  },
  {
    id: '11223344',
    label: 'Eksempel Holding ApS',
    description: 'CVR 11223344 - Odense',
  },
]

type WizardFormData = {
  contactName: string
  contactJobTitle: string
  contactEmail: string
  contactPhone: string
  companyId: string
  website: string
}

const initialFormData: WizardFormData = {
  contactName: '',
  contactJobTitle: '',
  contactEmail: '',
  contactPhone: '',
  companyId: '',
  website: '',
}

const emptyValue = 'Ikke udfyldt'

export default function WizardPage() {
  const [formData, setFormData] = useState(initialFormData)

  const selectedCompany = useMemo(
    () => companyOptions.find((option) => option.id === formData.companyId),
    [formData.companyId],
  )

  function updateField<Key extends keyof WizardFormData>(
    key: Key,
    value: WizardFormData[Key],
  ) {
    setFormData((current) => ({
      ...current,
      [key]: value,
    }))
  }

  return (
    <WizardLayout
      progressIndicator={
        <WizardStepsNavigation
          steps={wizardSteps}
          orientation="vertical"
          ariaLabel="Indmeldelsesflow"
        />
      }
      summary={
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
              <dd>{emptyValue}</dd>
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
      }
    >
      <Form className={styles.form}>
        <header className={styles.header}>
          <h1>Indmeldelse i Dansk Industri</h1>
          <p>
            Tak for din interesse i et DI-medlemskab. For at kunne tilbyde det
            rette medlemskab skal vi bruge en række oplysninger om virksomheden.
          </p>
        </header>

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
              onChange={(value) => updateField('contactName', value)}
              isRequired
            />
            <InputField
              name="contactJobTitle"
              label="Stillingsbetegnelse"
              autoComplete="organization-title"
              placeholder="Indtast stillingsbetegnelse"
              value={formData.contactJobTitle}
              onChange={(value) => updateField('contactJobTitle', value)}
              isRequired
            />
            <InputField
              name="contactEmail"
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="Indtast email"
              value={formData.contactEmail}
              onChange={(value) => updateField('contactEmail', value)}
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
              onChange={(value) => updateField('contactPhone', value)}
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
            description="Dropdownen kan senere kobles på CVR-søgning, så forslagene hentes dynamisk."
            options={companyOptions}
            selectedKey={formData.companyId || null}
            onSelectionChange={(key) => updateField('companyId', String(key ?? ''))}
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
            onChange={(value) => updateField('website', value)}
          />
        </ContentBox>

        <footer className={styles.actions}>
          <Button type="submit">Fortsæt</Button>
        </footer>
      </Form>
    </WizardLayout>
  )
}
