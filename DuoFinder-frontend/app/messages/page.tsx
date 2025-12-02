// app/messages/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styles from '@/styles/pages/messages.module.css';
import Image from 'next/image';
import { chatService } from '@/lib/apiService';
import type {
  MessagesUserProfile,
  FrontendChat,
  FrontendMessage,
  ApiChatListItem,
  JoinedCommunity,
  CommunityMessages
} from './mssage.types';

const MessagesPage = () => {
  const [matches, setMatches] = useState<FrontendChat[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<FrontendChat | null>(null);
  const [messages, setMessages] = useState<FrontendMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const router = useRouter();

  // Función para convertir datos de API a tipos del frontend
  const convertApiChatToFrontend = (apiChat: any): FrontendChat => {
    return {
      id: `match-${apiChat.match_id || apiChat.ID || apiChat.id}`,
      matchId: apiChat.match_id || apiChat.ID || apiChat.id || 0,
      userId: apiChat.other_user?.id || apiChat.userId || 0,
      matchedOn: new Date().toISOString(),
      lastMessage: apiChat.last_message ? {
        id: apiChat.last_message.id || apiChat.last_message.ID || 0,
        match_id: apiChat.last_message.match_id || apiChat.last_message.MatchesID || 0,
        sender_id: apiChat.last_message.sender_id || apiChat.last_message.SenderID || 0,
        content: apiChat.last_message.content || apiChat.last_message.ContentChat || '',
        created_at: apiChat.last_message.created_at || apiChat.last_message.CreatedDate || new Date().toISOString(),
        read: apiChat.last_message.read || apiChat.last_message.ReadChat || false
      } : undefined,
      unreadCount: apiChat.unread_count || apiChat.unreadCount || 0,
      user: {
        id: apiChat.other_user?.id || apiChat.userId || 0,
        name: apiChat.other_user?.name || `User ${apiChat.other_user?.id || apiChat.userId || 0}`,
        username: apiChat.other_user?.username || '',
        age: apiChat.other_user?.age || 0,
        bio: apiChat.other_user?.bio || '',
        avatar: apiChat.other_user?.avatar || apiChat.other_user?.ImageURL || '/default-avatar.png',
        gamePreferences: apiChat.other_user?.gamePreferences || [],
        onlineStatus: apiChat.other_user?.onlineStatus || false,
        location: apiChat.other_user?.location || '',
        skillLevel: apiChat.other_user?.skillLevel || '',
        favoriteGames: apiChat.other_user?.favoriteGames || []
      }
    };
  };

  // Función para convertir mensajes de API
  const convertApiMessageToFrontend = (apiMessage: any): FrontendMessage => {
    return {
      id: apiMessage.id || apiMessage.ID || 0,
      match_id: apiMessage.match_id || apiMessage.MatchesID || 0,
      sender_id: apiMessage.sender_id || apiMessage.SenderID || 0,
      content: apiMessage.content || apiMessage.ContentChat || '',
      created_at: apiMessage.created_at || apiMessage.CreatedDate || new Date().toISOString(),
      read: apiMessage.read || apiMessage.ReadChat || false
    };
  };

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
  const loadChats = useCallback(async () => {
    try {
      setLoading(true);
      
      // 1. Cargar chats de la API
      let apiChats: any[] = [];
      try {
        apiChats = await chatService.getChats();
      } catch (error) {
        console.error('Error loading chats from API:', error);
        // Fallback a datos mock si la API falla
        apiChats = [];
      }
      
      // 2. Convertir a FrontendChat
      const realMatches: FrontendChat[] = apiChats.map(chatItem => 
        convertApiChatToFrontend(chatItem)
      );

      // 3. Cargar comunidades desde localStorage
      let communityMatches: FrontendChat[] = [];
      if (typeof window !== 'undefined') {
        const rawJoined = localStorage.getItem('joinedCommunities');
        const joined: JoinedCommunity[] = rawJoined ? JSON.parse(rawJoined) : [];
        
        const rawMsgs = localStorage.getItem('communityMessages');
        const allMsgs: CommunityMessages = rawMsgs ? JSON.parse(rawMsgs) : {};
        
        communityMatches = joined.map(c => {
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
              gamePreferences: [c.gameName],
              onlineStatus: true,
              location: '',
              skillLevel: 'Comunidad',
              favoriteGames: [c.gameName]
            }
          };
        });
      }

      setMatches([...communityMatches, ...realMatches]);
    } catch (error) {
      console.error('Error loading chats:', error);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  // Cargar mensajes cuando se selecciona un chat
  useEffect(() => {
    if (!selectedMatch) {
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      // Si es comunidad: usar localStorage
      if (selectedMatch.isCommunity && selectedMatch.communityId) {
        if (typeof window !== 'undefined') {
          const raw = localStorage.getItem('communityMessages');
          const all: CommunityMessages = raw ? JSON.parse(raw) : {};
          const msgs = all[selectedMatch.communityId.toString()] || [];
          setMessages(msgs);
        }
      } else if (selectedMatch.matchId) {
        // Chat real: cargar desde API
        try {
          const apiMessages = await chatService.getChatMessages(selectedMatch.matchId);
          const convertedMessages = apiMessages.map((msg: any) => 
            convertApiMessageToFrontend(msg)
          );
          setMessages(convertedMessages);
          
          // Marcar mensajes como leídos
          if (selectedMatch.unreadCount > 0) {
            try {
              await chatService.markMessagesAsRead(selectedMatch.matchId);
            } catch (error) {
              console.error('Error marking messages as read:', error);
            }
          }
        } catch (error) {
          console.error('Error loading messages:', error);
          setMessages([]);
        }
      }

      if (isMobile) {
        setShowSidebar(false);
      }
    };

    loadMessages();
  }, [selectedMatch, isMobile]);

  const handleSelectMatch = (match: FrontendChat) => {
    setSelectedMatch(match);
    setShowProfile(false);

    // Marcar como leído en el frontend
    if (match.unreadCount > 0) {
      const updatedMatches = matches.map(m =>
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
        }
      } else if (selectedMatch.matchId) {
        // Mensaje real: enviar a API
        const sentMessage = await chatService.sendMessage(selectedMatch.matchId, newMessage.trim());
        const convertedMessage = convertApiMessageToFrontend(sentMessage);
        
        const updatedMessages = [...messages, convertedMessage];
        setMessages(updatedMessages);
        setNewMessage('');
      }

      // Actualizar lastMessage en la lista
      const updatedMatches = matches.map(match => {
        if (match.id === selectedMatch.id) {
          const lastMsg = messages.length > 0 ? messages[messages.length - 1] : undefined;
          return {
            ...match,
            lastMessage: lastMsg,
            unreadCount: 0
          };
        }
        return match;
      });
      setMatches(updatedMatches);

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
                            : match.user.bio?.substring(0, 30) || '')}
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
                        (game, index) => (
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
                        (game, index) => (
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