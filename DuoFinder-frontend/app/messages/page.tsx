// app/messages/page.tsx
'use client';

/* eslint-disable react/no-unescaped-entities */


import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import styles from '@/styles/pages/messages.module.css';
import Image from 'next/image';
import { chatService } from '@/lib/apiService';
import type {
  FrontendChat,
  FrontendMessage,
  ApiMatchResponse,
  ChatInfoResponse
} from './message.types';

// Hook para obtener el ID del usuario actual
const useCurrentUserId = (): number | null => {
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const getUserId = () => {
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          setUserId(user.id || null);
        } catch (error) {
          console.error('Error parsing user data:', error);
          setUserId(null);
        }
      }
    };

    getUserId();
  }, []);

  return userId;
};

// Hook para detectar si es móvil
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
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
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const router = useRouter();
  
  const isMobile = useIsMobile();
  const currentUserId = useCurrentUserId();

  useEffect(() => {
    console.log('=== currentUserId actualizado ===');
    console.log('currentUserId:', currentUserId);
    console.log('Tipo:', typeof currentUserId);
    
    // También verifica qué hay en localStorage
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('user');
      console.log('userData en localStorage:', userData);
      if (userData) {
        try {
          const user = JSON.parse(userData);
          console.log('Usuario parseado:', user);
          console.log('User ID:', user.id);
        } catch (e) {
          console.error('Error parseando userData:', e);
        }
      }
    }
  }, [currentUserId]);

  // Lógica simplificada: qué mostrar
  const showChatView = !!selectedMatch;
  const showListView = !selectedMatch || !isMobile;

  // Cargar todos los matches y su información de chat
  const loadMatchesWithChatInfo = useCallback(async () => {
    try {
      setLoading(true);
      
      let apiMatches: ApiMatchResponse[] = [];
      try {
        apiMatches = await chatService.getAllMatches();
        console.log('Matches obtenidos:', apiMatches);
      } catch (error) {
        console.error('Error loading matches from API:', error);
        apiMatches = [];
      }
      
      // Para cada match, obtener información del chat
      const chatsWithInfo = await Promise.all(
        apiMatches.map(async (match) => {
          try {
            const chatInfo: ChatInfoResponse = await chatService.getChatInfo(match.match_id || match.id);
            console.log(`Chat info para match ${match.match_id || match.id}:`, chatInfo);
            
            // Crear chat básico primero
            const chat = {
              id: `match-${match.match_id || match.id}`,
              matchId: match.match_id || match.id,
              userId: chatInfo.partner_id,
              matchedOn: match.created_at || new Date().toISOString(),
              lastMessage: chatInfo.last_message ? {
                id: 0,
                match_id: match.match_id || match.id,
                sender_id: chatInfo.partner_id,
                content: chatInfo.last_message,
                created_at: new Date().toISOString(),
                read: true,
                isCurrentUser: false
              } : undefined,
              unreadCount: chatInfo.unread_count,
              currentUserId,
              user: {
                id: chatInfo.partner_id,
                name: chatInfo.partner_username,
                username: chatInfo.partner_username,
                image: match.other_user?.image || '/favicon.ico',
                avatar: match.other_user?.avatar || '/default-avatar.png',
                bio: match.other_user?.bio || '',
                age: match.other_user?.age,
                onlineStatus: match.other_user?.online_status || false,
                lastOnline: match.other_user?.last_online,
                location: match.other_user?.location || '',
                skillLevel: match.other_user?.skill_level || '',
              }
            } as FrontendChat;
            
            return chat;
          } catch (error) {
            console.error(`Error loading chat info for match ${match.match_id || match.id}:`, error);
            // Si hay error, crear chat básico
            return {
              id: `match-${match.match_id || match.id}`,
              matchId: match.match_id || match.id,
              userId: match.other_user_id || 0,
              matchedOn: match.created_at || new Date().toISOString(),
              lastMessage: undefined,
              unreadCount: 0,
              currentUserId,
              user: {
                id: match.other_user_id || 0,
                name: match.other_user_name || match.other_user?.name || `Usuario ${match.other_user_id || match.id}`,
                image: match.other_user?.image || '/favicon.ico',
                avatar: match.other_user_avatar || match.other_user?.avatar || '/default-avatar.png',
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

      // Combinar todos los chats
      const allChats = [...chatsWithInfo]
        .filter((chat): chat is FrontendChat => chat !== null)
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

      console.log('Chats finales cargados:', allChats);
      setMatches(allChats);
    } catch (error) {
      console.error('Error loading matches with chat info:', error);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    loadMatchesWithChatInfo();
  }, [loadMatchesWithChatInfo]);

  // Cargar todos los mensajes cuando se selecciona un chat
  useEffect(() => {
    console.log('=== useEffect de mensajes activado ===');
    console.log('selectedMatch:', selectedMatch);
    
    if (!selectedMatch) {
      console.log('No hay match seleccionado, limpiando mensajes');
      setMessages([]);
      return;
    }

    const loadAllMessages = async () => {
      setLoadingMessages(true);
      console.log('Iniciando carga de mensajes...');
      
      try {
         if (selectedMatch.matchId) {
          console.log(`Cargando mensajes reales para match ${selectedMatch.matchId}`);
          
          // Ahora getChatMessages devuelve {partner_id, partner_username, messages}
          const chatData = await chatService.getChatMessages(selectedMatch.matchId);
          
          console.log('=== DATOS COMPLETOS DEL CHAT ===');
          console.log('Partner ID:', chatData.partner_id);
          console.log('Partner username:', chatData.partner_username);
          console.log('Número de mensajes:', chatData.messages.length);
          
          // Los mensajes ya vienen con isCurrentUser calculado
          console.log('Mensajes con isCurrentUser:', chatData.messages.map(m => ({
            id: m.id,
            sender_id: m.sender_id,
            partner_id: chatData.partner_id,
            isCurrentUser: m.isCurrentUser,
            content: m.content
          })));
          
          setMessages(chatData.messages);
          
          // Actualizar información del partner si es necesario
          if (chatData.partner_id !== selectedMatch.userId) {
            console.log('Actualizando información del partner en selectedMatch');
            setSelectedMatch(prev => prev ? {
              ...prev,
              userId: chatData.partner_id,
              user: {
                ...prev.user,
                id: chatData.partner_id,
                name: chatData.partner_username || prev.user.name
              }
            } : null);
          }
          
          // Actualizar el último mensaje en la lista
          if (chatData.messages.length > 0) {
            const lastRealMessage = chatData.messages[chatData.messages.length - 1];
            setMatches(prev => prev.map(m => {
              if (m.id === selectedMatch.id) {
                return {
                  ...m,
                  lastMessage: lastRealMessage,
                  user: {
                    ...m.user,
                    name: chatData.partner_username || m.user.name
                  }
                };
              }
              return m;
            }));
          }
        }
      } catch (error) {
        console.error('Error loading all messages:', error);
        setMessages([]);
      } finally {
        setLoadingMessages(false);
        console.log('Carga de mensajes finalizada');
      }
    };

    loadAllMessages();
  }, [selectedMatch]); // Ya no necesita currentUserId

  const handleSelectMatch = (match: FrontendChat) => {
    console.log('Seleccionando match:', match);
    setSelectedMatch(match);
    setShowProfile(false);
    setNewMessage('');
  };

  const handleBackToMatches = () => {
    console.log('Volviendo a lista de matches');
    setSelectedMatch(null);
  };

  const handleSendMessage = async () => {
    if (newMessage.trim() === '' || !selectedMatch || sendingMessage) return;

    try {
      setSendingMessage(true);
      
       if (selectedMatch.matchId) {
        // Ahora sendMessage devuelve {message, partner_id}
        const { message: sentMessage } = await chatService.sendMessage(
          selectedMatch.matchId, 
          newMessage.trim()
        );
        
        console.log('Mensaje enviado con isCurrentUser:', {
          id: sentMessage.id,
          sender_id: sentMessage.sender_id,
          isCurrentUser: sentMessage.isCurrentUser,
          content: sentMessage.content
        });
        
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
      console.log('Error formateando tiempo:', error);
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
      {/* Vista de lista de chats - mostrar en desktop siempre, en mobile solo cuando no hay chat seleccionado */}
      {showListView && (
        <div className={`${styles.matchesSidebar} ${showChatView && isMobile ? styles.hidden : ''}`}>
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
                      src={match.user.image || '/default-avatar.png'}
                      alt={match.user.name}
                      width={50}
                      height={50}
                      className={styles.avatarImage}
                    />
                    {match.user.onlineStatus && (
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
                              : 'Nuevo match - ¡Decí hola!'}
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
      )}
      

      {/* Vista de chat - mostrar cuando hay chat seleccionado */}
      {showChatView && (
        <div className={`${styles.chatContainer} ${isMobile ? styles.mobileActive : ''}`}>
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
                  src={selectedMatch.user.image || '/default-avatar.png'}
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
          </div>

          {/* Perfil o chat */}
          {showProfile && !selectedMatch.isCommunity ? (
            <div className={styles.profileView}>
              <div className={styles.profileHeader}>
                <div className={styles.profileAvatar}>
                  <Image
                    src={selectedMatch.user.image || '/default-avatar.png'}
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
                {loadingMessages ? (
                  <div className={styles.messagesLoading}>
                    <div className={styles.loadingSpinner}></div>
                    <p className={styles.loadingText}>Cargando mensajes...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className={styles.noMessages}>
                    <p>No hay mensajes todavía</p>
                    <p className={styles.startConversation}> 
                        | : '¡Iniciá la conversación!'
                    </p>
                  </div>
                ) : (
                  <div className={styles.messagesList}>
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`${styles.message} ${
                          message.isCurrentUser ? styles.sent : styles.received
                        }`}
                      >
                        <div className={styles.messageContent}>
                          <p>{message.content}</p>
                          <span className={styles.messageTime}>
                            {formatTime(message.created_at)}
                          </span>
                        </div>
                        
                        {/* Debug info solo en desarrollo */}
                        {process.env.NODE_ENV === 'development' && (
                          <div style={{
                            fontSize: '10px',
                            color: '#888',
                            marginTop: '4px',
                            opacity: 0.7
                          }}>
                            {message.isCurrentUser ? '👤 Yo' : '👥 Partner'} 
                            (ID: {message.sender_id})
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.messageInputContainer}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                   "Escribí tu mensaje..."
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
        </div>
      )}

      {/* Estado inicial en desktop cuando no hay chat seleccionado */}
      {!selectedMatch && !isMobile && (
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
          <p>Seleccioná un match para mandar un mensaje</p>
          <button
            onClick={() => router.push('/discover')}
            className={styles.findPartnersButton}
          >
            Encontrá tu próximo dúo
          </button>
        </div>
      )}
    </div>
  );
};

export default MessagesPage;