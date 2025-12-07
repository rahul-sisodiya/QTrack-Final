export default function AdminDashboard() {
  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Admin Overview</h3>
      <p>Manage clinics, doctors, and system settings.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 12 }}>
        <div className="card">
          <div style={{ color: '#64748b', fontSize: 12 }}>Total Doctors</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>32</div>
        </div>
        <div className="card">
          <div style={{ color: '#64748b', fontSize: 12 }}>Total Patients</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>1,245</div>
        </div>
        <div className="card">
          <div style={{ color: '#64748b', fontSize: 12 }}>Appointments (Today)</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>84</div>
        </div>
      </div>
    </div>
  )
}