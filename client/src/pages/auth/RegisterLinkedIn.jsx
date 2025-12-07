import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useState } from 'react'

export default function RegisterLinkedIn() {
  const navigate = useNavigate()
  const { register, loading } = useAuth()
  const [error, setError] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [accepted, setAccepted] = useState(false)

  function passwordStrength(p) {
    let score = 0
    if (p.length >= 8) score++
    if (/[A-Z]/.test(p)) score++
    if (/[a-z]/.test(p)) score++
    if (/[0-9]/.test(p)) score++
    if (/[^A-Za-z0-9]/.test(p)) score++
    return score
  }

  async function handleRegister(e) {
    e.preventDefault()
    setError('')
    if (!accepted) return setError('Please accept Terms and Privacy Policy')
    if (password !== confirm) return setError('Passwords do not match')
    if (passwordStrength(password) < 3) return setError('Password is too weak')
    const form = new FormData(e.currentTarget)
    const payload = {
      name: form.get('name'),
      role: form.get('role'),
      email: form.get('email'),
      password: password,
    }
    try {
      await register(payload)
      navigate('/auth/login')
    } catch (err) {
      setError(err?.message || 'Registration failed.')
    }
  }

  const strength = passwordStrength(password)

  return (
    <div className="auth-page" style={{ height: '100%' }}>
      <div className="auth-left">
        <div className="brand" style={{ fontSize: 22 }}>
          <span style={{ color: '#0a66c2' }}>QTrack</span>
        </div>
        <h1 className="auth-title">Join QTrack</h1>
        <p className="auth-subtitle">Create your account and start booking appointments.</p>
      </div>
      <div className="auth-right">
        <form onSubmit={handleRegister} className="auth-card">
          <h2 className="auth-title" style={{ marginTop: 0 }}>Create account</h2>
          {error && (
            <div style={{
              background: '#fee2e2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              padding: '8px 12px',
              borderRadius: 8,
              marginBottom: 12
            }}>{error}</div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label>Full name</label>
              <input name="name" className="input" placeholder="Dr. Jane Doe" required />
            </div>
            <div>
              <label>Role</label>
              <select name="role" className="input" defaultValue="patient">
                <option value="doctor">Doctor</option>
                <option value="patient">Patient</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label>Email</label>
              <input name="email" className="input" type="email" placeholder="you@example.com" required />
            </div>
            <div>
              <label>Password</label>
              <input name="password" className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                {[0,1,2,3,4].map(i => (
                  <div key={i} style={{ height: 6, flex: 1, borderRadius: 6, background: i < strength ? '#0a66c2' : '#e5e7eb' }} />
                ))}
              </div>
            </div>
            <div>
              <label>Confirm password</label>
              <input name="confirm" className="input" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••" required />
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
            <input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} /> I agree to the <a href="#" style={{ marginLeft: 4 }}>Terms</a> and <a href="#" style={{ marginLeft: 4 }}>Privacy Policy</a>
          </label>
          <div className="auth-actions">
            <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Creating…' : 'Register'}</button>
          </div>
          <div className="auth-footer">
            <span>Already on QTrack?</span> <Link to="/auth/login">Sign in</Link>
          </div>
        </form>
      </div>
    </div>
  )
}