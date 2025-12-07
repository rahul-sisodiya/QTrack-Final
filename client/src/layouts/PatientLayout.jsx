import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '../components/Sidebar.jsx'
import Topbar from '../components/Topbar.jsx'

const styles = {
  layout: {
    display: 'grid',
    gridTemplateColumns: '260px 1fr',
    gridTemplateRows: '64px 1fr',
    gridTemplateAreas: "'sidebar topbar' 'sidebar content'",
    height: '100%',
    background: '#f0fdfa',
  },
  sidebar: {
    gridArea: 'sidebar',
    background: '#ffffff',
    borderRight: '1px solid #e5e7eb',
    padding: '16px 12px',
  },
  topbar: {
    gridArea: 'topbar',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    background: '#ffffff',
    borderBottom: '1px solid #e5e7eb',
  },
  content: {
    gridArea: 'content',
    padding: '16px',
  },
}

export default function PatientLayout() {
  const location = useLocation()
  return (
    <div style={styles.layout}>
      <aside style={styles.sidebar}>
        <Sidebar pathname={location.pathname} />
      </aside>
      <header style={styles.topbar}>
        <Topbar pathname={location.pathname} />
      </header>
      <main style={styles.content}>
        <Outlet />
      </main>
    </div>
  )
}