import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Landing from './pages/Landing.jsx'
import Upload from './pages/Upload.jsx'
import Dashboard from './pages/Dashboard.jsx'
import History from './pages/History.jsx'
import ReportDetail from './pages/ReportDetail.jsx'

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/dashboard/:uploadId" element={<Dashboard />} />
        <Route path="/history" element={<History />} />
        <Route path="/report/:uploadId" element={<ReportDetail />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
