import { type ReactNode, useEffect, useRef, useState } from 'react'
import { useToast, useToastRegion } from 'react-aria'
import {
  ToastQueue,
  useToastQueue,
  type QueuedToast,
  type ToastState,
} from 'react-stately'
import styles from './Toast.module.scss'

export type ToastVariant = 'info' | 'positive' | 'negative' | 'warning'
export type DiToastVariant = 'default' | 'danger' | 'success' | 'warning'

export type AppToastContent = {
  title: string
  description?: string
  type?: ToastVariant
  variant?: DiToastVariant
  actions?: ReactNode
  className?: string
  timeout?: number
}

// eslint-disable-next-line react-refresh/only-export-components
export const queue = new ToastQueue<AppToastContent>({
  maxVisibleToasts: 5,
})

// eslint-disable-next-line react-refresh/only-export-components
export const toastQueue = queue

// eslint-disable-next-line react-refresh/only-export-components
export function showToast(content: AppToastContent) {
  return queue.add({
    ...content,
    variant: content.variant ?? normalizeVariant(content),
  })
}

type ToastProps = {
  toast: QueuedToast<AppToastContent>
  state: ToastState<AppToastContent>
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function normalizeVariant(content: AppToastContent): DiToastVariant {
  if (content.variant) {
    return content.variant
  }

  switch (content.type) {
    case 'negative':
      return 'danger'
    case 'positive':
      return 'success'
    case 'warning':
      return 'warning'
    case 'info':
    default:
      return 'default'
  }
}

function getVariantClassName(variant: DiToastVariant) {
  switch (variant) {
    case 'danger':
      return styles['toast--danger']
    case 'success':
      return styles['toast--success']
    case 'warning':
      return styles['toast--warning']
    case 'default':
    default:
      return undefined
  }
}

function ToastIcon({ variant }: { variant: DiToastVariant }) {
  if (variant === 'success') {
    return (
      <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 1.667a8.333 8.333 0 1 0 0 16.666 8.333 8.333 0 0 0 0-16.666Zm3.742 6.075-4.583 4.583a.833.833 0 0 1-1.178 0L6.258 10.6a.833.833 0 1 1 1.178-1.178l1.134 1.134 3.994-3.992a.833.833 0 0 1 1.178 1.178Z" />
      </svg>
    )
  }

  if (variant === 'warning') {
    return (
      <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor">
        <path d="M8.556 2.84a1.667 1.667 0 0 1 2.888 0l7.083 12.292a1.667 1.667 0 0 1-1.444 2.5H2.917a1.667 1.667 0 0 1-1.444-2.5L8.556 2.84ZM10 7.5a.833.833 0 0 0-.833.833v3.334a.833.833 0 1 0 1.666 0V8.333A.833.833 0 0 0 10 7.5Zm0 7.083a.833.833 0 1 0 0-1.666.833.833 0 0 0 0 1.666Z" />
      </svg>
    )
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor">
      <path d="M10 1.667a8.333 8.333 0 1 0 0 16.666 8.333 8.333 0 0 0 0-16.666ZM9.167 9.167A.833.833 0 0 1 10 8.333h.008a.833.833 0 0 1 .825.833v4.167a.833.833 0 0 1-1.666 0V9.167ZM10 6.667A.833.833 0 1 1 10 5a.833.833 0 0 1 0 1.667Z" />
    </svg>
  )
}

export function Toast({ toast, state }: ToastProps) {
  const ref = useRef<HTMLDivElement | null>(null)

  const {
    toastProps,
    contentProps,
    titleProps,
    descriptionProps,
    closeButtonProps,
  } = useToast({ toast }, state, ref)

  const variant = normalizeVariant(toast.content)
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
      className={cx(
        styles.toast,
        getVariantClassName(variant),
        toast.content.className,
      )}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className={styles['toast__content-wrapper']}>
        <span className={styles['toast__status-icon']}>
          <ToastIcon variant={variant} />
        </span>

        <div {...contentProps} className={styles.toast__content}>
          <div {...titleProps} className={styles.toast__title}>
            {toast.content.title}
          </div>

          {toast.content.description && (
            <div
              {...descriptionProps}
              className={styles.toast__description}
            >
              {toast.content.description}
            </div>
          )}

          {toast.content.actions && (
            <div className={styles.toast__actions}>
              {toast.content.actions}
            </div>
          )}
        </div>
      </div>

      <button
        {...closeButtonProps}
        className={styles['toast__close-button']}
        aria-label="Close notification"
        type="button"
      >
        <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
          <path
            d="m5 5 10 10M15 5 5 15"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="2"
          />
        </svg>
      </button>
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
        <Toast key={toast.key} toast={toast} state={state} />
      ))}
    </div>
  )
}

export default Toast
