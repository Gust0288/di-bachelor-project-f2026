import type { ReactNode } from 'react'
import styles from './ContentBox.module.scss'

type Props = {
  title?: string
  description?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}

export default function ContentBox({
  title,
  description,
  action,
  children,
  className,
}: Props) {
  return (
    <section className={[styles.contentBox, className].filter(Boolean).join(' ')}>
      {title || description ? (
        <header className={styles.contentBox__header}>
          <div className={styles.contentBox__headerRow}>
            {title ? <h2>{title}</h2> : null}
            {action ? <div className={styles.contentBox__action}>{action}</div> : null}
          </div>
          {description ? <p>{description}</p> : null}
        </header>
      ) : null}

      <div className={styles.contentBox__content}>{children}</div>
    </section>
  )
}
