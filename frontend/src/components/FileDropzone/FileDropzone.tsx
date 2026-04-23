import type { ReactNode } from 'react'
import Button from '../Button/Button'
import styles from './FileDropzone.module.scss'

type Props = {
  title: string
  description?: ReactNode
  actionLabel?: string
  onAction?: () => void
  className?: string
}

function FileDropzone({
  title,
  description,
  actionLabel = 'Vælg fil',
  onAction,
  className,
}: Props) {
  return (
    <div className={[styles.fileDropzone, className].filter(Boolean).join(' ')}>
      <div className={styles.fileDropzone__copy}>
        <strong>{title}</strong>
        {description ? <span>{description}</span> : null}
      </div>

      <Button variant="secondary" onPress={onAction}>
        {actionLabel}
      </Button>
    </div>
  )
}

export default FileDropzone
