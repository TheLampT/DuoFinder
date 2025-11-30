'use client';

import { useMemo, useState } from 'react';
import styles from './communities.module.css';
import Image from 'next/image';

type GameId = 'lol' | 'valorant' | 'cs2' | 'tft' | 'overwatch';

interface Community {
  id: number;
  name: string;
  gameId: GameId;
  gameName: string;
  members: number;
  description: string;
  // En el futuro podés reemplazar esto por una URL real de logo
  logoInitials: string;
}

const MOCK_COMMUNITIES: Community[] = [
  {
    id: 1,
    name: 'Flex LAS Tryhard',
    gameId: 'lol',
    gameName: 'League of Legends',
    members: 128,
    description: 'Comunidad para armar flex, clash y equipos tryhard en LAS.',
    logoInitials: 'FX',
  },
  {
    id: 2,
    name: 'Valorant Argentina',
    gameId: 'valorant',
    gameName: 'Valorant',
    members: 342,
    description: 'Stackeá ranked, scrims y customs con jugadores argentinos.',
    logoInitials: 'VA',
  },
  {
    id: 3,
    name: 'Iron to Immortal',
    gameId: 'valorant',
    gameName: 'Valorant',
    members: 87,
    description: 'Comunidad chill para mejorar en ranked sin flameo.',
    logoInitials: 'II',
  },
  {
    id: 4,
    name: 'ARAM All Day',
    gameId: 'lol',
    gameName: 'League of Legends',
    members: 210,
    description: 'Solo ARAM, sin drama. Partidas rápidas y divertidas.',
    logoInitials: 'AA',
  },
  {
    id: 5,
    name: 'CS2 Late Night Stack',
    gameId: 'cs2',
    gameName: 'CS2',
    members: 64,
    description: 'Para jugar de noche, mix y rankeds con micro obligatorio.',
    logoInitials: 'LN',
  },
  {
    id: 6,
    name: 'TFT LATAM',
    gameId: 'tft',
    gameName: 'TFT',
    members: 153,
    description: 'Comunidad para compartir comps, parches y lobbys amistosos.',
    logoInitials: 'TF',
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
  const [search, setSearch] = useState('');
  const [gameFilter, setGameFilter] = useState<GameId | 'all'>('all');

  const filteredCommunities = useMemo(() => {
    return MOCK_COMMUNITIES.filter((c) => {
      const matchesGame = gameFilter === 'all' || c.gameId === gameFilter;
      const query = search.trim().toLowerCase();
      const matchesSearch =
        !query ||
        c.name.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query) ||
        c.gameName.toLowerCase().includes(query);
      return matchesGame && matchesSearch;
    });
  }, [search, gameFilter]);

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
          {/* Columna izquierda: búsqueda + filtros + crear */}
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

            {/* Panel para crear comunidad */}
            <div className={styles.panel}>
              <h2 className={styles.panelTitle}>Crear una comunidad</h2>
              <p className={styles.panelText}>
                ¿Tenés una idea para una comunidad nueva? Reservá el nombre, cargá un logo y definí el juego
                principal. Más adelante conectamos esto al backend para guardar y listar las comunidades reales.
              </p>

              <form
                className={styles.createForm}
                onSubmit={(e) => {
                  e.preventDefault();
                  // Acá después podemos disparar un modal o llamada a la API
                  alert('En el MVP esto solo es UI. Después lo conectamos al backend.');
                }}
              >
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="communityName">
                    Nombre de la comunidad
                  </label>
                  <input
                    id="communityName"
                    className={styles.input}
                    type="text"
                    placeholder="Ej: Stackers LAS, Valorant Chill AR..."
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="communityGame">
                    Juego principal
                  </label>
                  <select id="communityGame" className={styles.input}>
                    <option value="">Elegí un juego</option>
                    {GAME_FILTERS.filter((g) => g.id !== 'all').map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Logo placeholder bien claro */}
                <div className={styles.field}>
                  <span className={styles.label}>Logo de la comunidad</span>
                  <div className={styles.logoDropzone}>
                    <span className={styles.logoHint}>
                      Espacio reservado para el logo
                      <br />
                      (más adelante lo conectamos a subida de imagen)
                    </span>
                  </div>
                </div>

                <button type="submit" className={styles.primaryBtn}>
                  Crear comunidad (UI)
                </button>
              </form>
            </div>
          </div>

          {/* Columna derecha: lista de comunidades */}
          <div className={styles.rightCol}>
            <div className={styles.listHeader}>
              <h2 className={styles.panelTitle}>Comunidades destacadas</h2>
              <span className={styles.resultCount}>
                {filteredCommunities.length} resultado
                {filteredCommunities.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className={styles.communityGrid}>
              {filteredCommunities.map((community) => (
                <article key={community.id} className={styles.communityCard}>
                  {/* Logo / espacio para imagen */}
                  <div className={styles.communityLogoWrapper}>
                    {/* En el futuro: reemplazar por <Image src={logoUrl} ... /> */}
                    <div className={styles.communityLogo}>
                      <span className={styles.communityLogoText}>
                        {community.logoInitials}
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className={styles.communityInfo}>
                    <h3 className={styles.communityName}>{community.name}</h3>
                    <div className={styles.communityMeta}>
                      <span className={styles.metaTag}>{community.gameName}</span>
                      <span className={styles.metaTag}>
                        {community.members} miembro{community.members !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <p className={styles.communityDescription}>{community.description}</p>
                  </div>

                  {/* Acción */}
                  <div className={styles.communityActions}>
                    <button type="button" className={styles.outlineBtn}>
                      Ver detalles
                    </button>
                    <button type="button" className={styles.joinBtn}>
                      Unirme
                    </button>
                  </div>
                </article>
              ))}

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
    </main>
  );
}
