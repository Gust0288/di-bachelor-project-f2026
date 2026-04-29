import type { ReactNode } from 'react'
import styles from './ContentBox.module.scss'

type Props = {
  title?: string
  description?: string
  children: ReactNode
  className?: string
}

export default function ContentBox({
  title,
  description,
  children,
  className,
}: Props) {
  return (
    <section className={[styles.contentBox, className].filter(Boolean).join(' ')}>
      {title || description ? (
        <header className={styles.contentBox__header}>
          {title ? <h2>{title}</h2> : null}
          {description ? <p>{description}</p> : null}
        </header>
      ) : null}

      <div className={styles.contentBox__content}>{children}</div>
    </section>
  )
}
