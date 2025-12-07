import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '../components/Sidebar.jsx'
import Topbar from '../components/Topbar.jsx'

export default function DoctorLayout() {
  const location = useLocation()
  return (
    <div className="doctor-layout" style={{
      display: 'grid',
      gridTemplateColumns: '280px 1fr',
      gridTemplateRows: '72px 1fr',
      gridTemplateAreas: "'sidebar topbar' 'sidebar content'",
      height: '100%',
      background: 'linear-gradient(180deg, #f3f6fb 0%, #eef2f7 100%)'
    }}>
      <aside style={{
        gridArea: 'sidebar',
        background: '#ffffff',
        borderRight: '1px solid #e5e7eb',
        padding: '20px 14px'
      }}>
        <Sidebar pathname={location.pathname} />
      </aside>
      <header style={{
        gridArea: 'topbar',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        background: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <Topbar pathname={location.pathname} />
      </header>
      <main style={{ gridArea: 'content', padding: 20 }}>
        <Outlet />
      </main>
    </div>
  )
}