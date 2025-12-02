// app/messages/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styles from '@/styles/pages/messages.module.css';
import Image from 'next/image';
import { chatService } from '@/lib/apiService';
import type {
  FrontendChat,
  FrontendMessage,
  JoinedCommunity,
  CommunityMessages,
  ApiMatchResponse
} from './message.types';

const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
      const checkIsMobile = () => {
        setIsMobile(window.innerWidth < 768);
      };

      checkIsMobile();
      window.addEventListener('resize', checkIsMobile);
      return () => window.removeEventListener('resize', checkIsMobile);
    }, []);

    return isMobile;
  };

const MessagesPage = () => {
  const [matches, setMatches] = useState<FrontendChat[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<FrontendChat | null>(null);
  const [messages, setMessages] = useState<FrontendMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const router = useRouter();

  const isMobile = useIsMobile();

  // Cargar todos los matches y su información de chat
  const loadMatchesWithChatInfo = useCallback(async () => {
    try {
      setLoading(true);
      
      // 1. Obtener todos los matches del usuario
      let apiMatches: ApiMatchResponse[] = [];
      try {
        apiMatches = await chatService.getAllMatches();
        console.log('Matches obtenidos:', apiMatches);
      } catch (error) {
        console.error('Error loading matches from API:', error);
        apiMatches = [];
      }
      
      // 2. Para cada match, obtener la información del chat
      const chatsWithInfo = await Promise.all(
        apiMatches.map(async (match) => {
          try {
            // Obtener información del chat para este match
            const chatInfo = await chatService.getChatInfo(match.match_id || match.id);
            console.log(`Chat info para match ${match.match_id || match.id}:`, chatInfo);
            
            // Combinar información del match con información del chat
            return chatService.combineMatchAndChatInfo(match, chatInfo);
          } catch (error) {
            console.error(`Error loading chat info for match ${match.match_id || match.id}:`, error);
            // Si hay error, crear chat básico con la información del match
            return {
              id: `match-${match.match_id || match.id}`,
              matchId: match.match_id || match.id,
              userId: match.other_user_id || 0,
              matchedOn: match.created_at || new Date().toISOString(),
              lastMessage: undefined,
              unreadCount: 0,
              user: {
                id: match.other_user_id || 0,
                name: match.other_user_name || `Usuario ${match.other_user_id || match.id}`,
                avatar: match.other_user_avatar || '/default-avatar.png',
                gamePreferences: [],
                onlineStatus: false,
                location: '',
                skillLevel: '',
                favoriteGames: []
              }
            } as FrontendChat;
          }
        })
      );

      // 3. Cargar comunidades desde localStorage
      let communityChats: FrontendChat[] = [];
      if (typeof window !== 'undefined') {
        const rawJoined = localStorage.getItem('joinedCommunities');
        const joined: JoinedCommunity[] = rawJoined ? JSON.parse(rawJoined) : [];
        
        const rawMsgs = localStorage.getItem('communityMessages');
        const allMsgs: CommunityMessages = rawMsgs ? JSON.parse(rawMsgs) : {};
        
        communityChats = joined.map(c => {
          const msgs = allMsgs[c.id.toString()] || [];
          const lastMessage = msgs.length > 0 ? msgs[msgs.length - 1] : undefined;
          
          return {
            id: `community-${c.id}`,
            matchId: 0,
            userId: 0,
            matchedOn: new Date().toISOString(),
            unreadCount: 0,
            lastMessage: lastMessage,
            isCommunity: true,
            communityId: c.id,
            user: {
              id: 0,
              name: `[Comunidad] ${c.name}`,
              avatar: '/favicon.ico',
              bio: `Comunidad de ${c.gameName}`,
              gamePreferences: [c.gameName],
              onlineStatus: true,
              location: '',
              skillLevel: 'Comunidad',
              favoriteGames: [c.gameName]
            }
          };
        });
      }

      // 4. Combinar todos los chats
      const allChats = [...communityChats, ...chatsWithInfo]
        .filter(chat => chat !== null)
        .sort((a, b) => {
          // Ordenar por si tiene último mensaje primero, luego por fecha
          if (a.lastMessage && !b.lastMessage) return -1;
          if (!a.lastMessage && b.lastMessage) return 1;
          
          // Si ambos tienen último mensaje o no tienen, ordenar por fecha
          const getDate = (chat: FrontendChat) => {
            return chat.lastMessage?.created_at || chat.matchedOn;
          };
          
          const dateA = new Date(getDate(a)).getTime();
          const dateB = new Date(getDate(b)).getTime();
          return dateB - dateA; // Orden descendente (más reciente primero)
        });

      console.log('Chats finales:', allChats);
      setMatches(allChats);
    } catch (error) {
      console.error('Error loading matches with chat info:', error);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMatchesWithChatInfo();
  }, [loadMatchesWithChatInfo]);

  // Cargar todos los mensajes cuando se selecciona un chat
  useEffect(() => {
  console.log('=== useEffect de mensajes activado ===');
  console.log('selectedMatch:', selectedMatch);
  console.log('selectedMatch?.matchId:', selectedMatch?.matchId);
  console.log('selectedMatch?.isCommunity:', selectedMatch?.isCommunity);
  
  if (!selectedMatch) {
    console.log('No hay match seleccionado, limpiando mensajes');
    setMessages([]);
    return;
  }

  const loadAllMessages = async () => {
    console.log('=== loadAllMessages ejecutándose ===');
    
    // Si es comunidad: usar localStorage
    if (selectedMatch.isCommunity && selectedMatch.communityId) {
      console.log('Es comunidad, usando localStorage');
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem('communityMessages');
        const all: CommunityMessages = raw ? JSON.parse(raw) : {};
        const msgs = all[selectedMatch.communityId.toString()] || [];
        console.log('Mensajes de comunidad:', msgs);
        setMessages(msgs);
      }
    } else if (selectedMatch.matchId) {
      // Chat real: cargar TODOS los mensajes del match
      try {
        console.log(`Cargando mensajes reales para match ${selectedMatch.matchId}`);
        const allMessages = await chatService.getChatMessages(selectedMatch.matchId);
        console.log('Mensajes obtenidos de API:', allMessages);
        
        if (Array.isArray(allMessages)) {
          console.log(`Se obtuvieron ${allMessages.length} mensajes`);
          setMessages(allMessages);
          
          // Actualizar el último mensaje con la información real
          if (allMessages.length > 0) {
            const lastRealMessage = allMessages[allMessages.length - 1];
            console.log('Último mensaje real:', lastRealMessage);
            
            setMatches(prev => {
              console.log('Actualizando matches con último mensaje');
              return prev.map(m => {
                if (m.id === selectedMatch.id) {
                  return {
                    ...m,
                    lastMessage: lastRealMessage
                  };
                }
                return m;
              });
            });
          }
        } else {
          console.error('Los mensajes no son un array:', allMessages);
          setMessages([]);
        }
      } catch (error) {
        console.error('Error loading all messages:', error);
        setMessages([]);
      }
    }

    if (isMobile) {
      console.log('Es móvil, ocultando sidebar');
      setShowSidebar(false);
    }
  };

  loadAllMessages();
}, [selectedMatch, isMobile]);

  const handleSelectMatch = (match: FrontendChat) => {
  console.log('=== handleSelectMatch llamado ===');
  console.log('Match seleccionado:', match);
  console.log('match.id:', match.id);
  console.log('match.matchId:', match.matchId);
  console.log('match.user.name:', match.user.name);
  
  setSelectedMatch(match);
  setShowProfile(false);
  setNewMessage('');
  
  console.log('selectedMatch después de setSelectedMatch:', match);
};

  const handleBackToMatches = () => {
    setSelectedMatch(null);
    if (isMobile) {
      setShowSidebar(true);
    }
  };

  const handleSendMessage = async () => {
    if (newMessage.trim() === '' || !selectedMatch || sendingMessage) return;

    try {
      setSendingMessage(true);
      
      if (selectedMatch.isCommunity && selectedMatch.communityId) {
        // Mensaje en comunidad (localStorage)
        const message: FrontendMessage = {
          id: Date.now(),
          match_id: 0,
          sender_id: 0,
          content: newMessage.trim(),
          created_at: new Date().toISOString(),
          read: true
        };

        const updatedMessages = [...messages, message];
        setMessages(updatedMessages);
        setNewMessage('');

        // Persistir en localStorage
        if (typeof window !== 'undefined') {
          const raw = localStorage.getItem('communityMessages');
          const all: CommunityMessages = raw ? JSON.parse(raw) : {};
          const communityKey = selectedMatch.communityId.toString();
          all[communityKey] = updatedMessages;
          localStorage.setItem('communityMessages', JSON.stringify(all));
          
          // Actualizar el último mensaje en la lista
          setMatches(prev => prev.map(m => {
            if (m.id === selectedMatch.id) {
              return {
                ...m,
                lastMessage: message
              };
            }
            return m;
          }));
        }
      } else if (selectedMatch.matchId) {
        // Mensaje real: enviar a API
        const sentMessage = await chatService.sendMessage(selectedMatch.matchId, newMessage.trim());
        
        const updatedMessages = [...messages, sentMessage];
        setMessages(updatedMessages);
        setNewMessage('');
        
        // Actualizar el último mensaje en la lista
        setMatches(prev => prev.map(m => {
          if (m.id === selectedMatch.id) {
            return {
              ...m,
              lastMessage: sentMessage
            };
          }
          return m;
        }));
      }

    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error al enviar el mensaje. Por favor, intenta de nuevo.');
    } finally {
      setSendingMessage(false);
    }
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
      const joined: JoinedCommunity[] = rawJoined ? JSON.parse(rawJoined) : [];
      const filtered = joined.filter((c) => c.id !== communityId);
      localStorage.setItem('joinedCommunities', JSON.stringify(filtered));

      // 2) Borrar historial de mensajes de esa comunidad
      const rawMsgs = localStorage.getItem('communityMessages');
      const allMsgs: CommunityMessages = rawMsgs
        ? JSON.parse(rawMsgs)
        : {};
      delete allMsgs[communityId.toString()];
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
    try {
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
        const monthNames = [
          'ene', 'feb', 'mar', 'abr', 'may', 'jun',
          'jul', 'ago', 'sep', 'oct', 'nov', 'dic'
        ];

        const day = date.getDate();
        const month = monthNames[date.getMonth()];
        const year = date.getFullYear();

        if (year !== now.getFullYear()) {
          return `${day} ${month} ${year}`;
        } else {
          return `${day} ${month}`;
        }
      }
    } catch (error) {
      console.log(error);
      return '';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredMatches = matches.filter((match) =>
    match.user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className={styles.messagesLoading}>
        <div className={styles.loadingSpinner}></div>
        <p className={styles.loadingText}>Cargando chats...</p>
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
          {filteredMatches.length === 0 ? (
            <div className={styles.noMatches}>
              <p>No tenés chats todavía</p>
              <button
                onClick={() => router.push('/discover')}
                className={styles.findPartnersButton}
              >
                Encontrá tu próximo dúo
              </button>
            </div>
          ) : (
            filteredMatches.map((match) => (
              <div
                key={match.id}
                className={`${styles.matchItem} ${
                  selectedMatch?.id === match.id ? styles.selected : ''
                }`}
                onClick={() => handleSelectMatch(match)}
              >
                <div className={styles.matchAvatar}>
                  <Image
                    src={match.user.avatar || '/default-avatar.png'}
                    alt={match.user.name}
                    width={50}
                    height={50}
                    className={styles.avatarImage}
                  />
                  {match.user.onlineStatus && !match.isCommunity && (
                    <div className={styles.onlineIndicator}></div>
                  )}
                  {match.isCommunity && (
                    <div className={styles.communityIndicator}>
                      <span>C</span>
                    </div>
                  )}
                </div>
                <div className={styles.matchInfo}>
                  <div className={styles.matchHeader}>
                    <h3>{match.user.name}</h3>
                    <span className={styles.messageTime}>
                      {match.lastMessage &&
                        formatTime(match.lastMessage.created_at)}
                    </span>
                  </div>
                  <div className={styles.matchContent}>
                    <p className={styles.lastMessage}>
                      {match.lastMessage?.content 
                        ? (match.lastMessage.content.length > 30 
                            ? match.lastMessage.content.substring(0, 30) + '...'
                            : match.lastMessage.content)
                        : (match.isCommunity
                            ? 'Empezá la conversación...'
                            : 'Nuevo match - ¡Decí hola!')}
                    </p>
                    {match.unreadCount > 0 && (
                      <span className={styles.unreadCount}>
                        {match.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
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
                onClick={() => !selectedMatch.isCommunity && setShowProfile(!showProfile)}
              >
                <div className={styles.chatAvatar}>
                  <Image
                    src={selectedMatch.user.avatar || '/default-avatar.png'}
                    alt={selectedMatch.user.name}
                    width={50}
                    height={50}
                    className={styles.avatarImage}
                  />
                  {selectedMatch.user.onlineStatus && !selectedMatch.isCommunity && (
                    <div className={styles.onlineIndicator}></div>
                  )}
                  {selectedMatch.isCommunity && (
                    <div className={styles.communityIndicator}>
                      <span>C</span>
                    </div>
                  )}
                </div>
                <div className={styles.userDetails}>
                  <h2>{selectedMatch.user.name}</h2>
                  {!selectedMatch.isCommunity && (
                    <p>
                      {selectedMatch.user.onlineStatus
                        ? 'Online ahora'
                        : `Última conexión: ${
                            selectedMatch.user.lastOnline || 'recientemente'
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
                  Salir
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
                      src={selectedMatch.user.avatar || '/default-avatar.png'}
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
                    {selectedMatch.user.name}
                    {selectedMatch.user.age && `, ${selectedMatch.user.age}`}
                  </h2>
                  <p className={styles.userLocation}>
                    {selectedMatch.user.location || 'Ubicación no especificada'}
                  </p>
                  <p className={styles.userSkill}>
                    {selectedMatch.user.skillLevel ? `Nivel ${selectedMatch.user.skillLevel}` : 'Nivel no especificado'}
                  </p>
                </div>

                <div className={styles.profileSection}>
                  <h3>Sobre mí</h3>
                  <p>{selectedMatch.user.bio || 'No hay descripción'}</p>
                </div>

                <div className={styles.profileSection}>
                  <h3>Juegos favoritos</h3>
                  <div className={styles.gameTags}>
                    {selectedMatch.user.favoriteGames && selectedMatch.user.favoriteGames.length > 0 ? (
                      selectedMatch.user.favoriteGames.map(
                        (game: string, index: number) => (
                          <span
                            key={index}
                            className={styles.gameTag}
                          >
                            {game}
                          </span>
                        )
                      )
                    ) : (
                      <p className={styles.noGames}>No especificados</p>
                    )}
                  </div>
                </div>

                <div className={styles.profileSection}>
                  <h3>Preferencias</h3>
                  <div className={styles.gameTags}>
                    {selectedMatch.user.gamePreferences && selectedMatch.user.gamePreferences.length > 0 ? (
                      selectedMatch.user.gamePreferences.map(
                        (game: string, index: number) => (
                          <span
                            key={index}
                            className={styles.gameTag}
                          >
                            {game}
                          </span>
                        )
                      )
                    ) : (
                      <p className={styles.noGames}>No especificadas</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className={styles.chatMessages}>
                  {messages.length === 0 ? (
                    <div className={styles.noMessages}>
                      <p>No hay mensajes todavía</p>
                      <p className={styles.startConversation}>
                        {selectedMatch.isCommunity 
                          ? '¡Sé el primero en escribir en esta comunidad!' 
                          : '¡Iniciá la conversación!'}
                      </p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`${styles.message} ${
                          message.sender_id !== selectedMatch.userId
                            ? styles.sent
                            : styles.received
                        }`}
                      >
                        <div className={styles.messageContent}>
                          <p>{message.content}</p>
                          <span className={styles.messageTime}>
                            {formatTime(message.created_at)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className={styles.messageInputContainer}>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      selectedMatch.isCommunity
                        ? "Escribí un mensaje para la comunidad..."
                        : "Escribí tu mensaje..."
                    }
                    className={styles.messageInput}
                    disabled={sendingMessage}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={newMessage.trim() === '' || sendingMessage}
                    className={styles.sendButton}
                  >
                    {sendingMessage ? (
                      <div className={styles.sendingSpinner}></div>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                      </svg>
                    )}
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