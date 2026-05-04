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

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

type LocalFormProps = FormProps & {
  noValidate?: boolean
}

export function Form({ className, ...props }: LocalFormProps) {
  return (
    <RACForm
      {...props}
      className={cx(styles.form, typeof className === 'string' && className)}
    />
  )
}

export function Label({ className, ...props }: LabelProps) {
  return (
    <RACLabel
      {...props}
      className={cx(
        styles.form__label,
        typeof className === 'string' && className,
      )}
    />
  )
}

export function FieldError({ className, ...props }: FieldErrorProps) {
  return (
    <RACFieldError
      {...props}
      className={cx(
        styles.form__error,
        typeof className === 'string' && className,
      )}
    />
  )
}

export function Description({ className, ...props }: TextProps) {
  return (
    <Text
      slot="description"
      {...props}
      className={cx(
        styles.form__description,
        typeof className === 'string' && className,
      )}
    />
  )
}

export function FieldButton({ className, ...props }: ButtonProps) {
  return (
    <RACButton
      {...props}
      className={cx(
        styles.form__button,
        typeof className === 'string' && className,
      )}
    />
  )
}
