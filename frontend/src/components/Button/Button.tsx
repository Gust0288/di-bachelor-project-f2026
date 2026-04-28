import {
  Button as AriaButton,
  type ButtonProps as AriaButtonProps,
} from 'react-aria-components'
import Spinner from '../Spinner'
import styles from './Button.module.scss'

type DiVariant =
  | 'default'
  | 'light'
  | 'remarkable'
  | 'outline'
  | 'outline light'
  | 'styleless'
type LegacyVariant = 'primary' | 'secondary' | 'quiet' | 'danger'
type Variant = DiVariant | LegacyVariant
type Size = 'small' | 'sm' | 'md' | 'lg'

type Props = Omit<AriaButtonProps, 'className' | 'children'> & {
  variant?: Variant
  size?: Size
  isSpinning?: boolean
  spinnerAriaLabel?: string
  className?: string
  children?: React.ReactNode
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function getVariantClassName(variant?: Variant) {
  switch (variant) {
    case 'light':
      return styles['button--light']
    case 'remarkable':
      return styles['button--remarkable']
    case 'outline':
    case 'secondary':
      return styles['button--outline']
    case 'outline light':
      return styles['button--outline-light']
    case 'styleless':
    case 'quiet':
      return styles['button--styleless']
    case 'danger':
      return styles['button--danger']
    case 'default':
    case 'primary':
    default:
      return undefined
  }
}

function getSizeClassName(size?: Size) {
  switch (size) {
    case 'small':
    case 'sm':
      return styles['button--small']
    case 'lg':
      return styles['button--large']
    default:
      return undefined
  }
}

function Button({
  children,
  variant = 'default',
  size = 'md',
  isDisabled,
  isSpinning,
  spinnerAriaLabel = 'Loading',
  className,
  ...props
}: Props) {
  const classes = cx(
    styles.button,
    getVariantClassName(variant),
    getSizeClassName(size),
    isSpinning && styles['is-spinning'],
    isDisabled && styles['is-disabled'],
    className,
  )

  return (
    <AriaButton {...props} className={classes} isDisabled={isDisabled}>
      <span className={styles.button__content}>{children}</span>
      {isSpinning && (
        <Spinner
          aria-label={spinnerAriaLabel}
          className={styles.button__spinner}
          size="small"
        />
      )}
    </AriaButton>
  )
}

export default Button
