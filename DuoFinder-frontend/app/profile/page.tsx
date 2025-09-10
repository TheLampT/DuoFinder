'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './page.module.css';

// helpers
function ageFrom(birth: string) {
  if (!birth) return null;
  const d = new Date(birth);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return Math.max(0, age);
}
function truncate(text: string, n = 100) {
  if (!text) return '';
  return text.length > n ? text.slice(0, n - 1) + '…' : text;
}

/* ===== Tipos ===== */
type GameSkill = { gameId: string; gameName: string; rank: string };
type UserProfile = {
  id: string;
  username: string;
  email: string;
  birthdate: string; // YYYY-MM-DD
  bio?: string;
  avatarUrl?: string;
  seeking?: string[];      // ["Casual","Competitivo"]
  games?: string;          // compat
  gameSkills?: GameSkill[];
  interests?: string;
  discord?: string;
};

/* ===== Catálogo mock ===== */
const GAME_OPTIONS: Array<{ id: string; name: string; ranks: string[] }> = [
  { id: 'valorant', name: 'Valorant', ranks: ['Hierro','Bronce','Plata','Oro','Platino','Diamante','Ascendente','Inmortal','Radiante'] },
  { id: 'lol',      name: 'League of Legends', ranks: ['Hierro','Bronce','Plata','Oro','Platino','Diamante','Maestro','Gran Maestro','Retador'] },
  { id: 'cs2',      name: 'CS2', ranks: ['Silver','Gold Nova','Master Guardian','Legendary Eagle','Supreme','Global Elite'] },
  { id: 'apex',     name: 'Apex Legends', ranks: ['Bronce','Plata','Oro','Platino','Diamante','Maestro','Depredador'] },
  { id: 'fortnite', name: 'Fortnite', ranks: ['Bronce','Plata','Oro','Platino','Diamante','Élite','Campeón','Unreal'] },
];
const SEEKING_OPTIONS = ['Casual', 'Competitivo'] as const;

/* ===== Storage ===== */
const LS_USER_KEY = 'df_user';

/* ===== Default ===== */
const DEFAULT_USER: UserProfile = {
  id: 'mock-1',
  username: 'PlayerOne',
  email: 'player@duofinder.gg',
  birthdate: '2000-01-01',
  bio: 'Busco dúo para ranked a la noche.',
  avatarUrl: '',
  seeking: ['Casual'],
  games: 'Valorant, League of Legends',
  gameSkills: [
    { gameId: 'valorant', gameName: 'Valorant', rank: 'Oro' },
    { gameId: 'lol', gameName: 'League of Legends', rank: 'Oro' },
  ],
  interests: 'Ranked, Casual',
  discord: 'playerone#1234',
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_USER);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  /* Cargar perfil mock */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_USER_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as UserProfile;
        setProfile({
          ...DEFAULT_USER,
          ...parsed,
          gameSkills: parsed.gameSkills ?? DEFAULT_USER.gameSkills,
          seeking: parsed.seeking ?? DEFAULT_USER.seeking,
        });
      }
    } catch {}
    setLoading(false);
  }, []);

  function onChange<K extends keyof UserProfile>(key: K, val: UserProfile[K]) {
    setProfile((p) => ({ ...p, [key]: val }));
  }

  /* Avatar */
  function pickAvatar() { fileInputRef.current?.click(); }
  function onAvatarFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange('avatarUrl', reader.result as string);
    reader.readAsDataURL(file);
    e.currentTarget.value = '';
  }
  function removeAvatar() { onChange('avatarUrl', ''); }

  /* Juegos */
  function toggleGame(gameId: string) {
    const meta = GAME_OPTIONS.find((g) => g.id === gameId)!;
    setProfile((p) => {
      const exists = (p.gameSkills ?? []).some((g) => g.gameId === gameId);
      const next = exists
        ? (p.gameSkills ?? []).filter((g) => g.gameId !== gameId)
        : [...(p.gameSkills ?? []), { gameId: meta.id, gameName: meta.name, rank: meta.ranks[0] }];
      return { ...p, gameSkills: next, games: next.map((g) => g.gameName).join(', ') };
    });
  }
  function setRank(gameId: string, rank: string) {
    setProfile((p) => ({
      ...p,
      gameSkills: (p.gameSkills ?? []).map((g) => g.gameId === gameId ? { ...g, rank } : g),
    }));
  }

  /* Buscando (multi) */
  function toggleSeeking(option: typeof SEEKING_OPTIONS[number]) {
    setProfile((p) => {
      const set = new Set(p.seeking ?? []);
      set.has(option) ? set.delete(option) : set.add(option);
      return { ...p, seeking: Array.from(set) };
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setOk(null); setError(null);
    if (!profile.username.trim()) return setError('Ingresá un nombre de usuario.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) return setError('Email inválido.');
    if (!profile.birthdate) return setError('Ingresá tu fecha de nacimiento.');

    try {
      setSaving(true);
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
    setOk(null); setError(null);
  }
  function onLogout() {
    localStorage.removeItem(LS_USER_KEY);
    setProfile(DEFAULT_USER);
    setOk('Sesión cerrada (simulada).'); setError(null);
  }

  if (loading) return (
    <div className={styles.page}><div className={styles.card}>Cargando…</div></div>
  );

  const selectedGameIds = new Set((profile.gameSkills ?? []).map((g) => g.gameId));
  const selectedSeeking = new Set(profile.seeking ?? []);

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {/* HERO */}
        <header className={styles.hero}>
          <div
            className={styles.heroBg}
            style={{ backgroundImage: "url(https://images.unsplash.com/photo-1535223289827-42f1e9919769?q=80&w=1600&auto=format&fit=crop)" }}
          />
          <div className={styles.heroOverlay} />
          <div className={styles.heroContent}>
            <img src="/favicon.ico" alt="DuoFinder" className={styles.heroLogo} />
            <h1 className={styles.title}>Mi Perfil</h1>
            <p className={styles.heroSub}>
              Configurá tu perfil gamer. Estos datos luego vendrán de la base de datos.
            </p>
            <div className={styles.heroBadges}>
              {(profile.seeking ?? []).map((opt) => (
                <span key={opt} className={`${styles.badge} ${styles.badgePrimary}`}>{opt}</span>
              ))}
              {(profile.gameSkills ?? []).slice(0, 3).map((g) => (
                <span key={g.gameId} className={styles.badge}>{g.gameName} • {g.rank}</span>
              ))}
            </div>
          </div>
        </header>

        {error && <div className={styles.alertError}>{error}</div>}
        {ok && <div className={styles.alertOk}>{ok}</div>}

        {/* ===== GRID: izquierda formulario / derecha preview (sticky) ===== */}
        <div className={styles.grid}>
          {/* IZQUIERDA: FORM COMPLETO */}
          <form className={styles.form} onSubmit={onSubmit}>
            {/* Avatar */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Avatar</h3>
              <div className={styles.avatarWrap}>
                <div className={styles.avatar}>
                  {profile.avatarUrl
                    ? <img src={profile.avatarUrl} alt="Avatar" />
                    : <div className={styles.avatarInitial}>{(profile.username || 'U').substring(0,1).toUpperCase()}</div>}
                </div>
                <div>
                  <div className={styles.avatarActions}>
                    <button type="button" className={styles.avatarBtn} onClick={pickAvatar}>Cambiar</button>
                    <button type="button" className={styles.avatarBtn} onClick={removeAvatar}>Quitar</button>
                  </div>
                  <div className={styles.hint}>Recomendado: 512×512 px (JPG/PNG)</div>
                  <input
                    ref={fileInputRef}
                    className={styles.fileInput}
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={onAvatarFile}
                  />
                </div>
              </div>
            </div>

            {/* Datos básicos */}
            <div className={styles.section}>
              <div className={styles.row2}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="username">Nombre</label>
                  <input id="username" className={styles.input} type="text"
                         value={profile.username} onChange={(e)=>onChange('username', e.target.value)} maxLength={32}/>
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="email">Email</label>
                  <input id="email" className={styles.input} type="email"
                         value={profile.email} onChange={(e)=>onChange('email', e.target.value)}/>
                </div>
              </div>
              <div className={styles.row2}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="birthdate">Fecha de nacimiento</label>
                  <input id="birthdate" className={styles.input} type="date"
                         value={profile.birthdate} onChange={(e)=>onChange('birthdate', e.target.value)}/>
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="discord">Discord</label>
                  <input id="discord" className={styles.input} type="text" placeholder="usuario#1234"
                         value={profile.discord ?? ''} onChange={(e)=>onChange('discord', e.target.value)}/>
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className={styles.section}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="bio">Bio</label>
                <textarea id="bio" className={styles.textarea} rows={4} maxLength={3000}
                          value={profile.bio ?? ''} onChange={(e)=>onChange('bio', e.target.value)}
                          placeholder="Contá brevemente qué buscás…"/>
                <div className={styles.counter}>{(profile.bio ?? '').length}/3000</div>
              </div>
            </div>

            {/* Buscando */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Buscando</h3>
              <div className={styles.chips}>
                {SEEKING_OPTIONS.map((opt) => (
                  <button key={opt} type="button"
                          className={`${styles.chip} ${selectedSeeking.has(opt) ? styles.chipSelected : ''}`}
                          onClick={()=>toggleSeeking(opt)}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Juegos + rangos */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Juegos & rangos</h3>
              <div className={styles.chips}>
                {GAME_OPTIONS.map((g)=>(
                  <button key={g.id} type="button"
                          className={`${styles.chip} ${selectedGameIds.has(g.id) ? styles.chipSelected : ''}`}
                          onClick={()=>toggleGame(g.id)}>
                    {g.name}
                  </button>
                ))}
              </div>

              {(profile.gameSkills?.length ?? 0) > 0 && (
                <div className={styles.ranks}>
                  {(profile.gameSkills ?? []).map((s)=> {
                    const ranks = GAME_OPTIONS.find((g)=>g.id===s.gameId)?.ranks ?? [];
                    return (
                      <div key={s.gameId} className={styles.rankRow}>
                        <span className={styles.rankLabel}>{s.gameName}</span>
                        <select className={styles.rankSelect} value={s.rank} onChange={(e)=>setRank(s.gameId, e.target.value)}>
                          {ranks.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <button type="button" className={styles.remove} onClick={()=>toggleGame(s.gameId)}>Quitar</button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Acciones */}
            <div className={styles.actions}>
              <button className={styles.btn} type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Guardar cambios'}</button>
              <button className={`${styles.btn} ${styles.btnOutline}`} type="button" onClick={onReset}>Deshacer cambios</button>
              <button className={`${styles.btn} ${styles.btnOutline}`} type="button" onClick={onLogout}>Cerrar sesión (mock)</button>
            </div>
          </form>

          {/* DERECHA: PREVIEW sticky */}
          <aside className={styles.previewCol}>
            <div className={`${styles.previewCard} ${styles.sticky}`}>
              <div className={styles.previewTop}>
                {profile.avatarUrl ? (
                  <img className={styles.previewImg} src={profile.avatarUrl} alt="Avatar" />
                ) : (
                  <div className={`${styles.previewImg} ${styles.previewFallback}`}>
                    {(profile.username || 'U').substring(0,1).toUpperCase()}
                  </div>
                )}
                <div className={styles.previewLogo}>
                  <img src="/favicon.ico" alt="DuoFinder" />
                </div>
              </div>
              <div className={styles.previewInfo}>
                <h3 className={styles.previewTitle}>
                  {profile.username || 'Usuario'}{ageFrom(profile.birthdate) ? `, ${ageFrom(profile.birthdate)}` : ''}
                </h3>
                <p className={styles.previewBio}>{truncate(profile.bio ?? 'Sin bio por ahora.')}</p>
                <div className={styles.previewPills}>
                  {(profile.seeking ?? []).map(opt => (
                    <span key={opt} className={`${styles.pill} ${styles.pillPrimary}`}>{opt}</span>
                  ))}
                  {(profile.gameSkills ?? []).slice(0,3).map(g => (
                    <span key={g.gameId} className={styles.pill}>{g.gameName}</span>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
