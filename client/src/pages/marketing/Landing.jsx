import { useNavigate } from 'react-router-dom'

const styles = {
  page: { fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif', color: '#0f172a' },
  container: { maxWidth: 1180, margin: '0 auto', padding: '0 16px' },
  topbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid #e5e7eb' },
  logo: { fontWeight: 800, fontSize: 18, letterSpacing: 0.4 },
  link: { color: '#2563eb', cursor: 'pointer', textDecoration: 'none', fontWeight: 600 },
  hero: { display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: 24, alignItems: 'center', padding: '36px 0' },
  heroCard: { background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, boxShadow: '0 8px 30px rgba(15,23,42,0.06)' },
  heroTitle: { fontSize: 34, fontWeight: 800 },
  heroSub: { color: '#64748b', marginTop: 8 },
  cta: { display: 'inline-flex', alignItems: 'center', gap: 8, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 16px', fontWeight: 700, marginTop: 16, cursor: 'pointer' },
  heroImgWrap: { position: 'relative', height: 340, borderRadius: 16, overflow: 'hidden', boxShadow: '0 10px 40px rgba(15,23,42,0.12)' },
  heroImg: { width: '100%', height: '100%', objectFit: 'cover' },
  heroOverlay: { position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(15,23,42,0.40), rgba(15,23,42,0.15))' },
  pillTabs: { display: 'flex', gap: 8, marginTop: 12 },
  pill: (active) => ({ padding: '8px 12px', borderRadius: 999, border: '1px solid #e5e7eb', background: active ? '#eef2ff' : '#fff', color: active ? '#1e40af' : '#334155', fontWeight: 600, cursor: 'pointer' }),
  sectionTitle: { textAlign: 'center', fontSize: 28, fontWeight: 800, margin: '20px 0' },
  featuresGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 },
  featureCard: { background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 },
  featureIcon: { width: 40, height: 40, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e40af', fontWeight: 800 },
  splitSection: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'center', marginTop: 28 },
  splitText: { background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, boxShadow: '0 8px 30px rgba(15,23,42,0.06)' },
  splitBig: { position: 'relative', height: 320, borderRadius: 16, overflow: 'hidden', boxShadow: '0 10px 40px rgba(15,23,42,0.12)' },
  muted: { color: '#64748b' },
  footer: { background: '#0f172a', color: '#e2e8f0', padding: '24px 0', marginTop: 36, textAlign: 'center', borderTop: '1px solid #1f2937' }
}

const Feature = ({ icon, title, desc }) => (
  <div style={styles.featureCard}>
    <div style={styles.featureIcon}>{icon}</div>
    <div style={{ fontWeight: 700, marginTop: 8 }}>{title}</div>
    <div style={{ ...styles.muted, marginTop: 6 }}>{desc}</div>
  </div>
)

export default function Landing() {
  const navigate = useNavigate()
  const setFallback = (fallback) => (e) => { e.currentTarget.src = fallback }
  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Topbar */}
        <div style={styles.topbar}>
          <div style={styles.logo}>QTrack</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <a style={styles.link} onClick={() => navigate('/auth/login')}>Sign in</a>
            <a style={styles.link} onClick={() => navigate('/auth/register')}>Create account</a>
          </div>
        </div>

        {/* Hero */}
        <div style={styles.hero}>
          <div style={styles.heroCard}>
            <div style={styles.heroTitle}>See how QTrack streamlines care delivery</div>
            <div style={styles.heroSub}>Manage queues, appointments, chat, and health records — all in one place.</div>
            <button style={styles.cta} onClick={() => navigate('/auth/register')}>Get started</button>
            <div style={styles.pillTabs}>
              <div style={styles.pill(true)}>For Clinics</div>
              <div style={styles.pill(false)}>For Patients</div>
            </div>
          </div>
          <div style={styles.heroImgWrap}>
            <img style={styles.heroImg} alt="Hospital lobby with soft blur" src="/images/hospital-blur.jpg" onError={setFallback('https://images.unsplash.com/photo-1531973576160-7125cd663d86?q=80&w=1600&auto=format&fit=crop')} />
            <div style={styles.heroOverlay}></div>
          </div>
        </div>

        {/* Feature summary */}
        <div style={styles.sectionTitle}>Run your clinic with QTrack</div>
        <div style={styles.featuresGrid}>
          <Feature icon="🕒" title="Live Queue" desc="Track waiting patients and serve with one click." />
          <Feature icon="📅" title="Online Appointments" desc="Schedule, reschedule, and cancel with instant updates." />
          <Feature icon="🔒" title="Secure Chat" desc="Connect with patients through HIPAA‑friendly messaging." />
          <Feature icon="📁" title="Health Records" desc="Upload and review PDFs and images in one place." />
        </div>

        {/* Sections */}
        <div style={styles.splitSection}>
          <div style={styles.splitText}>
            <div style={{ fontSize: 22, fontWeight: 800 }}>Manage appointments with ease</div>
            <div style={styles.muted}>Doctor‑specific dashboards and upcoming views keep your day on track.</div>
            <button style={{ ...styles.cta, marginTop: 12 }} onClick={() => navigate('/doctor/appointments')}>Go to appointments</button>
          </div>
          <div style={styles.splitBig}>
            <img style={styles.heroImg} alt="Clean operating room" src="/images/or-cleanroom.jpg" onError={setFallback('https://images.unsplash.com/photo-1579154204601-01588f351e67?q=80&w=1600&auto=format&fit=crop')} />
          </div>
        </div>

        <div style={styles.splitSection}>
          <div style={styles.splitBig}>
            <img style={styles.heroImg} alt="Surgical team collaborating under operating lights" src="/images/or-team-under-lights.jpg" onError={setFallback('https://images.unsplash.com/photo-1492724441997-5dc865305da7?q=80&w=1600&auto=format&fit=crop')} />
          </div>
          <div style={styles.splitText}>
            <div style={{ fontSize: 22, fontWeight: 800 }}>Communicate securely</div>
            <div style={styles.muted}>Chat with patients, share updates, and coordinate care in real time.</div>
            <button style={{ ...styles.cta, marginTop: 12 }} onClick={() => navigate('/doctor/chat')}>Open chat</button>
          </div>
        </div>

        <div style={styles.splitSection}>
          <div style={styles.splitText}>
            <div style={{ fontSize: 22, fontWeight: 800 }}>Realtime dashboard insights</div>
            <div style={styles.muted}>Monitor today’s activity, upcoming visits, and queue length at a glance.</div>
            <button style={{ ...styles.cta, marginTop: 12 }} onClick={() => navigate('/doctor/dashboard')}>View insights</button>
          </div>
          <div style={styles.splitBig}>
            <img style={styles.heroImg} alt="Sterile tray of surgical instruments" src="/images/or-tools-tray.jpg" onError={setFallback('https://images.unsplash.com/photo-1517148815972-69e3d3e29430?q=80&w=1600&auto=format&fit=crop')} />
          </div>
        </div>

        <div style={styles.splitSection}>
          <div style={styles.splitBig}>
            <img style={styles.heroImg} alt="Specialist surgeons performing procedure" src="/images/or-surgeons-procedure.jpg" onError={setFallback('https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1600&auto=format&fit=crop')} />
          </div>
          <div style={styles.splitText}>
            <div style={{ fontSize: 22, fontWeight: 800 }}>Find the right doctor</div>
            <div style={styles.muted}>Patients can browse specialties, join queues, and book appointments.</div>
            <button style={{ ...styles.cta, marginTop: 12 }} onClick={() => navigate('/patient/book')}>Book appointment</button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <div style={styles.container}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>Care flows smoothly with QTrack</div>
          <div style={{ marginTop: 6, color: '#94a3b8' }}>Queues, appointments, chat, and records in one place.</div>
          <button style={{ ...styles.cta, marginTop: 12 }} onClick={() => navigate('/auth/register')}>Create account</button>
        </div>
      </div>
    </div>
  )
}