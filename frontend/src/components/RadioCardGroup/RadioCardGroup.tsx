import type { ReactNode } from 'react'
import {
  Radio,
  RadioGroup,
  type RadioGroupProps,
} from 'react-aria-components'
import { Description, FieldError, Label } from '../Form/Form'
import styles from './RadioCardGroup.module.scss'

type Option = {
  value: string
  title: string
  description?: string
}

type Props = Omit<RadioGroupProps, 'children'> & {
  label: ReactNode
  description?: string
  options: Option[]
}

function RadioCardGroup({
  label,
  description,
  options,
  className,
  ...props
}: Props) {
  return (
    <RadioGroup
      {...props}
      className={[styles.radioCardGroup, className].filter(Boolean).join(' ')}
    >
      <div className={styles.radioCardGroup__header}>
        <Label>{label}</Label>
        {description ? <Description>{description}</Description> : null}
      </div>

      <div className={styles.radioCardGroup__options}>
        {options.map((option) => (
          <Radio
            key={option.value}
            value={option.value}
            className={styles.radioCardGroup__option}
          >
            <span className={styles.radioCardGroup__control} aria-hidden="true" />
            <span className={styles.radioCardGroup__copy}>
              <strong>{option.title}</strong>
              {option.description ? <span>{option.description}</span> : null}
            </span>
          </Radio>
        ))}
      </div>

      <FieldError />
    </RadioGroup>
  )
}

export default RadioCardGroup
