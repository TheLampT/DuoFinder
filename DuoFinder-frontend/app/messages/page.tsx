// app/messages/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '@/styles/pages/messages.module.css';
import Image from 'next/image';

interface UserProfile {
  id: string;
  name: string;
  age: number;
  bio: string;
  avatar: string;
  gamePreferences: string[];
  onlineStatus: boolean;
  lastOnline?: string;
  location: string;
  skillLevel: string;
  favoriteGames: string[];
}

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  read: boolean;
}

interface Match {
  id: string;
  userId: string;
  matchedOn: string;
  lastMessage?: Message;
  unreadCount: number;
  user: UserProfile;

  // Campos extra para comunidades
  isCommunity?: boolean;
  communityId?: number;
}

const MessagesPage = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const router = useRouter();

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkIsMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setShowSidebar(selectedMatch === null);
      } else {
        setShowSidebar(true);
      }
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, [selectedMatch]);

  // Cargar matches + comunidades unidas
  useEffect(() => {
    const loadData = () => {
      // Mock de matches 1 a 1
      const mockMatches: Match[] = [
        {
          id: '1',
          userId: 'user2',
          matchedOn: '2023-05-15T14:30:00Z',
          unreadCount: 2,
          lastMessage: {
            id: '101',
            senderId: 'user2',
            text: 'Hey! Want to play some Fortnite later?',
            timestamp: '2023-05-20T09:15:00Z',
            read: false,
          },
          user: {
            id: 'user2',
            name: 'Alex Johnson',
            age: 24,
            bio: 'Professional gamer and streamer. Love FPS and strategy games. Usually play in the evenings PST.',
            avatar:
              'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&q=80',
            gamePreferences: ['Fortnite', 'Valorant', 'League of Legends'],
            onlineStatus: true,
            location: 'San Francisco, CA',
            skillLevel: 'Expert',
            favoriteGames: ['Fortnite', 'Apex Legends', 'Call of Duty'],
          },
        },
        {
          id: '2',
          userId: 'user3',
          matchedOn: '2023-05-10T11:20:00Z',
          unreadCount: 0,
          lastMessage: {
            id: '201',
            senderId: 'me',
            text: 'Great game yesterday! When are you free again?',
            timestamp: '2023-05-19T18:45:00Z',
            read: true,
          },
          user: {
            id: 'user3',
            name: 'Sam Rivera',
            age: 27,
            bio: 'Casual gamer looking for duo partners. Main support roles. Available on weekends.',
            avatar:
              'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&q=80',
            gamePreferences: ['League of Legends', 'Overwatch', 'Apex Legends'],
            onlineStatus: false,
            lastOnline: '2 hours ago',
            location: 'New York, NY',
            skillLevel: 'Intermediate',
            favoriteGames: ['League of Legends', 'Minecraft', 'Among Us'],
          },
        },
        {
          id: '3',
          userId: 'user4',
          matchedOn: '2023-05-05T16:40:00Z',
          unreadCount: 5,
          lastMessage: {
            id: '301',
            senderId: 'user4',
            text: 'I found a new strategy we should try!',
            timestamp: '2023-05-20T10:30:00Z',
            read: false,
          },
          user: {
            id: 'user4',
            name: 'Jordan Smith',
            age: 22,
            bio: 'Competitive player ranking in top 500. Looking for serious teammates for tournament play.',
            avatar:
              'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&q=80',
            gamePreferences: ['Valorant', 'CS:GO', 'Rainbow Six Siege'],
            onlineStatus: true,
            location: 'Chicago, IL',
            skillLevel: 'Professional',
            favoriteGames: ['Valorant', 'CS:GO', 'Dota 2'],
          },
        },
      ];

      // Comunidades unidas (localStorage)
      let communityMatches: Match[] = [];
      if (typeof window !== 'undefined') {
        const rawJoined = localStorage.getItem('joinedCommunities');
        const joined: { id: number; name: string; gameName: string }[] =
          rawJoined ? JSON.parse(rawJoined) : [];

        const rawMsgs = localStorage.getItem('communityMessages');
        const allMsgs: Record<string, Message[]> = rawMsgs
          ? JSON.parse(rawMsgs)
          : {};

        communityMatches = joined.map((c) => {
          const msgs = allMsgs[c.id] || [];
          const lastMessage = msgs.length ? msgs[msgs.length - 1] : undefined;

          return {
            id: `community-${c.id}`,
            userId: `community-${c.id}`,
            matchedOn: new Date().toISOString(),
            unreadCount: 0,
            lastMessage,
            isCommunity: true,
            communityId: c.id,
            user: {
              id: `community-${c.id}`,
              name: `[Comunidad] ${c.name}`,
              age: 0,
              bio: `Chat de la comunidad ${c.name}`,
              avatar: '/favicon.ico', // icono genérico por ahora
              gamePreferences: [c.gameName],
              onlineStatus: true,
              location: '',
              skillLevel: 'Comunidad',
              favoriteGames: [c.gameName],
            },
          };
        });
      }

      setMatches([...communityMatches, ...mockMatches]);
      setLoading(false);
    };

    loadData();
  }, []);

  // Cargar mensajes cuando se selecciona un chat
  useEffect(() => {
    if (!selectedMatch) {
      setMessages([]);
      return;
    }

    // Si es comunidad: leer de localStorage por communityId
    if (selectedMatch.isCommunity && selectedMatch.communityId) {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem('communityMessages');
        const all: Record<string, Message[]> = raw ? JSON.parse(raw) : {};
        const msgs = all[selectedMatch.communityId] || [];
        setMessages(msgs);
      } else {
        setMessages([]);
      }
    } else {
      // Chat 1 a 1: seguimos usando mock
      const mockMessages: Message[] = [
        {
          id: '1',
          senderId: selectedMatch.userId,
          text: `Hey there! I saw we both play ${selectedMatch.user.gamePreferences[0]}.`,
          timestamp: '2023-05-15T14:32:00Z',
          read: true,
        },
        {
          id: '2',
          senderId: 'me',
          text: "Yes! I'm looking for a duo partner for the tournament next week.",
          timestamp: '2023-05-15T14:35:00Z',
          read: true,
        },
        {
          id: '3',
          senderId: selectedMatch.userId,
          text: "That would be awesome! I'm available most evenings.",
          timestamp: '2023-05-15T14:40:00Z',
          read: true,
        },
      ];

      setMessages(mockMessages);
    }

    if (isMobile) {
      setShowSidebar(false);
    }
  }, [selectedMatch, isMobile]);

  const handleSelectMatch = (match: Match) => {
    setSelectedMatch(match);
    setShowProfile(false);

    // Marcar como leído
    if (match.unreadCount > 0) {
      const updatedMatches = matches.map((m) =>
        m.id === match.id ? { ...m, unreadCount: 0 } : m
      );
      setMatches(updatedMatches);
    }
  };

  const handleBackToMatches = () => {
    setSelectedMatch(null);
    if (isMobile) {
      setShowSidebar(true);
    }
  };

  const handleSendMessage = () => {
    if (newMessage.trim() === '' || !selectedMatch) return;

    const message: Message = {
      id: Date.now().toString(),
      senderId: 'me',
      text: newMessage,
      timestamp: new Date().toISOString(),
      read: true,
    };

    const updatedMessages = [...messages, message];
    setMessages(updatedMessages);
    setNewMessage('');

    // Si es comunidad, persistimos en localStorage
    if (selectedMatch.isCommunity && selectedMatch.communityId) {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem('communityMessages');
        const all: Record<string, Message[]> = raw ? JSON.parse(raw) : {};
        all[selectedMatch.communityId] = updatedMessages;
        localStorage.setItem('communityMessages', JSON.stringify(all));
      }
    }

    // Actualizar lastMessage en la lista de matches
    const updatedMatches = matches.map((match) =>
      match.id === selectedMatch.id
        ? { ...match, lastMessage: message, unreadCount: 0 }
        : match
    );
    setMatches(updatedMatches);
  };

  const handleLeaveCommunity = () => {
    if (!selectedMatch?.isCommunity || !selectedMatch.communityId) return;

    if (
      typeof window !== 'undefined' &&
      !window.confirm('¿Seguro que querés salir de esta comunidad?')
    ) {
      return;
    }

    const communityId = selectedMatch.communityId;

    // 1) Sacar de joinedCommunities
    if (typeof window !== 'undefined') {
      const rawJoined = localStorage.getItem('joinedCommunities');
      const joined = rawJoined ? JSON.parse(rawJoined) : [];
      const filtered = joined.filter((c: any) => c.id !== communityId);
      localStorage.setItem('joinedCommunities', JSON.stringify(filtered));

      // 2) Borrar historial de mensajes de esa comunidad
      const rawMsgs = localStorage.getItem('communityMessages');
      const allMsgs: Record<string, Message[]> = rawMsgs
        ? JSON.parse(rawMsgs)
        : {};
      delete allMsgs[communityId];
      localStorage.setItem('communityMessages', JSON.stringify(allMsgs));
    }

    // 3) Sacar el chat de la lista
    setMatches((prev) =>
      prev.filter(
        (m) => !(m.isCommunity && m.communityId === communityId)
      )
    );

    // 4) Reset de selección
    setSelectedMatch(null);
    setMessages([]);
    if (isMobile) setShowSidebar(true);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (diffInHours < 48) {
      return 'Ayer';
    } else {
      const monthNames = {
        short: [
          'ene',
          'feb',
          'mar',
          'abr',
          'may',
          'jun',
          'jul',
          'ago',
          'sep',
          'oct',
          'nov',
          'dic',
        ],
      };

      const day = date.getDate();
      const month = monthNames.short[date.getMonth()];
      const year = date.getFullYear();

      if (year !== now.getFullYear()) {
        return `${day} ${month} ${year}`;
      } else {
        return `${day} ${month}`;
      }
    }
  };

  const filteredMatches = matches.filter((match) =>
    match.user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className={styles.messagesLoading}>
        <div className={styles.loadingSpinner}></div>
      </div>
    );
  }

  return (
    <div className={styles.messagesContainer}>
      {/* Sidebar */}
      <div
        className={`${styles.matchesSidebar} ${
          showSidebar ? styles.active : ''
        }`}
      >
        <div className={styles.sidebarHeader}>
          <Image
            src="/favicon.ico"
            alt="DuoFinder"
            width={40}
            height={40}
            className={styles.logo}
          />
          <span className={styles.brandText}>Mensajes</span>
          <div className={styles.searchContainer}>
            <input
              type="text"
              placeholder="Buscá duos o comunidades..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>

        <div className={styles.matchesList}>
          {filteredMatches.map((match) => (
            <div
              key={match.id}
              className={`${styles.matchItem} ${
                selectedMatch?.id === match.id ? styles.selected : ''
              }`}
              onClick={() => handleSelectMatch(match)}
            >
              <div className={styles.matchAvatar}>
                <Image
                  src={match.user.avatar}
                  alt={match.user.name}
                  width={50}
                  height={50}
                  className={styles.avatarImage}
                />
                {match.user.onlineStatus && (
                  <div className={styles.onlineIndicator}></div>
                )}
              </div>
              <div className={styles.matchInfo}>
                <div className={styles.matchHeader}>
                  <h3>{match.user.name}</h3>
                  <span className={styles.messageTime}>
                    {match.lastMessage &&
                      formatTime(match.lastMessage.timestamp)}
                  </span>
                </div>
                <div className={styles.matchContent}>
                  <p className={styles.lastMessage}>
                    {match.lastMessage?.text ||
                      (match.isCommunity
                        ? 'Empezá la conversación en esta comunidad'
                        : '')}
                  </p>
                  {match.unreadCount > 0 && (
                    <span className={styles.unreadCount}>
                      {match.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat */}
      <div
        className={`${styles.chatContainer} ${
          !showSidebar ? styles.active : ''
        }`}
      >
        {selectedMatch ? (
          <>
            <div className={styles.chatHeader}>
              {isMobile && (
                <button
                  className={styles.backButton}
                  onClick={handleBackToMatches}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M11.03 3.97a.75.75 0 010 1.06l-6.22 6.22H21a.75.75 0 010 1.5H4.81l6.22 6.22a.75.75 0 11-1.06 1.06l-7.5-7.5a.75.75 0 010-1.06l7.5-7.5a.75.75 0 011.06 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}
              <div
                className={styles.userInfo}
                onClick={() => setShowProfile(!showProfile)}
              >
                <div className={styles.chatAvatar}>
                  <Image
                    src={selectedMatch.user.avatar}
                    alt={selectedMatch.user.name}
                    width={50}
                    height={50}
                    className={styles.avatarImage}
                  />
                  {selectedMatch.user.onlineStatus && (
                    <div className={styles.onlineIndicator}></div>
                  )}
                </div>
                <div className={styles.userDetails}>
                  <h2>{selectedMatch.user.name}</h2>
                  {!selectedMatch.isCommunity && (
                    <p>
                      {selectedMatch.user.onlineStatus
                        ? 'Online now'
                        : `Last online: ${
                            selectedMatch.user.lastOnline || 'recently'
                          }`}
                    </p>
                  )}
                  {selectedMatch.isCommunity && (
                    <p>Chat de comunidad</p>
                  )}
                </div>
              </div>

              {selectedMatch.isCommunity ? (
                              <button
                type="button"
                className={styles.leaveCommunityBtn}
                onClick={handleLeaveCommunity}
              >
                Salir de la comunidad
              </button>

              ) : (
                <button
                  className={styles.profileToggle}
                  onClick={() => setShowProfile(!showProfile)}
                >
                  {showProfile ? 'Chat' : 'Perfil'}
                </button>
              )}
            </div>

            {/* Perfil o chat */}
            {showProfile && !selectedMatch.isCommunity ? (
              <div className={styles.profileView}>
                <div className={styles.profileHeader}>
                  <div className={styles.profileAvatar}>
                    <Image
                      src={selectedMatch.user.avatar}
                      alt={selectedMatch.user.name}
                      width={80}
                      height={80}
                      className={styles.avatarImage}
                    />
                    {selectedMatch.user.onlineStatus && (
                      <div className={styles.onlineIndicator}></div>
                    )}
                  </div>
                  <h2>
                    {selectedMatch.user.name}, {selectedMatch.user.age}
                  </h2>
                  <p className={styles.userLocation}>
                    {selectedMatch.user.location}
                  </p>
                  <p className={styles.userSkill}>
                    {selectedMatch.user.skillLevel} level player
                  </p>
                </div>

                <div className={styles.profileSection}>
                  <h3>Sobre mí</h3>
                  <p>{selectedMatch.user.bio}</p>
                </div>

                <div className={styles.profileSection}>
                  <h3>Juegos</h3>
                  <div className={styles.gameTags}>
                    {selectedMatch.user.favoriteGames.map(
                      (game, index) => (
                        <span
                          key={index}
                          className={styles.gameTag}
                        >
                          {game}
                        </span>
                      )
                    )}
                  </div>
                </div>

                <div className={styles.profileSection}>
                  <h3>Juegos preferidos</h3>
                  <div className={styles.gameTags}>
                    {selectedMatch.user.gamePreferences.map(
                      (game, index) => (
                        <span
                          key={index}
                          className={styles.gameTag}
                        >
                          {game}
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className={styles.chatMessages}>
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`${styles.message} ${
                        message.senderId === 'me'
                          ? styles.sent
                          : styles.received
                      }`}
                    >
                      <div className={styles.messageContent}>
                        <p>{message.text}</p>
                        <span className={styles.messageTime}>
                          {formatTime(message.timestamp)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className={styles.messageInputContainer}>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === 'Enter' && handleSendMessage()
                    }
                    placeholder="Escribí tu mensaje..."
                    className={styles.messageInput}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={newMessage.trim() === ''}
                    className={styles.sendButton}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                    </svg>
                  </button>
                </div>
              </>
            )}
          </>
        ) : (
          <div className={styles.noChatSelected}>
            <div className={styles.noChatIcon}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.44 1.223zM8.25 10.875a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25zM10.875 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875-1.125a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h2>Tus mensajes</h2>
            <p>Seleccioná un match o comunidad para mandar un mensaje</p>
            <button
              onClick={() => router.push('/discover')}
              className={styles.findPartnersButton}
            >
              Encontrá tu próximo dúo
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;
