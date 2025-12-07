import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../../lib/api'

export default function BookAppointment() {
  const [doctors, setDoctors] = useState([])
  const [form, setForm] = useState({ doctorId: '', date: '', time: '', notes: '' })
  const [params] = useSearchParams()

  useEffect(() => {
    api.patient.doctors().then(setDoctors).catch(() => setDoctors([]))
  }, [])

  useEffect(() => {
    const d = params.get('doctorId')
    if (d) setForm(prev => ({ ...prev, doctorId: d }))
  }, [params])

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function submit() {
    if (!form.doctorId || !form.date || !form.time) return alert('Please fill doctor, date and time')
    await api.patient.createAppointment(form)
    alert('Appointment created')
  }

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Book Appointment</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <label>Doctor</label>
          <select className="input" value={form.doctorId} onChange={e => update('doctorId', e.target.value)}>
            <option value="">Select a doctor</option>
            {doctors.map(d => (
              <option key={d.id} value={d.id}>{d.name} — {d.specialization}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Date</label>
          <input className="input" type="date" value={form.date} onChange={e => update('date', e.target.value)} />
        </div>
        <div>
          <label>Time</label>
          <input className="input" type="time" value={form.time} onChange={e => update('time', e.target.value)} />
        </div>
        <div>
          <label>Notes</label>
          <input className="input" placeholder="Optional notes" value={form.notes} onChange={e => update('notes', e.target.value)} />
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <button className="btn btn-primary" onClick={submit}>Confirm booking</button>
      </div>
    </div>
  )
}