import styles from './Spinner.module.scss'

type Variant = 'default' | 'theme-primary' | 'theme-secondary' | 'white' | 'black'
type Size = 'small' | 'large' | 'xlarge'
type Display = 'default' | 'full'

export type SpinnerProps = {
  size?: Size
  variant?: Variant
  display?: Display
  'aria-label': string
  className?: string
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function getVariantClassName(variant?: Variant) {
  switch (variant) {
    case 'theme-primary':
      return styles['spinner--theme-primary']
    case 'theme-secondary':
      return styles['spinner--theme-secondary']
    case 'white':
      return styles['spinner--white']
    case 'black':
      return styles['spinner--black']
    default:
      return undefined
  }
}

function getSizeClassName(size?: Size) {
  switch (size) {
    case 'small':
      return styles['spinner--sm']
    case 'large':
      return styles['spinner--lg']
    case 'xlarge':
      return styles['spinner--xl']
    default:
      return undefined
  }
}

export function Spinner({
  size,
  variant,
  display,
  className,
  'aria-label': ariaLabel,
}: Readonly<SpinnerProps>) {
  return (
    <div
      className={cx(
        styles.spinner,
        getVariantClassName(variant),
        getSizeClassName(size),
        display === 'full' && styles['spinner--full'],
        className,
      )}
      aria-label={ariaLabel}
      role="status"
    >
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" strokeWidth="3" />
      </svg>
    </div>
  )
}

export default Spinner
