'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { apiService } from '@/lib/apiService';
import { UserProfile, UpdateProfileRequest, UserGame } from '@/lib/types';
import Image from 'next/image';

// Helpers
function truncate(text: string, n = 100) {
  if (!text) return '';
  return text.length > n ? text.slice(0, n - 1) + '…' : text;
}

// Interface for the API game response
interface ApiGame {
  id: number;
  name: string;
  description: string;
  released_year: string;
  ranks: Array<{
    local_rank_id: number;
    rank_name: string;
    tier_name: string;
    division_label: string | null;
    division_number: number | null;
    rank_order: number;
  }>;
}

// Avatares fijos (solo frontend, se guardan en localStorage)
const AVATAR_STORAGE_KEY = 'duofinder_profile_avatar';

const PRESET_AVATARS = [
  {
    id: 'laptop',
    url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'keyboard',
    url: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'controller',
    url: 'https://images.unsplash.com/photo-1619382581049-c87bedd3b479?q=80&w=735&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  },
  {
    id: 'setup',
    url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'arcade',
    url: 'https://images.unsplash.com/photo-1526498460520-4c246339dccb?auto=format&fit=crop&w=800&q=80',
  },
];

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [availableGames, setAvailableGames] = useState<ApiGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingGames, setLoadingGames] = useState(false);
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  // Avatar local (solo frontend)
  const [avatarId, setAvatarId] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Cargar perfil desde API
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const userProfile = await apiService.getProfile();
        console.log('Loaded profile:', userProfile);

        if (userProfile.games) {
          userProfile.games = userProfile.games.map((game) => ({
            ...game,
            skill_level: game.skill_level || '',
            game_rank_local_id: game.game_rank_local_id || 0,
            rank_name: game.rank_name || '',
          }));
        }

        setProfile(userProfile);
      } catch (err: unknown) {
        console.error('Failed to load profile:', err);
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to load profile';
        setError(errorMessage);

        if (
          errorMessage.includes('Authentication') ||
          errorMessage.includes('401')
        ) {
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [router]);

  // Cargar avatar desde localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(AVATAR_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { id: string | null; url: string | null };
      setAvatarId(parsed.id ?? null);
      setAvatarUrl(parsed.url ?? null);
    } catch {
      // ignorar errores de parseo
    }
  }, []);

  useEffect(() => {
    console.log('Profile updated:', profile);
  }, [profile]);

  useEffect(() => {
    console.log('Available games updated:', availableGames);
  }, [availableGames]);

  // Cargar juegos disponibles al entrar en modo edición
  const loadAvailableGames = async () => {
    try {
      setLoadingGames(true);
      const response = await fetch('https://duofinder-1.onrender.com/api/games');
      if (!response.ok) {
        throw new Error('Failed to fetch games');
      }
      const games: ApiGame[] = await response.json();
      setAvailableGames(games);
    } catch (err: unknown) {
      console.error('Failed to load games:', err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'No se pudieron cargar los juegos disponibles.';
      setError(errorMessage);
    } finally {
      setLoadingGames(false);
    }
  };

  const handleEditClick = async () => {
    setEditing(true);
    await loadAvailableGames();
  };

  function onChange<K extends keyof UserProfile>(key: K, val: UserProfile[K]) {
    if (profile) {
      setProfile((p) => ({ ...p!, [key]: val }));
    }
  }

  // Update game rank
  function updateGameRank(
    gameId: number,
    rankName: string,
    localRankId: number
  ) {
    if (!profile || !editing) return;

    setProfile((prev) => {
      if (!prev?.games) return prev;

      const updatedGames = prev.games.map((game) => {
        if (game.game_id === gameId) {
          return {
            ...game,
            rank_name: rankName,
            game_rank_local_id: localRankId,
          };
        }
        return game;
      });

      return { ...prev, games: updatedGames };
    });
  }

  function updateGameSkillLevel(gameId: number, skillLevel: string) {
    if (!profile || !editing) return;

    setProfile((prev) => {
      if (!prev?.games) return prev;

      const updatedGames = prev.games.map((game) =>
        game.game_id === gameId
          ? {
              ...game,
              skill_level: skillLevel,
            }
          : game
      );

      return { ...prev, games: updatedGames };
    });
  }

  // Add a new game to profile
  function addGame(gameId: number) {
    if (!profile || !editing) return;

    const gameOption = availableGames.find((g) => g.id === gameId);
    if (!gameOption) return;

    if (profile.games?.some((g) => g.game_id === gameId)) {
      console.log('Game already exists:', gameId);
      return;
    }

    const defaultRank = gameOption.ranks[0];
    const newGame: UserGame = {
      game_id: gameId,
      game_name: gameOption.name,
      skill_level: '',
      is_ranked: false,
      game_rank_local_id: undefined,
      rank_name: defaultRank?.rank_name || 'Unranked',
    };

    setProfile((prev) => ({
      ...prev!,
      games: [...(prev?.games || []), newGame],
    }));
  }

  // Toggle ranked status for a game
  function toggleRanked(gameId: number) {
    if (!profile || !editing) return;

    setProfile((prev) => {
      if (!prev?.games) return prev;

      const updatedGames = prev.games.map((game) => {
        if (game.game_id === gameId) {
          const newIsRanked = !game.is_ranked;

          if (newIsRanked) {
            const gameData = availableGames.find((g) => g.id === gameId);
            const defaultRank = gameData?.ranks[0];

            return {
              ...game,
              is_ranked: newIsRanked,
              game_rank_local_id:
                game.game_rank_local_id || defaultRank?.local_rank_id || 0,
              rank_name:
                game.rank_name || defaultRank?.rank_name || 'Unranked',
              skill_level: game.skill_level || defaultRank?.rank_name || '',
            };
          } else {
            return {
              ...game,
              is_ranked: newIsRanked,
              game_rank_local_id: undefined,
              rank_name: undefined,
            };
          }
        }
        return game;
      });

      return { ...prev, games: updatedGames };
    });
  }

  // Selección de avatar (solo frontend)
  function selectAvatar(avatar: { id: string; url: string } | null) {
    if (!editing) return;

    const newId = avatar?.id ?? null;
    const newUrl = avatar?.url ?? null;

    setAvatarId(newId);
    setAvatarUrl(newUrl);

    if (typeof window !== 'undefined') {
      localStorage.setItem(
        AVATAR_STORAGE_KEY,
        JSON.stringify({ id: newId, url: newUrl })
      );
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing || !profile) return;

    setOk(null);
    setError(null);

    if (!profile.username.trim())
      return setError('Ingresá un nombre de usuario.');
    if (!profile.email.trim()) return setError('Ingresá tu email.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email))
      return setError('Email inválido.');

    try {
      setSaving(true);

      const updateData: UpdateProfileRequest = {
        username: profile.username,
        bio: profile.bio || '',
        discord: profile.discord || '',
        server: profile.server || '',
        tracker: profile.tracker || '',
        games: profile.games?.map((game) => {
          const baseData = {
            game_id: game.game_id,
            skill_level: game.skill_level || '',
            is_ranked: game.is_ranked,
          };

          if (game.is_ranked && game.game_rank_local_id) {
            return {
              ...baseData,
              game_rank_local_id: game.game_rank_local_id,
            };
          }

          return baseData;
        }),
      };

      const result = await apiService.updateProfile(updateData);
      setOk(result.message || 'Perfil actualizado exitosamente');
      setEditing(false);

      const updatedProfile = await apiService.getProfile();
      setProfile(updatedProfile);
    } catch (err: unknown) {
      console.error('Failed to update profile:', err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'No se pudieron guardar los cambios.';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  }

  function onReset() {
    if (!editing) return;
    apiService
      .getProfile()
      .then(setProfile)
      .catch(console.error);
    setOk(null);
    setError(null);
  }

  function removeGame(gameId: number) {
    if (!profile || !editing) return;

    setProfile((prev) => ({
      ...prev!,
      games: prev?.games?.filter((g) => g.game_id !== gameId) || [],
    }));
  }

  async function onLogout() {
    try {
      localStorage.removeItem('access_token');
      localStorage.removeItem('token_type');
      router.push('/login');
    } catch (err: unknown) {
      console.error('Logout error:', err);
    }
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>Cargando…</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.alertError}>
            Error al cargar el perfil.{' '}
            <button onClick={() => window.location.reload()}>Reintentar</button>
          </div>
        </div>
      </div>
    );
  }

  const selectedGameIds = new Set(
    profile.games?.map((g) => g.game_id.toString()) ?? []
  );
  const availableGamesToAdd = availableGames.filter(
    (game) => !selectedGameIds.has(game.id.toString())
  );

  const handleSaveClick = async (): Promise<void> => {
    if (!editing || !profile) return;

    setOk(null);
    setError(null);

    if (!profile.username.trim())
      return setError('Ingresá un nombre de usuario.');
    if (!profile.email.trim()) return setError('Ingresá tu email.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email))
      return setError('Email inválido.');

    try {
      setSaving(true);

      const updateData: UpdateProfileRequest = {
        username: profile.username,
        bio: profile.bio || '',
        discord: profile.discord || '',
        server: profile.server || '',
        tracker: profile.tracker || '',
        games: profile.games?.map((game) => {
          const baseData = {
            game_id: game.game_id,
            skill_level: game.skill_level || '',
            is_ranked: game.is_ranked,
          };

          if (game.is_ranked && game.game_rank_local_id) {
            return {
              ...baseData,
              game_rank_local_id: game.game_rank_local_id,
            };
          }

          return baseData;
        }),
      };

      const result = await apiService.updateProfile(updateData);
      setOk(result.message || 'Perfil actualizado exitosamente');
      setEditing(false);

      const updatedProfile = await apiService.getProfile();
      setProfile(updatedProfile);
    } catch (err: unknown) {
      console.error('Failed to update profile:', err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'No se pudieron guardar los cambios.';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const initialLetter = (profile.username || 'U')
    .substring(0, 1)
    .toUpperCase();

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {/* HERO */}
        <header className={styles.hero}>
          <div
            className={styles.heroBg}
            style={{
              backgroundImage:
                'url(https://images.unsplash.com/photo-1535223289827-42f1e9919769?q=80&w=1600&auto=format&fit=crop)',
            }}
          />
          <div className={styles.heroOverlay} />
          <div className={styles.heroContent}>
            <Image
              src="/favicon.ico"
              alt="DuoFinder"
              width={40}
              height={40}
              className={styles.heroLogo}
            />
            <h1 className={styles.title}>Mi Perfil</h1>
            <p className={styles.heroSub}>
              Personalizá tu perfil para encontrar el dúo ideal. Recordá
              guardar los cambios antes de salir!
            </p>
            <div className={styles.heroBadges}>
              <span className={`${styles.badge} ${styles.badgePrimary}`}>
                Activo
              </span>
              {profile.age && (
                <span className={styles.badge}>{profile.age} años</span>
              )}
              {profile.server && (
                <span className={styles.badge}>
                  Servidor: {profile.server}
                </span>
              )}
              {profile.games && profile.games.length > 0 && (
                <span className={styles.badge}>
                  {profile.games.length} juego
                  {profile.games.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </header>

        {error && <div className={styles.alertError}>{error}</div>}
        {ok && <div className={styles.alertOk}>{ok}</div>}

        {/* Barra de edición */}
        <div className={styles.editBar}>
          <span
            className={`${styles.modeTag} ${
              editing ? styles.modeEdit : ''
            }`}
          >
            {editing ? 'Editando' : 'Solo lectura'}
          </span>
          <div className={styles.editActions}>
            {!editing ? (
              <button
                type="button"
                className={styles.btn}
                onClick={handleEditClick}
              >
                Editar perfil
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnOutline}`}
                  onClick={() => {
                    onReset();
                    setEditing(false);
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className={styles.btn}
                  onClick={handleSaveClick}
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
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt="Avatar seleccionado"
                      width={96}
                      height={96}
                    />
                  ) : (
                    <div className={styles.avatarInitial}>{initialLetter}</div>
                  )}
                </div>
                <div className={styles.avatarChooser}>
                  <p className={styles.avatarText}>
                    Elegí uno de los avatares predeterminados. Se guarda solo
                    en esta versión de la app.
                  </p>
                  <div className={styles.avatarOptions}>
                    {PRESET_AVATARS.map((avatar) => (
                      <button
                        key={avatar.id}
                        type="button"
                        className={`${styles.avatarOption} ${
                          avatarId === avatar.id
                            ? styles.avatarOptionSelected
                            : ''
                        }`}
                        onClick={() => selectAvatar(avatar)}
                        disabled={!editing}
                      >
                        <Image
                          src={avatar.url}
                          alt={avatar.id}
                          width={48}
                          height={48}
                        />
                      </button>
                    ))}
                    <button
                      type="button"
                      className={`${styles.avatarOption} ${
                        !avatarId ? styles.avatarOptionSelected : ''
                      }`}
                      onClick={() => selectAvatar(null)}
                      disabled={!editing}
                    >
                      <span className={styles.avatarNone}>Sin avatar</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Datos básicos */}
            <div className={styles.section}>
              <div className={styles.row2}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="username">
                    Usuario
                  </label>
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
                  <label className={styles.label} htmlFor="email">
                    Email
                  </label>
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
                  <label className={styles.label} htmlFor="discord">
                    Discord
                  </label>
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
                  <label className={styles.label} htmlFor="server">
                    Servidor
                  </label>
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
                <label className={styles.label} htmlFor="tracker">
                  Tracker
                </label>
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
                <label className={styles.label} htmlFor="bio">
                  Bio
                </label>
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
                <div className={styles.counter}>
                  {(profile.bio || '').length}/3000
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className={styles.actions}>
              <button
                className={styles.btn}
                type="submit"
                disabled={!editing || saving}
              >
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
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt="Avatar preview"
                    fill
                    className={styles.previewImg}
                  />
                ) : (
                  <div
                    className={`${styles.previewImg} ${styles.previewFallback}`}
                  >
                    {initialLetter}
                  </div>
                )}
              </div>
              <div className={styles.previewInfo}>
                <h3 className={styles.previewTitle}>
                  {profile.username || 'Usuario'}
                  {profile.age ? `, ${profile.age}` : ''}
                </h3>
                <p className={styles.previewBio}>
                  {truncate(profile.bio || 'Sin bio por ahora.')}
                </p>
                <div className={styles.previewPills}>
                  <span className={`${styles.pill} ${styles.pillPrimary}`}>
                    Activo
                  </span>
                  {profile.discord && (
                    <span className={styles.pill}>
                      Discord: {profile.discord}
                    </span>
                  )}
                  {profile.server && (
                    <span className={styles.pill}>
                      Servidor: {profile.server}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* JUEGOS & RANGOS */}
            <section className={styles.sideCard}>
              <h3 className={styles.sectionTitle}>Juegos & rangos</h3>

              {editing && (
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Agregar Juegos</h3>
                  {loadingGames ? (
                    <p className={styles.hint}>
                      Cargando juegos disponibles...
                    </p>
                  ) : (
                    <>
                      <div className={styles.chips}>
                        {availableGamesToAdd.map((game) => (
                          <button
                            key={game.id}
                            type="button"
                            className={styles.chip}
                            onClick={() => addGame(game.id)}
                          >
                            {game.name}
                          </button>
                        ))}
                      </div>
                      {availableGamesToAdd.length === 0 && (
                        <p className={styles.hint}>
                          Ya tenés todos los juegos disponibles agregados a tu
                          perfil.
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}

              {(profile.games?.length ?? 0) > 0 ? (
                <div className={styles.ranks}>
                  {(profile.games ?? []).map((game) => {
                    const gameData = availableGames.find(
                      (g) => g.id === game.game_id
                    );
                    const ranks = gameData?.ranks || [];

                    return (
                      <div key={game.game_id} className={styles.rankRow}>
                        <span className={styles.rankLabel}>
                          {game.game_name}
                        </span>
                        {editing ? (
                          <>
                            <label className={styles.rankCheckbox}>
                              <input
                                type="checkbox"
                                checked={game.is_ranked}
                                onChange={() => toggleRanked(game.game_id)}
                              />
                              <span>Ranked</span>
                            </label>

                            {game.is_ranked ? (
                              <select
                                className={styles.rankSelect}
                                value={game.rank_name || ''}
                                onChange={(e) => {
                                  const selectedRankName = e.target.value;
                                  const selectedRank = ranks.find(
                                    (r) => r.rank_name === selectedRankName
                                  );
                                  if (selectedRank) {
                                    updateGameRank(
                                      game.game_id,
                                      selectedRank.rank_name,
                                      selectedRank.local_rank_id
                                    );
                                  }
                                }}
                              >
                                {ranks.map((rank) => (
                                  <option
                                    key={rank.local_rank_id}
                                    value={rank.rank_name}
                                  >
                                    {rank.rank_name}
                                  </option>
                                ))}
                                {ranks.length === 0 && (
                                  <option
                                    value={
                                      game.rank_name || game.skill_level
                                    }
                                  >
                                    {game.rank_name || game.skill_level}
                                  </option>
                                )}
                              </select>
                            ) : (
                              <input
                                type="text"
                                className={styles.input}
                                placeholder="Nivel de habilidad (ej: Casual, Principiante)"
                                value={game.skill_level || ''}
                                onChange={(e) =>
                                  updateGameSkillLevel(
                                    game.game_id,
                                    e.target.value
                                  )
                                }
                                maxLength={50}
                              />
                            )}

                            <button
                              type="button"
                              className={styles.remove}
                              onClick={() => removeGame(game.game_id)}
                            >
                              Quitar
                            </button>
                          </>
                        ) : (
                          <>
                            <span className={styles.rankSelect}>
                              {game.is_ranked
                                ? game.rank_name
                                : game.skill_level}
                              {game.is_ranked ? ' ⚡' : ''}
                            </span>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className={styles.hint}>
                  {editing
                    ? 'Agregá juegos usando los botones de la izquierda.'
                    : 'Todavía no agregaste juegos a tu perfil.'}
                </p>
              )}

              {!editing && availableGames.length > 0 && (
                <div
                  className={styles.chips}
                  style={{ marginTop: '12px', opacity: 0.6 }}
                >
                  {availableGames.map((game) => (
                    <span
                      key={game.id}
                      className={`${styles.chip} ${
                        selectedGameIds.has(game.id.toString())
                          ? styles.chipSelected
                          : ''
                      }`}
                    >
                      {game.name}
                    </span>
                  ))}
                </div>
              )}
            </section>

            <div className={styles.noteReadOnly}>
              {editing
                ? 'Estás editando tu perfil.'
                : 'Tocá "Editar perfil" para modificar tus datos.'}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
