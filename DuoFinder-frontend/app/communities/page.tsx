'use client';

import { useEffect, useMemo, useState } from 'react';
import styles from './communities.module.css';
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
  createdBy: string; // 'me' si la creó el usuario
}

// Define el tipo para los objetos en localStorage
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
  createdBy: string;
}

const CURRENT_USER_ID = 'me';

const MOCK_COMMUNITIES: Community[] = [
  {
    id: 1,
    name: 'Flex LAS Tryhard',
    gameId: 'lol',
    gameName: 'League of Legends',
    members: 128,
    description: 'Comunidad para armar flex, clash y equipos tryhard en LAS.',
    logoInitials: 'FX',
    createdBy: 'system',
  },
];

const GAME_FILTERS: { id: GameId | 'all'; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'lol', label: 'League of Legends' },
  { id: 'valorant', label: 'Valorant' },
  { id: 'cs2', label: 'CS2' },
  { id: 'tft', label: 'TFT' },
  { id: 'overwatch', label: 'Overwatch' },
];

export default function CommunitiesPage() {
  const router = useRouter();

  // Comunidades creadas por el usuario (derivadas de joinedCommunities)
  const [userCommunities, setUserCommunities] = useState<Community[]>([]);
  const [search, setSearch] = useState('');
  const [gameFilter, setGameFilter] = useState<GameId | 'all'>('all');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingCommunity, setEditingCommunity] = useState<Community | null>(null);

  // Campos del formulario de la modal
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formLogoUrl, setFormLogoUrl] = useState('');
  const [formGames, setFormGames] = useState<GameId[]>([]);

  // ========== CARGA DESDE joinedCommunities ==========

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem('joinedCommunities');
    if (!raw) {
      setUserCommunities([]);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as JoinedCommunity[];

      // Solo las creadas por mí y que tengan datos de comunidad
      const mine = parsed.filter(
        (c) => c && c.createdBy === CURRENT_USER_ID && c.gameId
      );

      const mapped: Community[] = mine.map((c, idx) => {
        const name = (c.name || 'Comunidad').toString().trim();
        const primaryGameId: GameId = (c.gameId as GameId) || 'lol';
        const primaryGame =
          GAME_FILTERS.find((g) => g.id === primaryGameId) || GAME_FILTERS[1];

        return {
          id:
            typeof c.id === 'number'
              ? c.id
              : MOCK_COMMUNITIES.length + idx + 1,
          name,
          description: (c.description || '').toString(),
          logoUrl: c.logoUrl || undefined,
          logoInitials:
            c.logoInitials ||
            name.substring(0, 2).toUpperCase(),
          gameId: primaryGame.id as GameId,
          gameName: primaryGame.label,
          extraGames: (c.extraGames as GameId[] | undefined) || [],
          members:
            typeof c.members === 'number' ? c.members : 1,
          createdBy: CURRENT_USER_ID,
        };
      });

      setUserCommunities(mapped);
    } catch {
      setUserCommunities([]);
    }
  }, []);

  // Todas las comunidades: las fijas + las mías
  const communities = useMemo(
    () => [...MOCK_COMMUNITIES, ...userCommunities],
    [userCommunities]
  );

  // ========== FILTRO ==========

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

  // ========== MODAL CREAR / EDITAR ==========

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
    const games: GameId[] = [
      community.gameId,
      ...(community.extraGames ?? []),
    ];
    setFormGames(games);
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  const toggleGameInForm = (id: GameId) => {
    setFormGames((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  // ========== GUARDAR COMUNIDAD (crear / editar) ==========

  const handleSubmitCommunity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;
    if (formGames.length === 0) return;

    const primaryGameId = formGames[0];
    const primaryGame = GAME_FILTERS.find((g) => g.id === primaryGameId);
    const extraGames = formGames.slice(1);

    if (!primaryGame || primaryGame.id === 'all') return;

    if (editingCommunity) {
      // EDITAR EXISTENTE
      setUserCommunities((prev) => {
        const updated = prev.map((c) =>
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
        );

        // Actualizar también en joinedCommunities
        if (typeof window !== 'undefined') {
          const raw = localStorage.getItem('joinedCommunities');
          const joined: JoinedCommunity[] = raw ? JSON.parse(raw) : [];
          const joinedUpdated = joined.map((c) =>
            c.id === editingCommunity.id
              ? {
                  ...c,
                  name: formName.trim(),
                  description: formDescription.trim(),
                  logoUrl: formLogoUrl.trim() || undefined,
                  gameId: primaryGameId,
                  gameName: primaryGame.label,
                  extraGames,
                  createdBy: CURRENT_USER_ID,
                }
              : c
          );
          localStorage.setItem(
            'joinedCommunities',
            JSON.stringify(joinedUpdated)
          );
        }

        return updated;
      });
    } else {
      // CREAR NUEVA
      const newId =
        communities.reduce((max, c) => Math.max(max, c.id), 0) + 1;

      const newCommunity: Community = {
        id: newId,
        name: formName.trim(),
        description: formDescription.trim(),
        logoUrl: formLogoUrl.trim() || undefined,
        logoInitials: formName.trim().substring(0, 2).toUpperCase(),
        gameId: primaryGameId,
        gameName: primaryGame.label,
        extraGames,
        members: 1,
        createdBy: CURRENT_USER_ID,
      };

      // 1) Guardar en estado
      setUserCommunities((prev) => [...prev, newCommunity]);

      // 2) Guardar en joinedCommunities (origen compartido con Mensajes)
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem('joinedCommunities');
        const joined: JoinedCommunity[] = raw ? JSON.parse(raw) : [];
        joined.push({
          ...newCommunity,
        });
        localStorage.setItem('joinedCommunities', JSON.stringify(joined));
      }

      // 3) Abrir chat de esa comunidad
      router.push(
        `/messages?communityId=${newCommunity.id}&communityName=${encodeURIComponent(
          newCommunity.name
        )}`
      );
    }

    setShowModal(false);
  };

  // ========== UNIRSE A COMUNIDAD EXISTENTE ==========

  const handleJoinCommunity = (community: Community) => {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem('joinedCommunities');
      const joined: JoinedCommunity[] = raw ? JSON.parse(raw) : [];

      if (!joined.some((c) => c.id === community.id)) {
        joined.push({
          ...community,
          createdBy: community.createdBy || 'system',
        });
        localStorage.setItem('joinedCommunities', JSON.stringify(joined));
      }
    }

    router.push(
      `/messages?communityId=${community.id}&communityName=${encodeURIComponent(
        community.name
      )}`
    );
  };

  // ========== ELIMINAR COMUNIDAD CREADA POR MÍ ==========

  const handleDeleteCommunity = (community: Community) => {
    if (
      typeof window !== 'undefined' &&
      !window.confirm(
        '¿Eliminar esta comunidad? Esta acción no se puede deshacer.'
      )
    ) {
      return;
    }

    setUserCommunities((prev) => prev.filter((c) => c.id !== community.id));

    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem('joinedCommunities');
      const joined: JoinedCommunity[] = raw ? JSON.parse(raw) : [];
      const filtered = joined.filter((c) => c.id !== community.id);
      localStorage.setItem('joinedCommunities', JSON.stringify(filtered));
    }
  };

  // ========== RENDER ==========

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
                Creá un grupo para tu juego o stack habitual. Después lo vamos a
                conectar al backend para que quede persistido.
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
              <h2 className={styles.panelTitle}>Comunidades destacadas</h2>
              <span className={styles.resultCount}>
                {filteredCommunities.length} resultado
                {filteredCommunities.length === 1 ? '' : 's'}
              </span>
            </div>

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

                const isOwner =
                  !community.createdBy ||
                  community.createdBy === CURRENT_USER_ID;

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
                          <span className={styles.ownerTag}>
                            CREADOR
                          </span>
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
                        Unirme
                      </button>

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

              {filteredCommunities.length === 0 && (
                <div className={styles.emptyState}>
                  <p>No encontramos comunidades con ese filtro.</p>
                  <p>Probá con otro juego o creá una nueva comunidad.</p>
                </div>
              )}
            </div>
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