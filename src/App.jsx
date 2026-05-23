import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import TestModeNav from './components/TestModeNav'
import { AuthProvider } from './context/AuthContext'
import AdminLoginPage from './pages/AdminLoginPage'
import DashboardPage from './pages/DashboardPage'
import LandingPage from './pages/LandingPage'
import PublicFormPage from './pages/PublicFormPage'
import SignupPage from './pages/SignupPage'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <TestModeNav />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/vereador/:slug" element={<LandingPage />} />
        <Route path="/cadastro" element={<SignupPage />} />
        <Route path="/formulario" element={<PublicFormPage />} />
        <Route path="/atendimento/:slug" element={<PublicFormPage />} />
        <Route path="/painel/login" element={<AdminLoginPage />} />
        <Route
          path="/painel"
          element={
            <ProtectedRoute allowedRoles={['admin', 'operator']}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
