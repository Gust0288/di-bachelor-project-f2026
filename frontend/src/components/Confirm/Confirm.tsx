import type { ReactNode } from 'react'
import {
  Dialog,
  Heading,
  Modal,
  ModalOverlay,
  type ModalOverlayProps,
} from 'react-aria-components'
import styles from './Confirm.module.scss'

export type ConfirmProps = Omit<ModalOverlayProps, 'className' | 'children'> & {
  headline: string
  headerAction?: ReactNode
  className?: string
  children: ReactNode
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export function Confirm({
  headline,
  headerAction,
  className,
  children,
  isDismissable = true,
  ...props
}: Readonly<ConfirmProps>) {
  return (
    <ModalOverlay
      {...props}
      className={styles.overlay}
      isDismissable={isDismissable}
    >
      <Modal className={cx(styles.modal, className)}>
        <Dialog className={styles.modal__dialog}>
          <div className={styles.confirmHeadline}>
            <Heading level={6} slot="title">
              {headline}
            </Heading>
            {headerAction}
          </div>
          {children}
        </Dialog>
      </Modal>
    </ModalOverlay>
  )
}

export type ConfirmContentProps = {
  children: ReactNode
  className?: string
}

export function ConfirmContent({
  children,
  className,
}: Readonly<ConfirmContentProps>) {
  return <div className={cx(styles.confirmContent, className)}>{children}</div>
}

export type ConfirmFooterProps = {
  children: ReactNode
  className?: string
}

export function ConfirmFooter({
  children,
  className,
}: Readonly<ConfirmFooterProps>) {
  return <div className={cx(styles.confirmFooter, className)}>{children}</div>
}

export default Confirm
