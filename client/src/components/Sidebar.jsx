import { NavLink } from 'react-router-dom'

const linkStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '10px 12px',
  borderRadius: 8,
  color: '#64748b',
}

const activeStyle = {
  background: '#eff6ff',
  color: 'var(--color-primary)',
}

function SectionTitle({ children }) {
  return (
    <div style={{
      margin: '10px 8px 6px 8px',
      fontSize: 12,
      color: '#94a3b8',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      fontWeight: 600,
    }}>{children}</div>
  )
}

export default function Sidebar({ pathname }) {
  const isDoctor = pathname.startsWith('/doctor')
  const isPatient = pathname.startsWith('/patient')
  const isAdmin = pathname.startsWith('/admin')

  const doctorMenu = [
    { to: '/doctor/dashboard', label: 'Dashboard', icon: '▧' },
    { to: '/doctor/appointments', label: 'Appointments', icon: '📅' },
    { to: '/doctor/patients', label: 'Patients', icon: '👥' },
    { to: '/doctor/schedule', label: 'Schedule', icon: '🗓️' },
    { to: '/doctor/settings', label: 'Settings', icon: '⚙️' },
  ]

  const patientMenu = [
    { to: '/patient/dashboard', label: 'Dashboard', icon: '▧' },
    { to: '/patient/book', label: 'Book Appointment', icon: '📅' },
    { to: '/patient/queue', label: 'Join Queue', icon: '⏱️' },
    { to: '/patient/records', label: 'Health Records', icon: '🩺' },
    { to: '/patient/history', label: 'Queue History', icon: '🧾' },
    { to: '/patient/medical-history', label: 'Medical History', icon: '📋' },
    { to: '/patient/settings', label: 'Settings', icon: '⚙️' },
  ]

  const adminMenu = [
    { to: '/admin', label: 'Overview', icon: '▧' },
  ]

  const currentMenu = isDoctor ? doctorMenu : isPatient ? patientMenu : adminMenu

  return (
    <div>
      <div className="brand">
        <span style={{fontWeight: 800, color: '#0f172a'}}>QTrack</span>
        <span style={{
          fontSize: 12,
          padding: '2px 6px',
          border: '1px solid #e5e7eb',
          borderRadius: 6,
          color: '#64748b'
        }}>{isDoctor ? 'Doctor' : isPatient ? 'Patient' : 'Admin'}</span>
      </div>

      <SectionTitle>Navigation</SectionTitle>
      <nav className="nav">
        {currentMenu.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            style={({ isActive }) => ({ ...linkStyle, ...(isActive ? activeStyle : {}) })}    
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <SectionTitle>Communication</SectionTitle>
      <nav className="nav">
        {isDoctor && (
          <NavLink to="/doctor/chat" style={({ isActive }) => ({ ...linkStyle, ...(isActive ? activeStyle : {}) })}>
            <span>💬</span>
            <span>Chat</span>
          </NavLink>
        )}
        {isPatient && (
          <NavLink to="/patient/chat" style={({ isActive }) => ({ ...linkStyle, ...(isActive ? activeStyle : {}) })}>
            <span>💬</span>
            <span>Chat</span>
          </NavLink>
        )}
        {isPatient && (
          <NavLink to="/patient/ai" style={({ isActive }) => ({ ...linkStyle, ...(isActive ? activeStyle : {}) })}>
            <span style={{ width: 20, height: 20, borderRadius: 999, background: '#0ea5e9', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 700 }}>Q</span>
            <span>Q</span>
          </NavLink>
        )}
      </nav>
    </div>
  )
}