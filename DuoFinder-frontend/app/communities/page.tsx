'use client';

import { useMemo, useState } from 'react';
import styles from './page.module.css';

type Community = {
  id: string;
  name: string;
  game: string;
  members: number;
  tags: string[];         // ej: ['Casual', 'Argentina', 'Ranked']
  visibility: 'publica' | 'privada';
  bio?: string;
};

const MOCK_COMMUNITIES: Community[] = [
  {
    id: 'c1',
    name: 'Valorant LATAM Rankeds',
    game: 'Valorant',
    members: 128,
    tags: ['Competitivo', 'Ranked', 'LATAM'],
    visibility: 'publica',
    bio: 'Scrims nocturnas y ranked serio. Reglas claras.',
  },
  {
    id: 'c2',
    name: 'LoL AR Casual',
    game: 'League of Legends',
    members: 87,
    tags: ['Casual', 'Argentina'],
    visibility: 'publica',
    bio: 'Normales, ARAM y chill. Bienvenidos nuevos.',
  },
  {
    id: 'c3',
    name: 'Rocket League Stack Mates',
    game: 'Rocket League',
    members: 42,
    tags: ['Duo/Trío', 'Competitivo'],
    visibility: 'privada',
    bio: 'Buscamos constancia y scrims semanales.',
  },
];

export default function CommunitiesPage() {
  // estado mock: comunidades a las que pertenezco
  const [myCommunities, setMyCommunities] = useState<string[]>(['c2']);
  const [query, setQuery] = useState('');
  const [gameFilter, setGameFilter] = useState<string>('Todos');
  const [typeFilter, setTypeFilter] = useState<string>('Todos'); // Casual | Competitivo | Todos
  const [showCreate, setShowCreate] = useState(false);

  const games = useMemo(() => {
    const set = new Set(MOCK_COMMUNITIES.map(c => c.game));
    return ['Todos', ...Array.from(set)];
  }, []);

  const filtered = useMemo(() => {
    return MOCK_COMMUNITIES.filter(c => {
      const matchText =
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.game.toLowerCase().includes(query.toLowerCase()) ||
        c.tags.some(t => t.toLowerCase().includes(query.toLowerCase()));

      const matchGame = gameFilter === 'Todos' ? true : c.game === gameFilter;

      const isCasual = c.tags.some(t => t.toLowerCase() === 'casual');
      const isComp = c.tags.some(t => t.toLowerCase() === 'competitivo');
      const matchType =
        typeFilter === 'Todos' ||
        (typeFilter === 'Casual' && isCasual) ||
        (typeFilter === 'Competitivo' && isComp);

      return matchText && matchGame && matchType;
    });
  }, [query, gameFilter, typeFilter]);

  function toggleMembership(id: string) {
    setMyCommunities(curr =>
      curr.includes(id) ? curr.filter(x => x !== id) : [...curr, id]
    );
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    // mock: cerramos modal y listo. Luego se reemplaza por POST /communities
    setShowCreate(false);
    // opcional: podríamos pushear una comunidad dummy al estado
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Comunidades</h1>
          <p className={styles.sub}>
            Descubrí grupos por juego, modo y región. Unite o creá la tuya.
          </p>
        </div>
        <button className={styles.btn} onClick={() => setShowCreate(true)}>
          Crear comunidad
        </button>
      </header>

      <section className={styles.filters}>
        <input
          className={styles.input}
          placeholder="Buscar por nombre, juego o tag…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className={styles.select}
          value={gameFilter}
          onChange={(e) => setGameFilter(e.target.value)}
        >
          {games.map(g => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
        <div className={styles.chips}>
          <button
            className={`${styles.chip} ${typeFilter === 'Todos' ? styles.active : ''}`}
            onClick={() => setTypeFilter('Todos')}
            type="button"
          >
            Todos
          </button>
          <button
            className={`${styles.chip} ${typeFilter === 'Casual' ? styles.active : ''}`}
            onClick={() => setTypeFilter('Casual')}
            type="button"
          >
            Casual
          </button>
          <button
            className={`${styles.chip} ${typeFilter === 'Competitivo' ? styles.active : ''}`}
            onClick={() => setTypeFilter('Competitivo')}
            type="button"
          >
            Competitivo
          </button>
        </div>
      </section>

      <section className={styles.grid}>
        {filtered.map(c => {
          const joined = myCommunities.includes(c.id);
          return (
            <article key={c.id} className={styles.card}>
              <div className={styles.cardTop}>
                <div>
                  <h3 className={styles.cardTitle}>{c.name}</h3>
                  <p className={styles.cardMeta}>
                    {c.game} • {c.members} miembros • {c.visibility}
                  </p>
                </div>
                <div className={styles.tags}>
                  {c.tags.map(t => (
                    <span key={t} className={styles.tag}>{t}</span>
                  ))}
                </div>
              </div>

              {c.bio && <p className={styles.cardBio}>{c.bio}</p>}

              <div className={styles.cardActions}>
                <button
                  className={styles.btnPrimary}
                  onClick={() => toggleMembership(c.id)}
                >
                  {joined ? 'Salir' : 'Unirme'}
                </button>
                <button
                  className={styles.btnGhost}
                  onClick={() => alert('Detalle (mock): luego /communities/[id]')}
                >
                  Ver detalle
                </button>
              </div>
            </article>
          );
        })}
        {filtered.length === 0 && (
          <div className={styles.empty}>
            <p>No encontramos comunidades con esos filtros.</p>
          </div>
        )}
      </section>

      {showCreate && (
        <div className={styles.modalBackdrop} onClick={() => setShowCreate(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Crear comunidad</h2>
            <form className={styles.form} onSubmit={handleCreate}>
              <label className={styles.label}>Nombre</label>
              <input className={styles.input} required />

              <label className={styles.label}>Juego</label>
              <input className={styles.input} required placeholder="Valorant, LoL, etc." />

              <label className={styles.label}>Visibilidad</label>
              <select className={styles.select} defaultValue="publica">
                <option value="publica">Pública</option>
                <option value="privada">Privada</option>
              </select>

              <label className={styles.label}>Tags (separados por coma)</label>
              <input className={styles.input} placeholder="Casual, Argentina, Ranked" />

              <div className={styles.modalActions}>
                <button type="button" className={styles.btnGhost} onClick={() => setShowCreate(false)}>
                  Cancelar
                </button>
                <button type="submit" className={styles.btnPrimary}>
                  Crear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
