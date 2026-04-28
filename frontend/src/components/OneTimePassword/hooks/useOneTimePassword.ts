import {
  type ChangeEvent,
  type ClipboardEvent,
  type FocusEvent,
  type KeyboardEvent,
  type RefObject,
  useCallback,
  useRef,
} from 'react'

export type UseOneTimePasswordOptions = {
  length: number
  digits: string[]
  setDigits: (nextDigits: string[]) => void
}

export type OneTimePasswordHandlers = {
  inputPropsAt: (index: number) => {
    ref: (el: HTMLInputElement | null) => void
    value: string
    inputMode: 'numeric'
    pattern: string
    maxLength: number
    autoComplete: string
    onFocus: (e: FocusEvent<HTMLInputElement>) => void
    onChange: (e: ChangeEvent<HTMLInputElement>) => void
    onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void
    onPaste: (e: ClipboardEvent<HTMLInputElement>) => void
  }
  refs: RefObject<Array<HTMLInputElement | null>>
}

export function useOneTimePassword(
  opts: UseOneTimePasswordOptions,
): OneTimePasswordHandlers {
  const { length, digits, setDigits } = opts
  const refs = useRef<Array<HTMLInputElement | null>>([])

  const setDigitAt = useCallback(
    (index: number, value: string) => {
      const next = [...digits]
      next[index] = value
      setDigits(next)
    },
    [digits, setDigits],
  )

  const focusIndex = useCallback((index: number) => {
    const el = refs.current[index]
    el?.focus()
    el?.select()
  }, [])

  const fillFrom = useCallback(
    (start: number, raw: string) => {
      const onlyDigits = raw.replace(/\D+/g, '')
      if (!onlyDigits) {
        return
      }

      const next = [...digits]
      next.splice(start, onlyDigits.length, ...onlyDigits)
      setDigits(next.slice(0, length))
    },
    [digits, length, setDigits],
  )

  const onChangeAt = useCallback(
    (index: number, event: ChangeEvent<HTMLInputElement>) => {
      const onlyDigits = event.currentTarget.value.replace(/\D+/g, '')

      if (onlyDigits.length <= 1) {
        const nextChar = onlyDigits.slice(0, 1)
        setDigitAt(index, nextChar)

        if (nextChar && index < length - 1) {
          focusIndex(index + 1)
        }

        return
      }

      fillFrom(0, onlyDigits)
    },
    [fillFrom, focusIndex, length, setDigitAt],
  )

  const onKeyDownAt = useCallback(
    (index: number, event: KeyboardEvent<HTMLInputElement>) => {
      const isAtFirstPosition = index === 0
      const isAtLastPosition = index === length - 1
      const currentDigit = digits[index]

      if (event.key === 'Backspace') {
        if (currentDigit) {
          event.preventDefault()
          setDigitAt(index, '')
          return
        }

        if (!isAtFirstPosition) {
          event.preventDefault()
          setDigitAt(index - 1, '')
          focusIndex(index - 1)
        }

        return
      }

      if (event.key === 'ArrowLeft' && !isAtFirstPosition) {
        event.preventDefault()
        focusIndex(index - 1)
        return
      }

      if (event.key === 'ArrowRight' && !isAtLastPosition) {
        event.preventDefault()
        focusIndex(index + 1)
        return
      }

      if (event.key === ' ') {
        event.preventDefault()
      }
    },
    [digits, focusIndex, length, setDigitAt],
  )

  const onPasteAt = useCallback(
    (event: ClipboardEvent<HTMLInputElement>) => {
      const text = event.clipboardData.getData('text')
      if (!text) {
        return
      }

      event.preventDefault()
      fillFrom(0, text)
    },
    [fillFrom],
  )

  const onFocusAt = useCallback(
    (index: number) => {
      focusIndex(index)
    },
    [focusIndex],
  )

  const inputPropsAt = useCallback(
    (index: number) => ({
      ref: (el: HTMLInputElement | null) => {
        refs.current[index] = el
      },
      value: digits[index] ?? '',
      inputMode: 'numeric' as const,
      pattern: '\\d*',
      maxLength: 1,
      autoComplete: index === 0 ? 'one-time-code' : 'off',
      onFocus: () => onFocusAt(index),
      onChange: (event: ChangeEvent<HTMLInputElement>) =>
        onChangeAt(index, event),
      onKeyDown: (event: KeyboardEvent<HTMLInputElement>) =>
        onKeyDownAt(index, event),
      onPaste: (event: ClipboardEvent<HTMLInputElement>) => onPasteAt(event),
    }),
    [digits, onChangeAt, onFocusAt, onKeyDownAt, onPasteAt],
  )

  return { inputPropsAt, refs }
}
