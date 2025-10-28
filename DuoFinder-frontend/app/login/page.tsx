'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './page.module.css';
import { authService } from '../../lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get('next') || '/profile';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim()) return setError('Ingresá tu email.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError('Email inválido.');
    if (password.length < 4) return setError('La contraseña debe tener al menos 6 caracteres.');

    try {
      setSubmitting(true);

      // Use the typed auth service
      const result = await authService.login(email, password);
      console.log('Login successful:', result);
      
      // Store the token for future API calls
      if (typeof window !== 'undefined') {
        localStorage.setItem('access_token', result.access_token);
        localStorage.setItem('token_type', result.token_type);
      }
      
      // Redirect to profile page on success
      router.replace(nextUrl);
      
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'No se pudo iniciar sesión. Intentalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.shell}>
      <div className={styles.card}>
        <section className={styles.left}>
          <div className={styles.logoRow}>
            <img src="/favicon.ico" alt="DuoFinder" />
            <span>DuoFinder</span>
          </div>

          <h1 className={styles.welcome}>¡Bienvenido!</h1>
          <p className={styles.sub}>
            Iniciá sesión para volver a tus matches y recomendaciones.
          </p>

          {error && <div className={styles.alert}>{error}</div>}

          <form className={styles.form} onSubmit={onSubmit}>
            <label className={styles.label} htmlFor="email">Email</label>
            <input
              id="email"
              className={styles.input}
              type="email"
              autoComplete="email"
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label className={styles.label} htmlFor="password">Contraseña</label>
            <input
              id="password"
              className={styles.input}
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              minLength={4}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button className={styles.btn} type="submit" disabled={submitting}>
              {submitting ? 'Ingresando…' : 'SIGN IN'}
            </button>
          </form>

          <p className={styles.small}>
            ¿No tenés cuenta?{' '}
            <Link href="/register" className={styles.link}>Crear cuenta</Link>
          </p>
        </section>

        <aside
          className={styles.right}
          style={{ backgroundImage: `url(https://picsum.photos/id/1011/1400/1000)` }}
          aria-hidden
        >
          <div className={styles.brandMark}>
            <img src="/favicon.ico" alt="" />
            <strong>DuoFinder</strong>
            <p>Encontrá tu dúo ideal para jugar.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}