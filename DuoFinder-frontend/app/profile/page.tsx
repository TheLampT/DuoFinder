'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { profileService, UserProfile, UpdateProfileRequest } from '../../lib/auth';

// Helpers
function truncate(text: string, n = 100) {
  if (!text) return '';
  return text.length > n ? text.slice(0, n - 1) + '…' : text;
}

// Game options for the chips
const GAME_OPTIONS: Array<{ id: string; name: string; ranks: string[] }> = [
  { id: 'valorant', name: 'Valorant', ranks: ['Hierro','Bronce','Plata','Oro','Platino','Diamante','Ascendente','Inmortal','Radiante'] },
  { id: 'lol', name: 'League of Legends', ranks: ['Hierro','Bronce','Plata','Oro','Platino','Diamante','Maestro','Gran Maestro','Retador'] },
  { id: 'cs2', name: 'CS2', ranks: ['Silver','Gold Nova','Master Guardian','Legendary Eagle','Supreme','Global Elite'] },
  { id: 'apex', name: 'Apex Legends', ranks: ['Bronce','Plata','Oro','Platino','Diamante','Maestro','Depredador'] },
  { id: 'fortnite', name: 'Fortnite', ranks: ['Bronce','Plata','Oro','Platino','Diamante','Élite','Campeón','Unreal'] },
];

const SEEKING_OPTIONS = ['Casual', 'Competitivo'] as const;

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load profile from API
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const userProfile = await profileService.getProfile();
        setProfile(userProfile);
      } catch (err: any) {
        console.error('Failed to load profile:', err);
        setError(err.message || 'Failed to load profile');
        
        // If unauthorized, redirect to login
        if (err.message.includes('Authentication') || err.message.includes('401')) {
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [router]);

  function onChange<K extends keyof UserProfile>(key: K, val: UserProfile[K]) {
    if (profile) {
      setProfile((p) => ({ ...p!, [key]: val }));
    }
  }

  // Update game skill level
  function updateGameSkill(gameId: number, field: string, value: any) {
    if (!profile || !editing) return;
    
    setProfile(prev => {
      if (!prev?.games) return prev;
      
      const updatedGames = prev.games.map(game => 
        game.game_id === gameId ? { ...game, [field]: value } : game
      );
      
      return { ...prev, games: updatedGames };
    });
  }

  // Game selection handlers (for future implementation)
  function toggleGame(gameId: string) {
    if (!editing || !profile) return;
    console.log('Game toggle would be implemented here');
  }

  function setRank(gameId: string, rank: string) {
    if (!editing || !profile) return;
    console.log('Rank update would be implemented here');
  }

  // Seeking handlers (for future implementation)
  function toggleSeeking(option: typeof SEEKING_OPTIONS[number]) {
    if (!editing || !profile) return;
    console.log('Seeking update would be implemented here');
  }

  // Avatar handlers
  function pickAvatar() { if (editing) fileInputRef.current?.click(); }
  function onAvatarFile(e: React.ChangeEvent<HTMLInputElement>) {
    console.log('Image upload would be implemented here');
    e.currentTarget.value = '';
  }
  function removeAvatar() { 
    if (editing) {
      console.log('Avatar removal would be implemented here');
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing || !profile) return;
    
    setOk(null);
    setError(null);
    
    if (!profile.username.trim()) return setError('Ingresá un nombre de usuario.');
    if (!profile.email.trim()) return setError('Ingresá tu email.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) return setError('Email inválido.');

    try {
      setSaving(true);

      const updateData: UpdateProfileRequest = {
        username: profile.username,
        bio: profile.bio || '',
        discord: profile.discord || '',
        server: profile.server || '',
        tracker: profile.tracker || '',
        games: profile.games?.map(game => ({
          game_id: game.game_id,
          skill_level: game.skill_level,
          is_ranked: game.is_ranked,
          game_rank_local_id: game.game_rank_local_id
        }))
      };

      const result = await profileService.updateProfile(updateData);
      setOk(result.message || 'Perfil actualizado exitosamente');
      setEditing(false);
      
      // Refresh profile data
      const updatedProfile = await profileService.getProfile();
      setProfile(updatedProfile);
      
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      setError(err.message || 'No se pudieron guardar los cambios.');
    } finally {
      setSaving(false);
    }
  }

  function onReset() {
    if (!editing) return;
    profileService.getProfile().then(setProfile).catch(console.error);
    setOk(null);
    setError(null);
  }

  async function onLogout() {
    try {
      localStorage.removeItem('access_token');
      localStorage.removeItem('token_type');
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  }

  if (loading) {
    return <div className={styles.page}><div className={styles.card}>Cargando…</div></div>;
  }

  if (!profile) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.alertError}>
            Error al cargar el perfil. <button onClick={() => window.location.reload()}>Reintentar</button>
          </div>
        </div>
      </div>
    );
  }

  const selectedGameIds = new Set((profile.games ?? []).map((g) => g.game_id?.toString() ?? ''));
  const selectedSeeking = new Set(['Competitivo']); // Default for now

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
              Personalizá tu perfil para encontrar el dúo ideal. Recordá guardar los cambios antes de salir!
            </p>
            <div className={styles.heroBadges}>
              <span className={`${styles.badge} ${styles.badgePrimary}`}>Activo</span>
              {profile.age && <span className={styles.badge}>{profile.age} años</span>}
              {profile.server && <span className={styles.badge}>Servidor: {profile.server}</span>}
            </div>
          </div>
        </header>

        {error && <div className={styles.alertError}>{error}</div>}
        {ok && <div className={styles.alertOk}>{ok}</div>}

        {/* Barra de edición */}
        <div className={styles.editBar}>
          <span className={`${styles.modeTag} ${editing ? styles.modeEdit : ''}`}>
            {editing ? 'Editando' : 'Solo lectura'}
          </span>
          <div className={styles.editActions}>
            {!editing ? (
              <button type="button" className={styles.btn} onClick={() => setEditing(true)}>
                Editar perfil
              </button>
            ) : (
              <>
                <button 
                  type="button" 
                  className={`${styles.btn} ${styles.btnOutline}`} 
                  onClick={() => { onReset(); setEditing(false); }}
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  className={styles.btn} 
                  onClick={onSubmit as any} 
                  disabled={saving}
                >
                  {saving ? 'Guardando…' : 'Guardar'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* GRID 2 columnas */}
        <div className={styles.grid}>
          {/* IZQUIERDA: FORM */}
          <form className={styles.form} onSubmit={onSubmit}>
            {/* Avatar */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Avatar</h3>
              <div className={styles.avatarWrap}>
                <div className={styles.avatar}>
                  <div className={styles.avatarInitial}>
                    {(profile.username || 'U').substring(0, 1).toUpperCase()}
                  </div>
                </div>
                <div>
                  <div className={styles.avatarActions}>
                    <button 
                      type="button" 
                      className={styles.avatarBtn} 
                      onClick={pickAvatar} 
                      disabled={!editing}
                    >
                      Cambiar
                    </button>
                    <button 
                      type="button" 
                      className={styles.avatarBtn} 
                      onClick={removeAvatar} 
                      disabled={!editing}
                    >
                      Quitar
                    </button>
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
                  <label className={styles.label} htmlFor="username">Usuario</label>
                  <input 
                    id="username" 
                    className={styles.input} 
                    type="text"
                    placeholder="Tu nick"
                    value={profile.username} 
                    onChange={(e) => onChange('username', e.target.value)}
                    maxLength={32} 
                    disabled={!editing}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="email">Email</label>
                  <input 
                    id="email" 
                    className={styles.input} 
                    type="email"
                    autoComplete="email"
                    placeholder="tu@correo.com"
                    value={profile.email} 
                    onChange={(e) => onChange('email', e.target.value)}
                    disabled={!editing}
                  />
                </div>
              </div>
              <div className={styles.row2}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="discord">Discord</label>
                  <input 
                    id="discord" 
                    className={styles.input} 
                    type="text" 
                    placeholder="usuario#1234"
                    value={profile.discord || ''} 
                    onChange={(e) => onChange('discord', e.target.value)}
                    disabled={!editing}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="server">Servidor</label>
                  <input 
                    id="server" 
                    className={styles.input} 
                    type="text" 
                    placeholder="Ej: LAS, NA, EU"
                    value={profile.server || ''} 
                    onChange={(e) => onChange('server', e.target.value)}
                    disabled={!editing}
                  />
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="tracker">Tracker</label>
                <input 
                  id="tracker" 
                  className={styles.input} 
                  type="text" 
                  placeholder="https://tracker.gg/valorant"
                  value={profile.tracker || ''} 
                  onChange={(e) => onChange('tracker', e.target.value)}
                  disabled={!editing}
                />
              </div>
            </div>

            {/* Bio */}
            <div className={styles.section}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="bio">Bio</label>
                <textarea 
                  id="bio" 
                  className={styles.textarea} 
                  rows={4} 
                  maxLength={3000}
                  value={profile.bio || ''} 
                  onChange={(e) => onChange('bio', e.target.value)}
                  placeholder="Contá brevemente qué buscás…" 
                  disabled={!editing}
                />
                <div className={styles.counter}>{(profile.bio || '').length}/3000</div>
              </div>
            </div>

            {/* Acciones */}
            <div className={styles.actions}>
              <button className={styles.btn} type="submit" disabled={!editing || saving}>
                {saving ? 'Guardando…' : 'Guardar cambios'}
              </button>
              <button 
                className={`${styles.btn} ${styles.btnOutline}`} 
                type="button" 
                onClick={onReset} 
                disabled={!editing}
              >
                Deshacer cambios
              </button>
              <button 
                className={`${styles.btn} ${styles.btnOutline}`} 
                type="button" 
                onClick={onLogout}
              >
                Cerrar sesión
              </button>
            </div>
          </form>

          {/* DERECHA: PREVIEW + JUEGOS & RANGOS */}
          <aside className={styles.previewCol}>
            {/* PREVIEW */}
            <div className={`${styles.previewCard} ${styles.sticky}`}>
              <div className={styles.previewTop}>
                <div className={`${styles.previewImg} ${styles.previewFallback}`}>
                  {(profile.username || 'U').substring(0, 1).toUpperCase()}
                </div>
              </div>
              <div className={styles.previewInfo}>
                <h3 className={styles.previewTitle}>
                  {profile.username || 'Usuario'}{profile.age ? `, ${profile.age}` : ''}
                </h3>
                <p className={styles.previewBio}>{truncate(profile.bio || 'Sin bio por ahora.')}</p>
                <div className={styles.previewPills}>
                  <span className={`${styles.pill} ${styles.pillPrimary}`}>Activo</span>
                  {profile.discord && <span className={styles.pill}>Discord: {profile.discord}</span>}
                  {profile.server && <span className={styles.pill}>Servidor: {profile.server}</span>}
                </div>
              </div>
            </div>

            {/* JUEGOS & RANGOS */}
            <section className={styles.sideCard}>
              <h3 className={styles.sectionTitle}>Juegos & rangos</h3>

              {(profile.games?.length ?? 0) > 0 ? (
                <div className={styles.ranks}>
                  {(profile.games ?? []).map((game) => (
                    <div key={game.game_id} className={styles.rankRow}>
                      <span className={styles.rankLabel}>{game.game_name}</span>
                      <span className={styles.rankSelect}>
                        {game.skill_level} {game.is_ranked ? '⚡' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.hint}>
                  Todavía no agregaste juegos a tu perfil. Editá tu perfil para agregar tus juegos y rangos.
                </p>
              )}
            </section>

            <div className={styles.noteReadOnly}>
              {editing ? 'Estás editando tu perfil.' : 'Tocá "Editar perfil" para modificar tus datos.'}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}