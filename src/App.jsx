import { Navigate, Route, Routes } from 'react-router-dom'
import MasterRoute from './components/MasterRoute'
import ProtectedRoute from './components/ProtectedRoute'
import TestModeNav from './components/TestModeNav'
import { AuthProvider } from './context/AuthContext'
import AdminLoginPage from './pages/AdminLoginPage'
import DashboardPage from './pages/DashboardPage'
import LandingPage from './pages/LandingPage'
import MasterDashboardPage from './pages/MasterDashboardPage'
import MasterLoginPage from './pages/MasterLoginPage'
import PublicFormPage from './pages/PublicFormPage'
import SaasLandingPage from './pages/SaasLandingPage'
import SignupPage from './pages/SignupPage'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <TestModeNav />
      <Routes>
        <Route path="/" element={<SaasLandingPage />} />
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
        <Route path="/master/login" element={<MasterLoginPage />} />
        <Route
          path="/master"
          element={
            <MasterRoute>
              <MasterDashboardPage />
            </MasterRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
