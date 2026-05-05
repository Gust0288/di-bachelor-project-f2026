import InputField from '../../../components/InputField/InputField'
import styles from '../WizardPage.module.scss'

export type ContactPerson = {
  name: string
  email: string
  phone: string
  title: string
}

type ContactPersonFieldsProps = {
  value: ContactPerson
  onChange: (value: ContactPerson) => void
  isRequired?: boolean
}

export default function ContactPersonFields({
  value,
  onChange,
  isRequired,
}: ContactPersonFieldsProps) {
  function update(field: keyof ContactPerson, fieldValue: string) {
    onChange({ ...value, [field]: fieldValue })
  }

  return (
    <div className={styles.fieldGrid}>
      <InputField
        name="name"
        label="Fulde navn"
        autoComplete="name"
        placeholder="Indtast navn"
        value={value.name}
        onChange={(v) => update('name', v)}
        isRequired={isRequired}
      />
      <InputField
        name="title"
        label="Stillingsbetegnelse"
        autoComplete="organization-title"
        placeholder="Fx Administrerende direktør"
        value={value.title}
        onChange={(v) => update('title', v)}
      />
      <InputField
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="Indtast email"
        value={value.email}
        onChange={(v) => update('email', v)}
        isRequired={isRequired}
      />
      <InputField
        name="phone"
        label="Telefonnummer"
        type="tel"
        autoComplete="tel"
        placeholder="Indtast telefonnummer"
        value={value.phone}
        onChange={(v) => update('phone', v)}
      />
    </div>
  )
}
