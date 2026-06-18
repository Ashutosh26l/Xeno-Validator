import { Navigate } from 'react-router-dom'

export default function GuestRoute({ children }) {
  const token = localStorage.getItem('token')
  // If already logged in, redirect to upload page
  if (token) return <Navigate to="/upload" replace />
  return children
}
