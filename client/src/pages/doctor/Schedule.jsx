import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'

export default function Schedule() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const slots = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00']
  const [selected, setSelected] = useState({})
  const { token } = useAuth()

  function toggle(day, slot) {
    setSelected(prev => {
      const set = new Set(prev[day] || [])
      if (set.has(slot)) set.delete(slot)
      else set.add(slot)
      return { ...prev, [day]: Array.from(set) }
    })
  }

  async function save() {
    const pairs = Object.entries(selected).flatMap(([day, arr]) => arr.map(slot => ({ day, slot })))
    await api.doctor.saveAvailability(token, pairs)
    alert('Availability saved')
  }

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Weekly Availability</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 16 }}>
        <div>
          <div style={{ color: '#64748b', marginBottom: 8 }}>Days</div>
          {days.map(d => (
            <div key={d} style={{ padding: '8px 0' }}>{d}</div>
          ))}
        </div>
        <div>
          <div style={{ color: '#64748b', marginBottom: 8 }}>Slots</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
            {slots.map(s => (
              <button
                key={s}
                className="btn"
                style={{ textAlign: 'center', background: Object.values(selected).some(arr => arr.includes(s)) ? '#eff6ff' : undefined }}
                onClick={() => toggle('Mon', s)}
              >
                {s}
              </button>
            ))}
          </div>
          <div style={{ marginTop: 12 }}>
            <button className="btn btn-primary" onClick={save}>Save availability</button>
          </div>
        </div>
      </div>
    </div>
  )
}