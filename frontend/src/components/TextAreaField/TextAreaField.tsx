import type { ReactNode } from 'react'
import {
  TextArea,
  TextField,
  type TextAreaProps,
  type TextFieldProps,
} from 'react-aria-components'
import { Description, FieldError, Label } from '../Form/Form'
import styles from './TextAreaField.module.scss'

type Props = Omit<TextFieldProps, 'children'> &
  Pick<TextAreaProps, 'placeholder' | 'rows'> & {
    label: string
    description?: string
    errorMessage?: ReactNode
    className?: string
  }

function TextAreaField({
  label,
  description,
  errorMessage,
  className,
  placeholder,
  rows = 4,
  ...props
}: Props) {
  return (
    <TextField
      {...props}
      className={[styles.textAreaField, className].filter(Boolean).join(' ')}
    >
      <Label>{label}</Label>
      <TextArea
        className={styles.textAreaField__input}
        placeholder={placeholder}
        rows={rows}
      />
      {description ? <Description>{description}</Description> : null}
      <FieldError>{errorMessage}</FieldError>
    </TextField>
  )
}

export default TextAreaField
