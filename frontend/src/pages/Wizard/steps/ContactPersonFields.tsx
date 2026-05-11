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
  namePrefix?: string
  invalidField?: string
  validationMessage?: string
}

export default function ContactPersonFields({
  value,
  onChange,
  isRequired,
  namePrefix,
  invalidField,
  validationMessage,
}: ContactPersonFieldsProps) {
  function update(field: keyof ContactPerson, fieldValue: string) {
    onChange({ ...value, [field]: fieldValue })
  }

  function fieldName(field: keyof ContactPerson) {
    return namePrefix ? `${namePrefix}.${field}` : field
  }

  function fieldError(field: keyof ContactPerson) {
    return invalidField === fieldName(field) ? validationMessage : undefined
  }

  return (
    <div className={styles.fieldGrid}>
      <InputField
        name={fieldName('name')}
        label="Fulde navn"
        autoComplete="name"
        placeholder="Indtast navn"
        value={value.name}
        onChange={(v) => update('name', v)}
        isRequired={isRequired}
        isInvalid={Boolean(fieldError('name'))}
        errorMessage={fieldError('name')}
      />
      <InputField
        name={fieldName('title')}
        label="Stillingsbetegnelse"
        autoComplete="organization-title"
        placeholder="Fx Administrerende direktør"
        value={value.title}
        onChange={(v) => update('title', v)}
      />
      <InputField
        name={fieldName('email')}
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="Indtast email"
        value={value.email}
        onChange={(v) => update('email', v)}
        isRequired={isRequired}
        isInvalid={Boolean(fieldError('email'))}
        errorMessage={fieldError('email')}
      />
      <InputField
        name={fieldName('phone')}
        label="Telefonnummer"
        type="tel"
        autoComplete="tel"
        placeholder="Indtast telefonnummer"
        value={value.phone}
        onChange={(v) => update('phone', v)}
        isInvalid={Boolean(fieldError('phone'))}
        errorMessage={fieldError('phone')}
      />
    </div>
  )
}
