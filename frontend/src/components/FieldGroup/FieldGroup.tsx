import type { ReactNode } from 'react'
import styles from './FieldGroup.module.scss'

type Props = {
  title: string
  description?: string
  children: ReactNode
  className?: string
}

function FieldGroup({ title, description, children, className }: Props) {
  return (
    <section className={[styles.fieldGroup, className].filter(Boolean).join(' ')}>
      <header className={styles.fieldGroup__header}>
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </header>

      <div className={styles.fieldGroup__content}>{children}</div>
    </section>
  )
}

export default FieldGroup
