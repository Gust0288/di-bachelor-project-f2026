import Checkbox from '../../../components/Checkbox/Checkbox'
import ContentBox from '../../../components/ContentBox'
import TextAreaField from '../../../components/TextAreaField/TextAreaField'
import styles from '../WizardPage.module.scss'

const SERVICE_OPTIONS = [
  { value: 'overenskomst', label: 'Overenskomst' },
  { value: 'personalejuridisk_raadgivning', label: 'Personalejuridisk rådgivning' },
  { value: 'erhvervsjuridisk_raadgivning', label: 'Erhvervsjuridisk rådgivning' },
  { value: 'byggegaranti', label: 'Byggegaranti' },
  { value: 'di_byggeri_sektion', label: 'Medlemskab af sektion i DI Byggeri' },
  { value: 'andet', label: 'Andet' },
] as const

type NeedsStepProps = {
  selectedServices: string[]
  onServicesChange: (services: string[]) => void
  andetBeskrivelse: string
  onAndetChange: (value: string) => void
}

export default function NeedsStep({
  selectedServices,
  onServicesChange,
  andetBeskrivelse,
  onAndetChange,
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
        <div className={styles.checkboxList}>
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
      </ContentBox>

      {selectedServices.includes('andet') ? (
        <ContentBox title="Beskriv venligst">
          <TextAreaField
            label="Hvad har I brug for?"
            placeholder="Beskriv jeres behov"
            value={andetBeskrivelse}
            onChange={onAndetChange}
            rows={4}
          />
        </ContentBox>
      ) : null}
    </>
  )
}
