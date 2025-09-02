'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './page.module.css';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // si en el futuro usás ?next=/algo, lo respetamos; por ahora cae en /profile
  const nextUrl = searchParams.get('next') || '/profile';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);

    // validaciones básicas
    if (!email.trim()) return setError('Ingresá tu email.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError('Email inválido.');
    if (password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres.');

    try {
      setSubmitting(true);

      // 🔌 Simulación de login (acá luego va el fetch/axios al backend)
      await new Promise((r) => setTimeout(r, 600));
      setOk('Login OK (simulado). Redirigiendo…');

      // ✅ Redirección a Mi Perfil (reemplaza el historial para que no vuelva al login con Back)
      router.replace(nextUrl);
    } catch {
      setError('No se pudo iniciar sesión.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <header className={styles.header}>
          <h1 className={styles.title}>Iniciar sesión</h1>
          <p className={styles.sub}>Entrá con tu cuenta de DuoFinder</p>
        </header>

        {error && <div className={styles.alertError}>{error}</div>}
        {ok && <div className={styles.alertOk}>{ok}</div>}

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
          />

          <label className={styles.label} htmlFor="password">Contraseña</label>
          <input
            id="password"
            className={styles.input}
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button className={styles.btn} type="submit" disabled={submitting}>
            {submitting ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>

        <footer className={styles.footer}>
          <span className={styles.muted}>
            ¿No tenés cuenta?{' '}
            <Link href="/register" className={styles.link}>
              Crear cuenta
            </Link>
          </span>
        </footer>
      </div>
    </div>
  );
}
