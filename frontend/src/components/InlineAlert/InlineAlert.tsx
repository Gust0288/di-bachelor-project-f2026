import type { ReactNode } from 'react'
import styles from './InlineAlert.module.scss'

type Tone = 'info' | 'success' | 'warning' | 'danger'

type Props = {
  title?: string
  children: ReactNode
  tone?: Tone
  className?: string
}

function InlineAlert({ title, children, tone = 'info', className }: Props) {
  return (
    <div
      className={[styles.inlineAlert, className].filter(Boolean).join(' ')}
      data-tone={tone}
      role={tone === 'danger' ? 'alert' : 'status'}
    >
      {title ? <strong>{title}</strong> : null}
      <div>{children}</div>
    </div>
  )
}

export default InlineAlert
