import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Header from './components/Header'
import { MyToastRegion } from './components/Toast/Toast'
import WizardPage from './pages/Wizard/WizardPage'
import LoginPage from './pages/Login/LoginPage'
import AdminPage from './pages/Admin/AdminPage'
import styles from './App.module.scss'

function AppContent() {
  const location = useLocation()
  const isAdmin = location.pathname === '/admin'

  return (
    <div className={styles.app}>
      {!isAdmin && <Header />}
      <main className={styles.main}>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/wizard" element={<WizardPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </main>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter
      future={{
        v7_relativeSplatPath: true,
        v7_startTransition: true,
      }}
    >
      <AppContent />
      <MyToastRegion />
    </BrowserRouter>
  )
}

export default App
