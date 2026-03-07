import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="login-shell">
      <section className="login-card">
        <h1 style={{ marginTop: 0 }}>ISP Manager</h1>
        <p className="muted">
          Platform operasional ISP untuk autentikasi, customer, dan workflow dasar.
        </p>
        <div className="controls" style={{ marginTop: '14px' }}>
          <Link className="btn" href="/login">
            Go to Login
          </Link>
          <Link className="btn secondary" href="/dashboard">
            Open Dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
