import { Navigate } from 'react-router-dom'

export default function MasterRoute({ children }) {
  const authed = sessionStorage.getItem('master_auth') === '1'
  if (!authed) return <Navigate to="/master/login" replace />
  return children
}
