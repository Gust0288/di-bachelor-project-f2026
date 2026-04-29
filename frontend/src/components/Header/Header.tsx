import Logo from '../Logo'
import styles from './Header.module.scss'

export default function Header() {
  return (
    <header className={styles.header}>
      <Logo href="/" title="Indmeldelsesportal" />
    </header>
  )
}
