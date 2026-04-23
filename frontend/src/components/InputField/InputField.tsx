import type { ReactNode } from 'react'
import {
  Input,
  TextField,
  type InputProps,
  type TextFieldProps,
} from 'react-aria-components'
import { Description, FieldError, Label } from '../Form/Form'
import styles from './InputField.module.scss'

type Props = Omit<TextFieldProps, 'children'> &
  Pick<InputProps, 'placeholder' | 'type' | 'inputMode' | 'autoComplete'> & {
    label: ReactNode
    description?: string
    className?: string
    inputClassName?: string
  }

function InputField({
  label,
  description,
  className,
  inputClassName,
  placeholder,
  type,
  inputMode,
  autoComplete,
  ...props
}: Props) {
  const fieldClasses = [styles.inputField, className].filter(Boolean).join(' ')
  const inputClasses = [styles['inputField__input'], inputClassName]
    .filter(Boolean)
    .join(' ')

  return (
    <TextField {...props} className={fieldClasses}>
      <Label>{label}</Label>

      <Input
        className={inputClasses}
        placeholder={placeholder}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
      />

      {description ? <Description>{description}</Description> : null}
      <FieldError />
    </TextField>
  )
}

export default InputField
