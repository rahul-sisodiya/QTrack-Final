export default function Settings() {
  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Profile Settings</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <label>Full name</label>
          <input className="input" placeholder="Dr. Jane Doe" />
        </div>
        <div>
          <label>Specialization</label>
          <input className="input" placeholder="Cardiology" />
        </div>
        <div>
          <label>Clinic address</label>
          <input className="input" placeholder="123 Medical Street" />
        </div>
        <div>
          <label>Phone</label>
          <input className="input" placeholder="+1 555-0100" />
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <button className="btn btn-primary">Save changes</button>
      </div>
    </div>
  )
}