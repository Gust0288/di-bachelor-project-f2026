import { useEffect, useRef, useState } from 'react'
import { useToast, useToastRegion } from 'react-aria'
import {
  ToastQueue,
  useToastQueue,
  type QueuedToast,
  type ToastState,
} from 'react-stately'
import Button from '../Button/Button'
import styles from './Toast.module.scss'

export type ToastVariant = 'info' | 'positive' | 'negative' | 'warning'

export type AppToastContent = {
  title: string
  description?: string
  type?: ToastVariant
  timeout?: number
}

export const queue = new ToastQueue<AppToastContent>({
  maxVisibleToasts: 5,
})

type MyToastProps = {
  toast: QueuedToast<AppToastContent>
  state: ToastState<AppToastContent>
}

function getToastIcon(type: ToastVariant) {
  switch (type) {
    case 'positive':
      return '✓'
    case 'negative':
      return '!'
    case 'warning':
      return '⚠'
    case 'info':
    default:
      return 'i'
  }
}

function MyToast({ toast, state }: MyToastProps) {
  const ref = useRef<HTMLDivElement | null>(null)

  const {
    toastProps,
    contentProps,
    titleProps,
    descriptionProps,
    closeButtonProps,
  } = useToast({ toast }, state, ref)

  const variant = toast.content.type ?? 'info'
  const timeout = Math.max(toast.content.timeout ?? 5000, 5000)

  const [isPaused, setIsPaused] = useState(false)
  const [remainingTime, setRemainingTime] = useState(timeout)
  const startTimeRef = useRef<number | null>(null)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    if (isPaused) {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current)
        timerRef.current = null
      }

      if (startTimeRef.current) {
        const elapsed = Date.now() - startTimeRef.current
        setRemainingTime((prev) => Math.max(prev - elapsed, 0))
        startTimeRef.current = null
      }

      return
    }

    startTimeRef.current = Date.now()

    timerRef.current = window.setTimeout(() => {
      state.close(toast.key)
    }, remainingTime)

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isPaused, remainingTime, state, toast.key])

  return (
  <div
    {...toastProps}
    ref={ref}
    className={`${styles.toast} ${styles[`toast--${variant}`]}`}
    onMouseEnter={() => setIsPaused(true)}
    onMouseLeave={() => setIsPaused(false)}
  >
    <div
      className={`${styles['toast__icon']} ${styles[`toast__icon--${variant}`]}`}
      aria-hidden="true"
    >
      {getToastIcon(variant)}
    </div>

    <div {...contentProps} className={styles['toast__content']}>
      <div {...titleProps} className={styles['toast__title']}>
        {toast.content.title}
      </div>

      {toast.content.description && (
        <div {...descriptionProps} className={styles['toast__description']}>
          {toast.content.description}
        </div>
      )}
    </div>

    <Button
      {...closeButtonProps}
      className={styles['toast__closeButton']}
      aria-label="Close notification"
      variant="primary"
    >
      ×
    </Button>
  </div>
)
}

export function MyToastRegion() {
  const state = useToastQueue(queue)
  const ref = useRef<HTMLDivElement | null>(null)
  const { regionProps } = useToastRegion({}, state, ref)

  if (state.visibleToasts.length === 0) {
    return null
  }

  return (
    <div {...regionProps} ref={ref} className={styles.toastRegion}>
      {state.visibleToasts.map((toast) => (
        <MyToast key={toast.key} toast={toast} state={state} />
      ))}
    </div>
  )
}