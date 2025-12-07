import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'

export default function MedicalHistory() {
  const { user, token } = useAuth()
  const [patientId, setPatientId] = useState('')
  const [records, setRecords] = useState([])
  const [visits, setVisits] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    api.patient.me(undefined, token)
      .then(res => setPatientId(res.patientId))
      .catch(() => setPatientId(''))
  }, [token])

  useEffect(() => {
    if (!patientId) return
    setLoading(true)
    Promise.all([
      api.patient.records.list(patientId).catch(() => []),
      api.patient.queue.history(patientId).catch(() => []),
    ])
      .then(([rec, que]) => { setRecords(rec); setVisits(que) })
      .finally(() => setLoading(false))
  }, [patientId])

  const prescriptions = useMemo(() => {
    return records.filter(r => (r.type || '').toLowerCase().includes('prescription'))
  }, [records])

  const reports = useMemo(() => {
    return records.filter(r => !(r.type || '').toLowerCase().includes('prescription'))
  }, [records])

  return (
    <div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>Medical History</div>
        <p style={{ color: 'var(--color-muted)', margin: 0 }}>Your clinic visits, prescriptions, and medical reports.</p>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>Clinic Visits</div>
        {loading && <div className="badge">Loading...</div>}
        {!loading && (
          <table className="table">
            <thead>
              <tr>
                <th>Doctor</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {visits.map(v => (
                <tr key={v.id}>
                  <td>{v.doctor}</td>
                  <td>{new Date(v.date).toLocaleString()}</td>
                  <td>{v.status}</td>
                </tr>
              ))}
              {visits.length === 0 && (
                <tr><td colSpan={3} style={{ color: 'var(--color-muted)', textAlign: 'center' }}>No visits found</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>Prescriptions</div>
        {loading && <div className="badge">Loading...</div>}
        {!loading && (
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Doctor</th>
                <th>Notes</th>
                <th>File</th>
              </tr>
            </thead>
            <tbody>
              {prescriptions.map(r => (
                <tr key={r.id}>
                  <td>{r.date}</td>
                  <td>{r.doctorName}</td>
                  <td>{r.notes || '-'}</td>
                  <td>{r.fileUrl ? <a href={r.fileUrl} target="_blank" rel="noreferrer">View</a> : '-'}</td>
                </tr>
              ))}
              {prescriptions.length === 0 && (
                <tr><td colSpan={4} style={{ color: 'var(--color-muted)', textAlign: 'center' }}>No prescriptions found</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <div style={{ fontWeight: 700, marginBottom: 10 }}>Reports</div>
        {loading && <div className="badge">Loading...</div>}
        {!loading && (
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Doctor</th>
                <th>Notes</th>
                <th>File</th>
              </tr>
            </thead>
            <tbody>
              {reports.map(r => (
                <tr key={r.id}>
                  <td>{r.date}</td>
                  <td>{r.type}</td>
                  <td>{r.doctorName}</td>
                  <td>{r.notes || '-'}</td>
                  <td>{r.fileUrl ? <a href={r.fileUrl} target="_blank" rel="noreferrer">View</a> : '-'}</td>
                </tr>
              ))}
              {reports.length === 0 && (
                <tr><td colSpan={5} style={{ color: 'var(--color-muted)', textAlign: 'center' }}>No reports found</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}