import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'

export default function Records() {
  const { user, token } = useAuth()
  const [records, setRecords] = useState([])
  const [form, setForm] = useState({ date: '', type: '', doctorName: '', fileUrl: '', notes: '' })
  const [uploading, setUploading] = useState(false)
  const [patientId, setPatientId] = useState('')

  useEffect(() => {
    if (!token) return
    api.patient.me(undefined, token).then(res => setPatientId(res.patientId)).catch(() => setPatientId(''))
  }, [token])

  async function load() {
    const list = await api.patient.records.list(patientId)
    setRecords(list)
  }

  useEffect(() => { if (patientId) load() }, [patientId])

  async function upload() {
    if (!form.date || !form.type) return alert('Date and type are required')
    // Validate fileUrl is a PDF or JPEG URL if provided
    const isAllowedUrl = (url) => {
      if (!url) return true
      try {
        const u = new URL(url)
        const lower = u.pathname.toLowerCase()
        return (lower.endsWith('.pdf') || lower.endsWith('.jpeg') || lower.endsWith('.jpg'))
      } catch { return false }
    }
    if (form.fileUrl && !isAllowedUrl(form.fileUrl)) {
      alert('File URL must be a PDF or JPEG (http/https).')
      return
    }
    setUploading(true)
    try {
      await api.patient.records.upload({ patientId, ...form })
      setForm({ date: '', type: '', doctorName: '', fileUrl: '', notes: '' })
      await load()
    } finally { setUploading(false) }
  }

  async function remove(id) {
    await api.patient.records.remove(id)
    await load()
  }

  return (
    <div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>Upload New Record</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          <input className="input" placeholder="YYYY-MM-DD" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          <input className="input" placeholder="Type (e.g., Lab, X-Ray)" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} />
          <input className="input" placeholder="Doctor Name" value={form.doctorName} onChange={e => setForm(f => ({ ...f, doctorName: e.target.value }))} />
          <input className="input" type="url" pattern="https?://.*\\.(pdf|jpe?g)$" placeholder="File URL (.pdf or .jpeg/.jpg)" value={form.fileUrl} onChange={e => setForm(f => ({ ...f, fileUrl: e.target.value }))} />
          <input className="input" placeholder="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          <button className="btn" onClick={upload} disabled={uploading}>{uploading ? 'Uploading...' : 'Upload'}</button>
        </div>
      </div>

      <div className="card">
        <div style={{ fontWeight: 700, marginBottom: 10 }}>Health Records</div>
        <table className="table">
          <thead>
            <tr>
              <th>Date</th><th>Type</th><th>Doctor</th><th>File</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map(r => (
              <tr key={r.id}>
                <td>{r.date}</td>
                <td>{r.type}</td>
                <td>{r.doctorName}</td>
                <td>{r.fileUrl ? <a href={r.fileUrl} target="_blank" rel="noreferrer">View</a> : '-'}</td>
                <td>
                  <button className="btn" onClick={() => remove(r.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}