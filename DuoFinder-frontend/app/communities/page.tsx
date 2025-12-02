'use client';

import { useEffect, useMemo, useState } from 'react';
import styles from './communities.module.css';
import {
  apiService,
  CommunityDTO,
  MyCommunityDTO,
  CommunityListDTO,
} from '@/lib/apiService';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

type GameId = 'lol' | 'valorant' | 'cs2' | 'tft' | 'overwatch';

interface Community {
  id: number;
  name: string;
  gameId: GameId;
  gameName: string;
  extraGames?: GameId[];
  members: number;
  description: string;
  logoInitials: string;
  logoUrl?: string;
}

// Objeto que seguimos usando para sincronizar con la pantalla de Mensajes
interface JoinedCommunity {
  id: number;
  name: string;
  gameId: GameId;
  gameName: string;
  extraGames?: GameId[];
  members: number;
  description: string;
  logoInitials?: string;
  logoUrl?: string;
}

const GAME_FILTERS: { id: GameId | 'all'; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'lol', label: 'League of Legends' },
  { id: 'valorant', label: 'Valorant' },
  { id: 'cs2', label: 'CS2' },
  { id: 'tft', label: 'TFT' },
  { id: 'overwatch', label: 'Overwatch' },
];

// --- Helpers de mapeo -------------------------------------------------------

function detectGame(name: string, info: string | null): { gameId: GameId; gameName: string } {
  const txt = `${name} ${info ?? ''}`.toLowerCase();

  if (txt.includes('valorant')) {
    return { gameId: 'valorant', gameName: 'Valorant' };
  }
  if (txt.includes('cs2') || txt.includes('counter')) {
    return { gameId: 'cs2', gameName: 'CS2' };
  }
  if (txt.includes('tft') || txt.includes('teamfight')) {
    return { gameId: 'tft', gameName: 'TFT' };
  }
  if (txt.includes('overwatch')) {
    return { gameId: 'overwatch', gameName: 'Overwatch' };
  }

  // Default
  return { gameId: 'lol', gameName: 'League of Legends' };
}

function mapDtoToCommunity(dto: CommunityDTO): Community {
  const { gameId, gameName } = detectGame(dto.name, dto.info ?? null);

  return {
    id: dto.id,
    name: dto.name,
    description: dto.info ?? '',
    gameId,
    gameName,
    extraGames: [],
    members: 1, // hasta que el backend devuelva un contador real
    logoInitials: dto.name.substring(0, 2).toUpperCase(),
    logoUrl: undefined,
  };
}

// --- Componente principal ---------------------------------------------------

export default function CommunitiesPage() {
  const router = useRouter();

  const [communities, setCommunities] = useState<Community[]>([]);
  const [myCommunities, setMyCommunities] = useState<MyCommunityDTO[]>([]);

  const [search, setSearch] = useState('');
  const [gameFilter, setGameFilter] = useState<GameId | 'all'>('all');

  const [showModal, setShowModal] = useState(false);
  const [editingCommunity, setEditingCommunity] = useState<Community | null>(null);

  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formLogoUrl, setFormLogoUrl] = useState('');
  const [formGames, setFormGames] = useState<GameId[]>([]);

  const [loading, setLoading] = useState(false);

  // -------------------- Carga inicial desde backend -------------------------

  async function loadCommunities() {
    try {
      setLoading(true);
      const res: CommunityListDTO = await apiService.getCommunities();
      const mapped = res.items.map(mapDtoToCommunity);
      setCommunities(mapped);
    } catch (err) {
      console.error('Error al obtener comunidades:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadMyCommunities() {
    try {
      const mine: MyCommunityDTO[] = await apiService.getMyCommunities();
      setMyCommunities(mine);

      // Sincronizamos con localStorage para que la pantalla de mensajes
      // siga funcionando como antes (joinedCommunities).
      if (typeof window !== 'undefined') {
        const joined: JoinedCommunity[] = mine.map((c) => {
          const { gameId, gameName } = detectGame(c.name, c.info ?? null);
          return {
            id: c.id,
            name: c.name,
            description: c.info ?? '',
            gameId,
            gameName,
            extraGames: [],
            members: 1,
            logoInitials: c.name.substring(0, 2).toUpperCase(),
            logoUrl: undefined,
          };
        });
        localStorage.setItem('joinedCommunities', JSON.stringify(joined));
      }
    } catch (err) {
      console.error('Error al obtener mis comunidades:', err);
    }
  }

  useEffect(() => {
    loadCommunities();
    loadMyCommunities();
  }, []);

  // -------------------- Helpers de membership -------------------------------

  function getMembership(communityId: number) {
    return myCommunities.find((c) => c.id === communityId);
  }

  function syncJoinedLocalAdd(community: Community) {
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem('joinedCommunities');
    const joined: JoinedCommunity[] = raw ? JSON.parse(raw) : [];
    if (!joined.some((c) => c.id === community.id)) {
      joined.push({
        id: community.id,
        name: community.name,
        description: community.description,
        gameId: community.gameId,
        gameName: community.gameName,
        extraGames: community.extraGames,
        members: community.members,
        logoInitials: community.logoInitials,
        logoUrl: community.logoUrl,
      });
      localStorage.setItem('joinedCommunities', JSON.stringify(joined));
    }
  }

  function syncJoinedLocalRemove(id: number) {
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem('joinedCommunities');
    if (!raw) return;
    const joined: JoinedCommunity[] = JSON.parse(raw);
    const filtered = joined.filter((c) => c.id !== id);
    localStorage.setItem('joinedCommunities', JSON.stringify(filtered));
  }

  // -------------------- Filtros ---------------------------------------------

  const filteredCommunities = useMemo(() => {
    return communities.filter((c) => {
      const matchesGame =
        gameFilter === 'all' ||
        c.gameId === gameFilter ||
        (c.extraGames?.includes(gameFilter as GameId) ?? false);

      const query = search.trim().toLowerCase();
      const gamesLabel = [
        c.gameName,
        ...(c.extraGames
          ? c.extraGames
              .map((g) => GAME_FILTERS.find((gf) => gf.id === g)?.label || '')
              .filter(Boolean)
          : []),
      ].join(', ');

      const matchesSearch =
        !query ||
        c.name.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query) ||
        gamesLabel.toLowerCase().includes(query);

      return matchesGame && matchesSearch;
    });
  }, [communities, search, gameFilter]);

  // -------------------- Modal Crear / Editar --------------------------------

  const openCreateModal = () => {
    setEditingCommunity(null);
    setFormName('');
    setFormDescription('');
    setFormLogoUrl('');
    setFormGames([]);
    setShowModal(true);
  };

  const openEditModal = (community: Community) => {
    setEditingCommunity(community);
    setFormName(community.name);
    setFormDescription(community.description);
    setFormLogoUrl(community.logoUrl || '');
    const games: GameId[] = [community.gameId, ...(community.extraGames ?? [])];
    setFormGames(games);
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  const toggleGameInForm = (id: GameId) => {
    setFormGames((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  // -------------------- Guardar comunidad (crear / editar) ------------------

  const handleSubmitCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;
    if (formGames.length === 0) return;

    const primaryGameId = formGames[0];
    const primaryGame = GAME_FILTERS.find((g) => g.id === primaryGameId);
    const extraGames = formGames.slice(1);

    if (!primaryGame || primaryGame.id === 'all') return;

    try {
      if (editingCommunity) {
        // EDITAR
        await apiService.updateCommunity(editingCommunity.id, {
          name: formName.trim(),
          info: formDescription.trim() || null,
          is_public: true,
          game_ids: [], // por ahora no lo usamos en backend
        });

        // Actualizamos en memoria para no esperar al fetch
        setCommunities((prev) =>
          prev.map((c) =>
            c.id === editingCommunity.id
              ? {
                  ...c,
                  name: formName.trim(),
                  description: formDescription.trim(),
                  logoUrl: formLogoUrl.trim() || undefined,
                  gameId: primaryGameId,
                  gameName: primaryGame.label,
                  extraGames,
                }
              : c
          )
        );

        await loadMyCommunities();
      } else {
        // CREAR
        const createdDto = await apiService.createCommunity({
          name: formName.trim(),
          info: formDescription.trim() || null,
          is_public: true,
          game_ids: [],
        });

        const newCommunity: Community = {
          id: createdDto.id,
          name: createdDto.name,
          description: createdDto.info ?? '',
          gameId: primaryGameId,
          gameName: primaryGame.label,
          extraGames,
          members: 1,
          logoInitials: createdDto.name.substring(0, 2).toUpperCase(),
          logoUrl: formLogoUrl.trim() || undefined,
        };

        setCommunities((prev) => [...prev, newCommunity]);
        await loadMyCommunities();
        syncJoinedLocalAdd(newCommunity);

        router.push(
          `/messages?communityId=${newCommunity.id}&communityName=${encodeURIComponent(
            newCommunity.name
          )}`
        );
      }
    } catch (err) {
      console.error('Error al guardar comunidad:', err);
    } finally {
      setShowModal(false);
    }
  };

  // -------------------- Unirse / salir / eliminar ---------------------------

  const handleJoinCommunity = async (community: Community) => {
    const membership = getMembership(community.id);

    // Si ya soy miembro, voy directo a mensajes
    if (membership) {
      router.push(
        `/messages?communityId=${community.id}&communityName=${encodeURIComponent(
          community.name
        )}`
      );
      return;
    }

    try {
      await apiService.joinCommunity(community.id);
      await loadMyCommunities();
      syncJoinedLocalAdd(community);

      router.push(
        `/messages?communityId=${community.id}&communityName=${encodeURIComponent(
          community.name
        )}`
      );
    } catch (err) {
      console.error('Error al unirse a comunidad:', err);
    }
  };


 const handleLeaveCommunity = async (community: Community) => {
    if (
      typeof window !== 'undefined' &&
      !window.confirm('¿Salir de esta comunidad?')
    ) {
      return;
    }

    try {
      await apiService.leaveCommunity(community.id);
      await loadMyCommunities();
      syncJoinedLocalRemove(community.id);
    } catch (err) {
      console.error('Error al salir de comunidad:', err);
    }
  };
  const handleDeleteCommunity = async (community: Community) => {
    if (
      typeof window !== 'undefined' &&
      !window.confirm(
        '¿Eliminar esta comunidad? Esta acción no se puede deshacer.'
      )
    ) {
      return;
    }

    try {
      await apiService.deleteCommunity(community.id);
      setCommunities((prev) => prev.filter((c) => c.id !== community.id));
      await loadMyCommunities();
      syncJoinedLocalRemove(community.id);
    } catch (err) {
      console.error('Error al eliminar comunidad:', err);
    }
  };

  // -------------------- Render ---------------------------------------------

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        {/* HERO / HEADER */}
        <header className={styles.hero}>
          <div
            className={styles.heroBg}
            style={{
              backgroundImage:
                'radial-gradient(circle at 0% 0%, rgba(255,122,122,0.16), transparent 50%), radial-gradient(circle at 100% 100%, rgba(139,92,246,0.2), transparent 55%)',
            }}
          />
          <div className={styles.heroOverlay} />
          <div className={styles.heroContent}>
            <h1 className={styles.title}>Comunidades</h1>
            <p className={styles.subtitle}>
              Encontrá, creá y unite a comunidades de tus juegos favoritos. Todo en un solo lugar.
            </p>
          </div>
        </header>

        {/* CONTENIDO PRINCIPAL */}
        <section className={styles.layout}>
          {/* Columna izquierda */}
          <div className={styles.leftCol}>
            <div className={styles.panel}>
              <h2 className={styles.panelTitle}>Buscar comunidades</h2>
              <div className={styles.field}>
                <label htmlFor="search" className={styles.label}>
                  Nombre, juego o descripción
                </label>
                <input
                  id="search"
                  className={styles.input}
                  type="text"
                  placeholder="Ej: Valorant Argentina, Flex LAS..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className={styles.field}>
                <span className={styles.label}>Juego</span>
                <div className={styles.chips}>
                  {GAME_FILTERS.map((game) => (
                    <button
                      key={game.id}
                      type="button"
                      onClick={() => setGameFilter(game.id as GameId | 'all')}
                      className={`${styles.chip} ${
                        gameFilter === game.id ? styles.chipActive : ''
                      }`}
                    >
                      {game.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Panel crear comunidad */}
            <div className={styles.panel}>
              <h2 className={styles.panelTitle}>Crear una comunidad</h2>
              <p className={styles.panelText}>
                Creá un grupo para tu juego o stack habitual. Se guarda en el backend de DuoFinder.
              </p>

              <button
                type="button"
                className={styles.primaryBtn}
                onClick={openCreateModal}
              >
                + Nueva comunidad
              </button>
            </div>
          </div>

          {/* Columna derecha: lista */}
          <div className={styles.rightCol}>
            <div className={styles.listHeader}>
              <h2 className={styles.panelTitle}>Comunidades</h2>
              <span className={styles.resultCount}>
                {filteredCommunities.length} resultado
                {filteredCommunities.length === 1 ? '' : 's'}
              </span>
            </div>

            {loading && communities.length === 0 ? (
              <div className={styles.emptyState}>
                <p>Cargando comunidades…</p>
              </div>
            ) : (
              <div className={styles.communityGrid}>
                {filteredCommunities.map((community) => {
                  const allGameLabels = [
                    community.gameName,
                    ...(community.extraGames
                      ? community.extraGames
                          .map(
                            (g) =>
                              GAME_FILTERS.find((gf) => gf.id === g)?.label ||
                              ''
                          )
                          .filter(Boolean)
                      : []),
                  ].join(' • ');

                  const membership = getMembership(community.id);
                  const isMember = !!membership;
                  const isOwner = membership?.role === 'owner';

                  return (
                    <article
                      key={community.id}
                      className={styles.communityCard}
                    >
                      {/* Logo / imagen */}
                      <div className={styles.communityLogoWrapper}>
                        {community.logoUrl ? (
                          <Image
                            src={community.logoUrl}
                            alt={community.name}
                            width={56}
                            height={56}
                            className={styles.communityLogoImage}
                          />
                        ) : (
                          <div className={styles.communityLogo}>
                            <span className={styles.communityLogoText}>
                              {community.logoInitials}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className={styles.communityInfo}>
                        <h3 className={styles.communityName}>
                          {community.name}
                        </h3>
                        <div className={styles.communityMeta}>
                          <span className={styles.metaTag}>
                            {allGameLabels}
                          </span>
                          <span className={styles.metaTag}>
                            {community.members} miembro
                            {community.members !== 1 ? 's' : ''}
                          </span>
                          {isOwner && (
                            <span className={styles.ownerTag}>CREADOR</span>
                          )}
                        </div>
                        <p className={styles.communityDescription}>
                          {community.description}
                        </p>
                      </div>

                      {/* Acción */}
                      <div className={styles.communityActions}>
                        <button
                          type="button"
                          className={styles.joinBtn}
                          onClick={() => handleJoinCommunity(community)}
                        >
                          {isMember ? 'Ir al chat' : 'Unirme'}
                        </button>

                        {isMember && !isOwner && (
                          <button
                            type="button"
                            className={styles.smallBtn}
                            onClick={() => handleLeaveCommunity(community)}
                          >
                            Salir
                          </button>
                        )}

                        {isOwner && (
                          <>
                            <button
                              type="button"
                              className={styles.smallBtn}
                              onClick={() => openEditModal(community)}
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              className={styles.smallDangerBtn}
                              onClick={() => handleDeleteCommunity(community)}
                            >
                              Eliminar
                            </button>
                          </>
                        )}
                      </div>
                    </article>
                  );
                })}

                {filteredCommunities.length === 0 && !loading && (
                  <div className={styles.emptyState}>
                    <p>No encontramos comunidades con ese filtro.</p>
                    <p>Probá con otro juego o creá una nueva comunidad.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* MODAL CREAR / EDITAR */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {editingCommunity ? 'Editar comunidad' : 'Crear comunidad'}
              </h2>
              <button
                type="button"
                className={styles.modalClose}
                onClick={closeModal}
              >
                ×
              </button>
            </div>

            <form className={styles.modalBody} onSubmit={handleSubmitCommunity}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="communityName">
                  Nombre
                </label>
                <input
                  id="communityName"
                  className={styles.input}
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ej: Stackers LAS, Valorant Chill AR..."
                  required
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="communityDesc">
                  Descripción
                </label>
                <textarea
                  id="communityDesc"
                  className={styles.textarea}
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Contá brevemente de qué se trata la comunidad."
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="communityLogo">
                  Logo (URL – opcional)
                </label>
                <input
                  id="communityLogo"
                  className={styles.input}
                  type="url"
                  value={formLogoUrl}
                  onChange={(e) => setFormLogoUrl(e.target.value)}
                  placeholder="https://..."
                />
                <span className={styles.hint}>
                  Más adelante vamos a permitir subir imágenes.
                </span>
              </div>

              <div className={styles.field}>
                <span className={styles.label}>Juegos</span>
                <div className={styles.gamesGrid}>
                  {GAME_FILTERS.filter((g) => g.id !== 'all').map((g) => (
                    <label key={g.id} className={styles.gameCheckbox}>
                      <input
                        type="checkbox"
                        checked={formGames.includes(g.id as GameId)}
                        onChange={() => toggleGameInForm(g.id as GameId)}
                      />
                      <span>{g.label}</span>
                    </label>
                  ))}
                </div>
                <span className={styles.hint}>
                  Podés elegir uno o varios. El primero será el juego principal.
                </span>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={closeModal}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={styles.primaryBtn}
                  disabled={!formName.trim() || formGames.length === 0}
                >
                  {editingCommunity ? 'Guardar cambios' : 'Crear comunidad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
