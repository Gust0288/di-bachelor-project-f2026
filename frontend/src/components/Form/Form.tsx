import {
  Form as RACForm,
  Label as RACLabel,
  FieldError as RACFieldError,
  Text,
  Button as RACButton,
  type FormProps,
  type LabelProps,
  type FieldErrorProps,
  type ButtonProps,
  type TextProps,
} from 'react-aria-components'

import styles from './Form.module.scss'

export function Form({ className, ...props }: FormProps) {
  return (
    <RACForm
      {...props}
      className={[styles.form, className].filter(Boolean).join(' ')}
    />
  )
}

export function Label({ className, ...props }: LabelProps) {
  return (
    <RACLabel
      {...props}
      className={[styles['form__label'], className].filter(Boolean).join(' ')}
    />
  )
}

export function FieldError({ className, ...props }: FieldErrorProps) {
  return (
    <RACFieldError
      {...props}
      className={[styles['form__error'], className].filter(Boolean).join(' ')}
    />
  )
}

export function Description({ className, ...props }: TextProps) {
  return (
    <Text
      slot="description"
      {...props}
      className={[styles['form__description'], className].filter(Boolean).join(' ')}
    />
  )
}

export function FieldButton({ className, ...props }: ButtonProps) {
  return (
    <RACButton
      {...props}
      className={[styles['form__button'], className].filter(Boolean).join(' ')}
    />
  )
}