import {
  Link as AriaLink,
  type LinkProps as AriaLinkProps,
} from 'react-aria-components'
import styles from './Link.module.scss'

export type LinkProps = Omit<AriaLinkProps, 'className' | 'href'> & {
  href?: string
  className?: string
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function isExternal(href?: string) {
  return typeof href === 'string' && /^https?:\/\//.test(href)
}

export function Link({ href, className, ...props }: Readonly<LinkProps>) {
  const external = isExternal(href)

  return (
    <AriaLink
      href={href}
      className={cx(styles.link, className)}
      {...(external && {
        target: '_blank',
        rel: 'noopener noreferrer',
      })}
      {...props}
    />
  )
}

export default Link
