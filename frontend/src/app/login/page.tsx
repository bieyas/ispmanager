'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/shared/providers/auth-provider';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, login, loading } = useAuth();
  const [email, setEmail] = useState('admin@ispmanager.local');
  const [password, setPassword] = useState('Admin12345!');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, loading, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSubmitting(true);
    try {
      await login(email, password);
      router.replace('/dashboard');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-card">
        <h1 style={{ marginTop: 0 }}>Sign In</h1>
        <p className="muted" style={{ marginTop: '-4px', marginBottom: '16px' }}>
          Masuk untuk mengelola customer, billing, dan operasional dashboard.
        </p>
        <form onSubmit={handleSubmit} className="form-grid">
          <label>
            Email
            <input
              className="input"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label>
            Password
            <input
              className="input"
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <button type="submit" disabled={submitting} className="btn">
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        {errorMessage ? <p className="alert error">Error: {errorMessage}</p> : null}
      </section>
    </main>
  );
}
