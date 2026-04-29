import type { ReactNode } from 'react'
import styles from './SummaryList.module.scss'

type Item = {
  label: string
  value: ReactNode
}

type Props = {
  items: Item[]
  variant?: 'default' | 'plain'
  className?: string
}

function SummaryList({ items, variant = 'default', className }: Props) {
  return (
    <dl
      className={[
        styles.summaryList,
        variant === 'plain' && styles['summaryList--plain'],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {items.map((item) => (
        <div key={item.label} className={styles.summaryList__row}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}

export default SummaryList
