import type { ReactNode } from 'react'
import styles from './Accordion.module.scss'

export type AccordionItem = {
  id: string
  title: ReactNode
  content: ReactNode
}

type AccordionProps = {
  items: AccordionItem[]
  className?: string
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export default function Accordion({ items, className }: AccordionProps) {
  return (
    <div className={cx(styles.accordion, className)}>
      {items.map((item) => (
        <details key={item.id} className={styles.accordion__item}>
          <summary className={styles.accordion__trigger}>
            {item.title}
          </summary>
          <div className={styles.accordion__content}>{item.content}</div>
        </details>
      ))}
    </div>
  )
}
