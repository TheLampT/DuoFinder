'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function RegisterPage() {
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
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
    setError(null);

    const v = validate();
    if (v) return setError(v);

    try {
      setSubmitting(true);
      // Simulación (acá después va tu POST /auth/register)
      await new Promise((r) => setTimeout(r, 700));
      // Redirigimos a login (podés cambiar a /profile si querés auto-login luego)
      router.replace('/login');
    } catch {
      setError('No se pudo crear la cuenta.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.shell}>
      <div className={styles.card}>
        {/* Panel izquierdo: formulario */}
        <section className={styles.left}>
          <div className={styles.logoRow}>
            <img src="/favicon.ico" alt="DuoFinder" />
            <span>DuoFinder</span>
          </div>

          <h1 className={styles.welcome}>Crear cuenta</h1>
          <p className={styles.sub}>
            Unite para encontrar tu dúo ideal y empezar a jugar.
          </p>

          {error && <div className={styles.alert}>{error}</div>}

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
              {submitting ? 'Creando…' : 'SIGN UP'}
            </button>
          </form>

          <p className={styles.small}>
            ¿Ya tenés cuenta?{' '}
            <Link href="/login" className={styles.link}>Iniciar sesión</Link>
          </p>
        </section>

        {/* Panel derecho: imagen + gradiente */}
        <aside
          className={styles.right}
          style={{ backgroundImage: `url(https://picsum.photos/id/1015/1400/1000)` }}
          aria-hidden
        >
          <div className={styles.brandMark}>
            <img src="/favicon.ico" alt="" />
            <strong>DuoFinder</strong>
            <p>Sumate y empezá a matchear en minutos.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
