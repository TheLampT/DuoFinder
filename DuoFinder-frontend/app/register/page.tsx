'use client';

import Link from 'next/link';
import { useState } from 'react';
import styles from './page.module.css';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [birthdate, setBirthdate] = useState(''); // YYYY-MM-DD
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function validate(): string | null {
    if (!username.trim()) return 'Ingresá un nombre de usuario.';
    if (!email.trim()) return 'Ingresá tu email.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Email inválido.';
    if (password.length < 6) return 'La contraseña debe tener al menos 6 caracteres.';
    if (!birthdate) return 'Ingresá tu fecha de nacimiento.';
    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setOk(null);
    setError(null);

    const v = validate();
    if (v) return setError(v);

    try {
      setSubmitting(true);
      // Simulación (acá después va el POST /auth/register)
      await new Promise((r) => setTimeout(r, 800));
      setOk('Registro OK (simulado). Cuando esté el backend, conectamos y redirigimos.');
      // Ej: router.push('/login') o auto-login si el backend lo hace
    } catch {
      setError('No se pudo registrar la cuenta.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <header className={styles.header}>
          <h1 className={styles.title}>Crear cuenta</h1>
          <p className={styles.sub}>Registrate para encontrar tu dúo</p>
        </header>

        {error && <div className={styles.alertError}>{error}</div>}
        {ok && <div className={styles.alertOk}>{ok}</div>}

        <form className={styles.form} onSubmit={onSubmit}>
          <label className={styles.label} htmlFor="username">Usuario</label>
          <input
            id="username"
            className={styles.input}
            type="text"
            placeholder="Tu nick"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={32}
          />

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
            autoComplete="new-password"
            placeholder="••••••••"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <label className={styles.label} htmlFor="birthdate">Fecha de nacimiento</label>
          <input
            id="birthdate"
            className={styles.input}
            type="date"
            value={birthdate}
            onChange={(e) => setBirthdate(e.target.value)}
          />

          <button className={styles.btn} type="submit" disabled={submitting}>
            {submitting ? 'Creando…' : 'Crear cuenta'}
          </button>
        </form>

        <footer className={styles.footer}>
          <span className={styles.muted}>
            ¿Ya tenés cuenta?{' '}
            <Link href="/login" className={styles.link}>
              Iniciar sesión
            </Link>
          </span>
        </footer>
      </div>
    </div>
  );
}
