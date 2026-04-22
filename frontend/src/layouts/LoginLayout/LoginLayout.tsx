import styles from './LoginLayout.module.scss'

interface LoginLayoutProps {
  children: React.ReactNode
}

export default function LoginLayout({ children }: LoginLayoutProps) {
  return (
    <div className={styles.layout}>
      <main className={styles.center}>{children}</main>
    </div>
  )
}
