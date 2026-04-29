import { useMemo } from 'react'
import { Input } from 'react-aria-components'
import { useOneTimePassword } from './hooks/useOneTimePassword'
import styles from './OneTimePassword.module.scss'

export type OneTimePasswordProps = {
  length?: number
  value: string
  onChange: (nextValue: string) => void
  onComplete?: (value: string) => void
  autoFocus?: boolean
  isDisabled?: boolean
}

function toDigitsArray(value: string, length: number): string[] {
  const normalized = (value ?? '').replace(/\D+/g, '').slice(0, length)
  return Array.from({ length }, (_, index) => normalized[index] ?? '')
}

function fromDigitsArray(digits: string[]): string {
  return digits.join('')
}

export function OneTimePassword({
  length = 6,
  onChange,
  onComplete,
  value,
  isDisabled,
  autoFocus,
}: Readonly<OneTimePasswordProps>) {
  const digits = useMemo(() => toDigitsArray(value, length), [value, length])

  const setDigits = (nextDigits: string[]) => {
    const nextValue = fromDigitsArray(nextDigits)
      .replace(/\D+/g, '')
      .slice(0, length)

    onChange(nextValue)
    if (nextValue.length === length) {
      onComplete?.(nextValue)
    }
  }

  const { inputPropsAt } = useOneTimePassword({
    length,
    digits,
    setDigits,
  })

  return (
    <div
      className={styles.oneTimePassword}
      data-disabled={isDisabled ? 'true' : undefined}
    >
      {Array.from({ length }).map((_, index) => (
        <Input
          className={styles.oneTimePassword__input}
          key={index}
          id={`otp-input-${index}`}
          name={`otp-input-${index}`}
          aria-label={`Tal ${index + 1} af ${length}`}
          autoFocus={autoFocus && index === 0}
          disabled={isDisabled}
          {...inputPropsAt(index)}
        />
      ))}
    </div>
  )
}

export default OneTimePassword
