import Checkbox from '../../../components/Checkbox/Checkbox'
import ContentBox from '../../../components/ContentBox'
import TextAreaField from '../../../components/TextAreaField/TextAreaField'
import { SERVICE_LABELS } from '../wizard.constants'
import styles from '../WizardPage.module.scss'

const SERVICE_OPTIONS = Object.entries(SERVICE_LABELS).map(([value, label]) => ({ value, label }))

type NeedsStepProps = {
  selectedServices: string[]
  onServicesChange: (services: string[]) => void
  andetBeskrivelse: string
  onAndetChange: (value: string) => void
  invalidField?: string
  validationMessage?: string
}

export default function NeedsStep({
  selectedServices,
  onServicesChange,
  andetBeskrivelse,
  onAndetChange,
  invalidField,
  validationMessage,
}: NeedsStepProps) {
  function toggleService(value: string, checked: boolean) {
    if (checked) {
      onServicesChange([...selectedServices, value])
    } else {
      onServicesChange(selectedServices.filter((s) => s !== value))
    }
  }

  return (
    <>
      <ContentBox
        title="Ønsker og behov"
        description="Vælg hvilke services og ydelser I ønsker som DI-medlem. Jeres valg er med til at bestemme jeres endelige medlemskabstype."
      >
        <div
          className={`${styles.checkboxList} ${invalidField === 'selectedServices' ? styles.invalidGroup : ''}`}
          data-validation-field="selectedServices"
        >
          {SERVICE_OPTIONS.map((option) => (
            <Checkbox
              key={option.value}
              isSelected={selectedServices.includes(option.value)}
              onChange={(checked) => toggleService(option.value, checked)}
            >
              {option.label}
            </Checkbox>
          ))}
        </div>
        {invalidField === 'selectedServices' ? (
          <p className={styles.fieldError}>{validationMessage}</p>
        ) : null}
      </ContentBox>

      {selectedServices.includes('andet') ? (
        <ContentBox
          title="Beskriv venligst"
          description="Skriv kort hvad I har brug for, hvis de faste valgmuligheder ikke dækker behovet."
        >
          <TextAreaField
            label="Hvad har I brug for?"
            placeholder="Beskriv jeres behov"
            value={andetBeskrivelse}
            onChange={onAndetChange}
            rows={4}
            name="andetBeskrivelse"
            isInvalid={invalidField === 'andetBeskrivelse'}
            errorMessage={invalidField === 'andetBeskrivelse' ? validationMessage : undefined}
          />
        </ContentBox>
      ) : null}
    </>
  )
}
