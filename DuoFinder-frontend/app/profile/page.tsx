'use client';

import { useEffect, useState } from 'react';
import styles from './page.module.css';

// Tipo simple de perfil (ajustaremos cuando conectemos a la API real)
type UserProfile = {
  id: string;
  username: string;
  email: string;
  birthdate: string; // YYYY-MM-DD
  bio?: string;
  games?: string;     // csv: "Valorant, LoL"
  interests?: string; // csv: "Ranked, Casual"
  discord?: string;   // ej: usuario#1234
};

// Clave para guardar/cargar mock
const LS_USER_KEY = 'df_user';

const DEFAULT_USER: UserProfile = {
  id: 'mock-1',
  username: 'PlayerOne',
  email: 'player@duofinder.gg',
  birthdate: '2000-01-01',
  bio: 'Busco dúo para ranked a la noche.',
  games: 'Valorant, League of Legends',
  interests: 'Ranked, Casual',
  discord: 'playerone#1234',
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_USER);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Cargar perfil simulado desde localStorage (si existe)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_USER_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as UserProfile;
        setProfile({ ...DEFAULT_USER, ...parsed });
      }
    } catch {
      // si hay algo corrupto, seguimos con DEFAULT_USER
    } finally {
      setLoading(false);
    }
  }, []);

  function onChange<K extends keyof UserProfile>(key: K, val: UserProfile[K]) {
    setProfile((p) => ({ ...p, [key]: val }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setOk(null);
    setError(null);

    // Validaciones mínimas
    if (!profile.username.trim()) return setError('Ingresá un nombre de usuario.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) return setError('Email inválido.');
    if (!profile.birthdate) return setError('Ingresá tu fecha de nacimiento.');

    try {
      setSaving(true);
      // 🔌 Simulación de "PUT /users/me"
      await new Promise((r) => setTimeout(r, 700));
      localStorage.setItem(LS_USER_KEY, JSON.stringify(profile));
      setOk('Cambios guardados (simulado).');
    } catch {
      setError('No se pudieron guardar los cambios.');
    } finally {
      setSaving(false);
    }
  }

  function onReset() {
    const raw = localStorage.getItem(LS_USER_KEY);
    setProfile(raw ? (JSON.parse(raw) as UserProfile) : DEFAULT_USER);
    setOk(null);
    setError(null);
  }

  function onLogout() {
    localStorage.removeItem(LS_USER_KEY);
    setProfile(DEFAULT_USER);
    setOk('Sesión cerrada (simulada).');
    setError(null);
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>Cargando…</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <header className={styles.header}>
          <h1 className={styles.title}>Mi Perfil</h1>
          <p className={styles.sub}>Estos datos luego vendrán de la base de datos</p>
        </header>

        {error && <div className={styles.alertError}>{error}</div>}
        {ok && <div className={styles.alertOk}>{ok}</div>}

        <form className={styles.form} onSubmit={onSubmit}>
          {/* Fila 1: Nombre + Email */}
          <div className={styles.row2}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="username">Nombre</label>
              <input
                id="username"
                className={styles.input}
                type="text"
                placeholder="Tu nick"
                value={profile.username}
                onChange={(e) => onChange('username', e.target.value)}
                maxLength={32}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="email">Email</label>
              <input
                id="email"
                className={styles.input}
                type="email"
                value={profile.email}
                onChange={(e) => onChange('email', e.target.value)}
              />
            </div>
          </div>

          {/* Fila 2: Fecha de nacimiento + Discord */}
          <div className={styles.row2}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="birthdate">Fecha de nacimiento</label>
              <input
                id="birthdate"
                className={styles.input}
                type="date"
                value={profile.birthdate}
                onChange={(e) => onChange('birthdate', e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="discord">Discord</label>
              <input
                id="discord"
                className={styles.input}
                type="text"
                placeholder="usuario#1234"
                value={profile.discord ?? ''}
                onChange={(e) => onChange('discord', e.target.value)}
              />
            </div>
          </div>

          {/* Bio (única) */}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              className={styles.textarea}
              rows={4}
              maxLength={3000}
              placeholder="Contá brevemente qué buscás…"
              value={profile.bio ?? ''}
              onChange={(e) => onChange('bio', e.target.value)}
            />
          </div>

          {/* Juegos */}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="games">Juegos (separados por coma)</label>
            <input
              id="games"
              className={styles.input}
              type="text"
              placeholder="Valorant, League of Legends"
              value={profile.games ?? ''}
              onChange={(e) => onChange('games', e.target.value)}
            />
          </div>

          {/* Intereses */}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="interests">Intereses (separados por coma)</label>
            <input
              id="interests"
              className={styles.input}
              type="text"
              placeholder="Ranked, Casual"
              value={profile.interests ?? ''}
              onChange={(e) => onChange('interests', e.target.value)}
            />
          </div>

          {/* Acciones */}
          <div className={styles.actions}>
            <button className={styles.btn} type="submit" disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
            <button
              className={`${styles.btn} ${styles.btnOutline}`}
              type="button"
              onClick={onReset}
            >
              Deshacer cambios
            </button>
            <button
              className={`${styles.btn} ${styles.btnOutline}`}
              type="button"
              onClick={onLogout}
            >
              Cerrar sesión (mock)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
