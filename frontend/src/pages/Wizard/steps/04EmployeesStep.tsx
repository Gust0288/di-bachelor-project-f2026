import Checkbox from '../../../components/Checkbox/Checkbox'
import ContentBox from '../../../components/ContentBox'
import InputField from '../../../components/InputField/InputField'
import styles from '../WizardPage.module.scss'

const EMPLOYEE_TYPE_OPTIONS = [
  { value: 'funktionaer', label: 'Funktionær (funktionærkontrakt)' },
  { value: 'timeloennet', label: 'Timelønnet' },
  { value: 'timeloennet_funktionaer_lignende', label: 'Timelønnet ansat på funktionærlignende kontrakt' },
  { value: 'vikar', label: 'Vikar' },
  { value: 'byggeri_og_anlaeg', label: 'Medarbejdere inden for byggeri og anlæg' },
  { value: 'mandskabsudlejning', label: 'Mandskabsudlejning' },
  { value: 'ved_ikke', label: 'Ved ikke' },
] as const

type EmployeesStepProps = {
  employeeCount: number | ''
  onEmployeeCountChange: (value: number | '') => void
  noEmployees: boolean
  onNoEmployeesChange: (value: boolean) => void
  employeeTypes: string[]
  onEmployeeTypesChange: (types: string[]) => void
  totalLoensum: number | ''
  onTotalLoensumChange: (value: number | '') => void
}

export default function EmployeesStep({
  employeeCount,
  onEmployeeCountChange,
  noEmployees,
  onNoEmployeesChange,
  employeeTypes,
  onEmployeeTypesChange,
  totalLoensum,
  onTotalLoensumChange,
}: EmployeesStepProps) {
  function toggleType(value: string, checked: boolean) {
    if (checked) {
      onEmployeeTypesChange([...employeeTypes, value])
    } else {
      onEmployeeTypesChange(employeeTypes.filter((t) => t !== value))
    }
  }

  function handleNoEmployeesChange(checked: boolean) {
    onNoEmployeesChange(checked)
    if (checked) onEmployeeCountChange(0)
  }

  function handleCountChange(raw: string) {
    const n = parseInt(raw, 10)
    onEmployeeCountChange(isNaN(n) ? '' : n)
  }

  function handleLoensumChange(raw: string) {
    const n = parseInt(raw, 10)
    onTotalLoensumChange(isNaN(n) ? '' : n)
  }

  return (
    <>
      <ContentBox
        title="Antal ansatte"
        description="0–9 ansatte = Mikro · 10–49 = SMV · 50+ = Erhverv"
      >
        <InputField
          name="employeeCount"
          label="Antal ansatte"
          type="number"
          inputMode="numeric"
          value={noEmployees ? '0' : String(employeeCount)}
          onChange={handleCountChange}
          isDisabled={noEmployees}
          isRequired
        />
        <Checkbox isSelected={noEmployees} onChange={handleNoEmployeesChange}>
          Virksomheden har ingen ansatte (0 ansatte)
        </Checkbox>
      </ContentBox>

      <ContentBox title="Medarbejdertyper" description="Hvilke typer medarbejdere har virksomheden?">
        <div className={styles.checkboxList}>
          {EMPLOYEE_TYPE_OPTIONS.map((option) => (
            <Checkbox
              key={option.value}
              isSelected={employeeTypes.includes(option.value)}
              onChange={(checked) => toggleType(option.value, checked)}
            >
              {option.label}
            </Checkbox>
          ))}
        </div>
      </ContentBox>

      <ContentBox
        title="Samlet lønsum"
        description="Den samlede lønudgift bruges til at beregne jeres kontingent."
      >
        <InputField
          name="totalLoensum"
          label="Samlet lønsum (kr.) – seneste regnskabsår"
          type="number"
          inputMode="numeric"
          value={String(totalLoensum)}
          onChange={handleLoensumChange}
          isRequired
        />
      </ContentBox>
    </>
  )
}
