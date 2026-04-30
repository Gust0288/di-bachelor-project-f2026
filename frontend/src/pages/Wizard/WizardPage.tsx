import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'
import Button from '../../components/Button/Button'
import ContentBox from '../../components/ContentBox'
import { Form } from '../../components/Form/Form'
import InputField from '../../components/InputField/InputField'
import RadioCardGroup from '../../components/RadioCardGroup/RadioCardGroup'
import SelectField from '../../components/SelectField/SelectField'
import WizardStepsNavigation, {
  type WizardStep,
} from '../../components/WizardStepsNavigation/WizardStepsNavigation'
import WizardLayout from '../../layouts/WizardLayout/WizardLayout'
import styles from './WizardPage.module.scss'

const wizardStepLabels = [
  'Virksomhedsinformation',
  'Branche',
  'Medarbejdere',
  'Lokationer',
  'Overenskomst',
  'Ydelser',
  'Betaling',
  'Gennemse',
  'Kvittering',
]

const companyOptions = [
  {
    id: '12345678',
    label: 'Eksempel Produktion A/S',
    description: 'CVR 12345678 - København',
    companyType: 'Aktieselskab',
    address: 'Industrivej 12',
    postalCodeAndCity: '2100 København Ø',
    startDate: '15. marts 2014',
    branchCodes: [
      {
        code: '256200',
        title: 'Maskinforarbejdning',
      },
    ],
    purpose:
      'Selskabets formål er at drive produktions- og industrivirksomhed samt dermed beslægtet virksomhed.',
  },
  {
    id: '87654321',
    label: 'Eksempel Service ApS',
    description: 'CVR 87654321 - Aarhus',
    companyType: 'Anpartsselskab',
    address: 'Servicegade 8',
    postalCodeAndCity: '8000 Aarhus C',
    startDate: '1. september 2019',
    branchCodes: [
      {
        code: '702200',
        title: 'Virksomhedsrådgivning og anden rådgivning om driftsledelse',
      },
    ],
    purpose:
      'Selskabets formål er at levere serviceydelser, rådgivning og anden hermed beslægtet virksomhed.',
  },
  {
    id: '11223344',
    label: 'Eksempel Holding ApS',
    description: 'CVR 11223344 - Odense',
    companyType: 'Anpartsselskab',
    address: 'Holding Allé 4',
    postalCodeAndCity: '5000 Odense C',
    startDate: '20. januar 2021',
    branchCodes: [
      {
        code: '642020',
        title: 'Ikke-finansielle holdingselskaber',
      },
    ],
    purpose:
      'Selskabets formål er at eje kapitalandele i andre selskaber samt dermed beslægtet virksomhed.',
  },
]

type WizardFormData = {
  contactName: string
  contactJobTitle: string
  contactEmail: string
  contactPhone: string
  companyId: string
  website: string
  branchCodesCorrect: string
}

const initialFormData: WizardFormData = {
  contactName: '',
  contactJobTitle: '',
  contactEmail: '',
  contactPhone: '',
  companyId: '',
  website: '',
  branchCodesCorrect: '',
}

const emptyValue = 'Ikke udfyldt'

export default function WizardPage() {
  const [formData, setFormData] = useState(initialFormData)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)

  const wizardSteps = useMemo<WizardStep[]>(
    () =>
      wizardStepLabels.map((label, index) => ({
        label,
        status:
          index < currentStepIndex
            ? 'complete'
            : index === currentStepIndex
              ? 'current'
              : 'upcoming',
      })),
    [currentStepIndex],
  )

  const selectedCompany = useMemo(
    () => companyOptions.find((option) => option.id === formData.companyId),
    [formData.companyId],
  )

  const primaryBranch = selectedCompany?.branchCodes[0]

  function updateField<Key extends keyof WizardFormData>(
    key: Key,
    value: WizardFormData[Key],
  ) {
    setFormData((current) => ({
      ...current,
      [key]: value,
    }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setCurrentStepIndex((stepIndex) => Math.min(stepIndex + 1, 1))
  }

  function handleBack() {
    setCurrentStepIndex((stepIndex) => Math.max(stepIndex - 1, 0))
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
      }
    >
      <Form className={styles.form} onSubmit={handleSubmit}>
        <header className={styles.header}>
          {currentStepIndex === 1 ? (
            <>
              <h1>Hvad laver din virksomhed?</h1>
              <p>
                Vi bruger virksomhedens brancheoplysninger fra CVR til at finde
                de relevante DI-fællesskaber og medlemsvilkår.
              </p>
            </>
          ) : (
            <>
              <h1>Indmeldelse i Dansk Industri</h1>
              <p>
                Tak for din interesse i et DI-medlemskab. For at kunne tilbyde
                det rette medlemskab skal vi bruge en række oplysninger om
                virksomheden.
              </p>
            </>
          )}
        </header>

        {currentStepIndex === 1 ? (
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
                onChange={(value) => updateField('branchCodesCorrect', value)}
                isRequired
              />
            </ContentBox>
          </>
        ) : (
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
                onSelectionChange={(key) =>
                  updateField('companyId', String(key ?? ''))
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
                onChange={(value) => updateField('website', value)}
              />
            </ContentBox>
          </>
        )}

        <footer className={styles.actions}>
          {currentStepIndex > 0 ? (
            <Button type="button" variant="outline" onPress={handleBack}>
              Tilbage
            </Button>
          ) : null}
          <Button type="submit">Fortsæt</Button>
        </footer>
      </Form>
    </WizardLayout>
  )
}
