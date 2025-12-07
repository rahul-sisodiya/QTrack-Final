import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useEffect, useRef, useState } from 'react'

export default function Login() {
  const navigate = useNavigate()
  const { login, loading, user } = useAuth()
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const rememberRef = useRef(true)

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    const form = new FormData(e.currentTarget)
    const email = form.get('email')
    const password = form.get('password')
    const remember = form.get('remember') === 'on'
    rememberRef.current = remember
    try {
      await login(email, password)
    } catch (err) {
      setError(err?.message || 'Invalid email or password')
    }
  }

  // After auth state updates, optionally move auth to sessionStorage and navigate
  useEffect(() => {
    if (!user) return
    try {
      if (!rememberRef.current) {
        const t = localStorage.getItem('qtrack:token')
        const u = localStorage.getItem('qtrack:user')
        if (t) sessionStorage.setItem('qtrack:token', t)
        if (u) sessionStorage.setItem('qtrack:user', u)
        localStorage.removeItem('qtrack:token')
        localStorage.removeItem('qtrack:user')
      }
    } catch {}
    navigate(`/${user.role}/dashboard`)
  }, [user, navigate])

  return (
    <div className="auth-page" style={{ height: '100%' }}>
      <div className="auth-left">
        <div className="brand" style={{ fontSize: 22 }}>
          <span style={{ color: '#0a66c2' }}>QTrack</span>
        </div>
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to manage appointments and stay connected.</p>
      </div>
      <div className="auth-right">
        <form onSubmit={handleLogin} className="auth-card">
          <h2 className="auth-title" style={{ marginTop: 0 }}>Sign in</h2>
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
          <div style={{ display: 'grid', gap: 12 }}>
            <div>
              <label>Email</label>
              <input name="email" className="input" type="email" placeholder="you@example.com" required />
            </div>
            <div>
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <input name="password" className="input" type={showPassword ? 'text' : 'password'} placeholder="••••••••" required />
                <button type="button" className="btn btn-link" onClick={() => setShowPassword(s => !s)} style={{ position: 'absolute', right: 8, top: 8 }}>
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" name="remember" /> Remember me
            </label>
          </div>
          <div className="auth-actions" style={{ justifyContent: 'space-between' }}>
            <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</button>
            <Link to="#">Forgot password?</Link>
          </div>
          <div className="auth-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span>New to QTrack?</span> <Link to="/auth/register">Join now</Link>
            </div>
            <small style={{ color: 'var(--color-muted)' }}>By continuing you agree to our Terms & Privacy</small>
          </div>
        </form>
      </div>
    </div>
  )
}