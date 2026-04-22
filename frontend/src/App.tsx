import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { MyToastRegion } from './components/Toast/Toast'
import WizardPage from './pages/Wizard/WizardPage'
import LoginPage from './pages/Login/LoginPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/wizard" element={<WizardPage />} />
      </Routes>
      <MyToastRegion />
    </BrowserRouter>
  )
}

export default App