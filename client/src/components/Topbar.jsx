import { useMemo } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useNavigate } from 'react-router-dom'

export default function Topbar({ pathname }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const title = useMemo(() => {
    if (pathname.startsWith('/doctor')) {
      if (pathname.includes('/appointments')) return 'Appointments'
      if (pathname.includes('/patients')) return 'Patients'
      if (pathname.includes('/schedule')) return 'Schedule'
      if (pathname.includes('/settings')) return 'Settings'
      return 'Doctor Dashboard'
    }
    if (pathname.startsWith('/patient')) {
      if (pathname.includes('/book')) return 'Book Appointment'
      return 'Patient Dashboard'
    }
    if (pathname.startsWith('/admin')) {
      return 'Admin Overview'
    }
    return 'Dashboard'
  }, [pathname])

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
      <h2 style={{ margin: 0, fontSize: 18 }}>{title}</h2>
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
        <input className="input" placeholder="Search..." style={{ maxWidth: 280 }} />
        <button type="button" className="btn" onClick={() => {
          if (pathname.startsWith('/doctor')) navigate('/doctor/chat')
          else if (pathname.startsWith('/patient')) navigate('/patient/chat')
        }}>Chat</button>
        <button className="btn">Notifications</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 999, background: '#e2e8f0', display: 'grid', placeItems: 'center', fontWeight: 700, color: '#334155' }}>
            {(user?.name || 'U').slice(0,1).toUpperCase()}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>{user?.role?.toUpperCase() || 'USER'}</span>
            <span style={{ fontSize: 12 }}>{user?.name || 'User'}</span>
          </div>
          <button className="btn" onClick={() => { logout(); navigate('/auth/login') }}>Logout</button>
        </div>
      </div>
    </div>
  )
}