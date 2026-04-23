import type { ReactNode } from 'react'
import {
  Checkbox as AriaCheckbox,
  FieldError,
  Text,
  type CheckboxProps as AriaCheckboxProps,
} from 'react-aria-components'
import styles from './Checkbox.module.scss'

type Props = Omit<AriaCheckboxProps, 'children'> & {
  children?: ReactNode
  description?: ReactNode
  errorMessage?: ReactNode
}

export function Checkbox({
  children,
  description,
  errorMessage,
  className,
  ...props
}: Props) {
  const classes = [styles.checkbox, className].filter(Boolean).join(' ')

  return (
    <AriaCheckbox {...props} className={classes}>
      {({ isIndeterminate }) => (
        <>
          <span className={styles.checkbox__indicator} aria-hidden="true">
            <svg viewBox="0 0 18 18">
              {isIndeterminate ? (
                <rect x="3" y="8" width="12" height="2" rx="1" />
              ) : (
                <polyline points="3.5 9.5 7.5 13.5 14.5 4.5" />
              )}
            </svg>
          </span>

          <span className={styles.checkbox__content}>
            {children ? (
              <span className={styles.checkbox__label}>{children}</span>
            ) : null}
            {description ? (
              <Text slot="description" className={styles.checkbox__description}>
                {description}
              </Text>
            ) : null}
            {errorMessage ? (
              <FieldError className={styles.checkbox__error}>
                {errorMessage}
              </FieldError>
            ) : null}
          </span>
        </>
      )}
    </AriaCheckbox>
  )
}

export default Checkbox
