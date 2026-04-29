import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import { MyToastRegion } from './components/Toast/Toast'
import WizardPage from './pages/Wizard/WizardPage'
import LoginPage from './pages/Login/LoginPage'
import styles from './App.module.scss'

function App() {
  return (
    <BrowserRouter>
      <div className={styles.app}>
        <Header />
        <main className={styles.main}>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/wizard" element={<WizardPage />} />
          </Routes>
        </main>
      </div>
      <MyToastRegion />
    </BrowserRouter>
  )
}

export default App
