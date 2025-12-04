// lib/apiService.ts
import { authFetch } from './auth';
import { 
  Suggestion, 
  UserProfile, 
  SwipeResponse, 
  SwipeInput,
  UpdateProfileRequest,
  UpdateProfileResponse,
  Match ,
  Chat ,
  UserPreferences ,
  Message,
  FrontendChat
} from './types';

import { ApiMatchResponse, ApiMessageResponse, ChatInfoResponse, FrontendMessage } from '@/app/messages/message.types'

// ======================= TIPOS DE COMUNIDADES =======================

export interface CommunityDTO {
  id: number;
  name: string;
  info: string | null;
  is_public: boolean;
  owner_user_id: number;
}

export interface MyCommunityDTO extends CommunityDTO {
  role: string; // "owner" | "member"
}

export interface CommunityListDTO {
  items: CommunityDTO[];
  total: number;
  limit: number;
  offset: number;
}

const getCurrentUserId = (): number | null => {
  if (typeof window === 'undefined') return null;
  const userData = localStorage.getItem('user');
  if (!userData) return null;
  try {
    const user = JSON.parse(userData);
    return user.id || null;
  } catch {
    return null;
  }
};


// ======================= CHAT SERVICE =======================
export const chatService = {
  // Obtener todos los matches del usuario
  getAllMatches: async (): Promise<ApiMatchResponse[]> => {
    const response = await authFetch('/matches/matches');
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Error fetching matches');
    }

    const matches = await response.json();
    return Array.isArray(matches) ? matches : [];
  },

  // Obtener información del chat para un match específico
  getChatInfo: async (matchId: number): Promise<{
    partner_id: number;
    partner_username: string;
    last_message?: string;
    unread_count: number;
    image?: string;
  }> => {
    const response = await authFetch(`/chats/chats/${matchId}/info`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Error fetching chat info');
    }

    return await response.json();
  },

  // Obtener todos los mensajes de un chat específico
  getChatMessages: async (matchId: number): Promise<{
    partner_id: number;
    partner_username: string;
    messages: FrontendMessage[];
  }> => {
    try {
      const response = await authFetch(`/chats/chats/${matchId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error fetching messages');
      }

      const data = await response.json();
      
      console.log(`Respuesta completa de /chats/${matchId}:`, data);
      
      // Extraer información del partner
      const partner_id = data.partner_id || 0;
      const partner_username = data.partner_username || 'Usuario desconocido';
      
      // Extraer mensajes
      let messagesArray: ApiMessageResponse[] = [];
      if (data.messages && Array.isArray(data.messages)) {
        messagesArray = data.messages as ApiMessageResponse[];
        console.log(`Encontrados ${messagesArray.length} mensajes en propiedad "messages"`);
      } else if (Array.isArray(data)) {
        messagesArray = data as ApiMessageResponse[];
        console.log(`Encontrados ${messagesArray.length} mensajes en array directo`);
      }
      
      // Convertir mensajes a FrontendMessage
      const messages = messagesArray.map((msg: ApiMessageResponse) => {
        // Determinar si el mensaje es del usuario actual basado en partner_id
        // Si sender_id === partner_id → mensaje del partner (otra persona)
        // Si sender_id !== partner_id → mensaje del usuario actual
        const isCurrentUser = msg.sender_id !== partner_id;
        
        console.log(`Procesando mensaje ${msg.id}:`, {
          sender_id: msg.sender_id,
          partner_id: partner_id,
          isCurrentUser: isCurrentUser,
          content: msg.content
        });
        
        return {
          id: msg.id || 0,
          match_id: msg.match_id || matchId,
          sender_id: msg.sender_id || 0,
          content: msg.content || '',
          created_at: msg.created_at || new Date().toISOString(),
          read: msg.read || true,
          isCurrentUser: isCurrentUser  // ¡Aquí está la lógica clave!
        };
      });
      
      return {
        partner_id,
        partner_username,
        messages
      };
    } catch (error) {
      console.error(`Error en getChatMessages para match ${matchId}:`, error);
      throw error;
    }
  },

  // Enviar mensaje
  sendMessage: async (matchId: number, content: string): Promise<{
    message: FrontendMessage;
    partner_id: number;
  }> => {
    const response = await authFetch(`/chats/chats/${matchId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Error sending message');
    }

    const data = await response.json();
    console.log('Respuesta al enviar mensaje:', data);
    
    // Necesitamos obtener el partner_id para determinar si es mensaje nuestro
    // Podemos obtenerlo de la respuesta o llamar a getChatInfo
    let partner_id = 0;
    let messageData: ApiMessageResponse;
    
    if (data.partner_id) {
      // Si la respuesta incluye partner_id
      partner_id = data.partner_id;
      messageData = data.message || data;
    } else {
      // Si no, necesitamos obtener el partner_id por separado
      try {
        const chatInfo = await chatService.getChatInfo(matchId);
        partner_id = chatInfo.partner_id;
        messageData = data;
      } catch (error) {
        console.error('Error obteniendo partner_id:', error);
        messageData = data;
      }
    }
    
    // Determinar si es mensaje del usuario actual
    // Si el mensaje recién enviado tiene sender_id diferente al partner_id, es nuestro
    const sender_id = messageData.sender_id || messageData.SenderID || 0;
    const isCurrentUser = sender_id !== partner_id;
    
    console.log('Determinando isCurrentUser para mensaje enviado:', {
      sender_id: sender_id,
      partner_id: partner_id,
      isCurrentUser: isCurrentUser
    });
    
    const message: FrontendMessage = {
      id: messageData.id || 0,
      match_id: messageData.match_id || messageData.MatchesID || matchId,
      sender_id: sender_id,
      content: messageData.content || messageData.ContentChat || content,
      created_at: messageData.created_at || messageData.CreatedDate || new Date().toISOString(),
      read: messageData.read || messageData.ReadChat || true,
      isCurrentUser: isCurrentUser
    };
    
    return {
      message,
      partner_id
    };
  },

  // Función para combinar información del match con información del chat
  combineMatchAndChatInfo: (
    matchData: ApiMatchResponse, 
    chatInfo: ChatInfoResponse
  ): FrontendChat => {
    const currentUserId = getCurrentUserId();
    const partnerId = chatInfo.partner_id;
    const partnerUsername = chatInfo.partner_username;
    
    const otherUserFromMatch = matchData.other_user || {
      id: matchData.other_user_id || partnerId,
      name: matchData.other_user_name || partnerUsername,
      avatar: matchData.other_user_avatar || '/default-avatar.png'
    };

    // Determinar si el último mensaje fue enviado por el usuario actual
    // Necesitamos cargar esto después cuando tengamos los mensajes completos
    const lastMessage = chatInfo.last_message ? {
      id: 0,
      match_id: matchData.match_id || matchData.id,
      sender_id: partnerId, // Temporal - se corregirá cuando carguemos los mensajes
      content: chatInfo.last_message,
      created_at: new Date().toISOString(),
      read: true,
      isCurrentUser: false // Temporal
    } : undefined;

    return {
      id: `match-${matchData.match_id || matchData.id}`,
      matchId: matchData.match_id || matchData.id,
      userId: partnerId,
      matchedOn: matchData.created_at || new Date().toISOString(),
      lastMessage: lastMessage,
      unreadCount: chatInfo.unread_count,
      user: {
        id: partnerId,
        name: partnerUsername || otherUserFromMatch.name,
        username: partnerUsername,
        age: otherUserFromMatch.age,
        bio: otherUserFromMatch.bio || '',
        avatar: otherUserFromMatch.avatar || '/default-avatar.png',
        lastOnline: otherUserFromMatch.last_online,
        location: otherUserFromMatch.location || '',
      },
      currentUserId: currentUserId || 0
    };
  }
};

// ======================= API SERVICE =======================

export const apiService = {
  // === USER PROFILE ===
  getProfile: async (): Promise<UserProfile> => {
    const response = await authFetch('/users/me');
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to fetch profile');
    }

    return await response.json();
  },

  updateProfile: async (profileData: UpdateProfileRequest): Promise<UpdateProfileResponse> => {
    const response = await authFetch('/users/me', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to update profile');
    }

    return await response.json();
  },

  deleteAccount: async (): Promise<{ message: string }> => {
    const response = await authFetch('/users/me', {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to delete account');
    }

    return await response.json();
  },

  // === DISCOVER & MATCHING ===
  getSuggestions: async (skip: number = 0, limit: number = 20): Promise<Suggestion[]> => {
    const response = await authFetch(`/matches/suggestions?skip=${skip}&limit=${limit}`);
    
    if (!response.ok) {
      throw new Error('Error fetching suggestions');
    }

    return response.json();
  },

  swipeUser: async (data: SwipeInput): Promise<SwipeResponse> => {
    const response = await authFetch('/matches/swipe', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Error swiping user');
    }

    return response.json();
  },

  getUserProfile: async (userId: number): Promise<UserProfile> => {
    const response = await authFetch(`/users/${userId}`);
    
    if (!response.ok) {
      throw new Error('Error fetching user profile');
    }

    return response.json();
  },

  // === CHAT & MATCHES ===
  getMatches: async (): Promise<Match[]> => {
    const response = await authFetch('/matches');
    
    if (!response.ok) {
      throw new Error('Error fetching matches');
    }

    return response.json();
  },

  getChats: async (): Promise<Chat[]> => {
    const response = await authFetch('/chats');
    
    if (!response.ok) {
      throw new Error('Error fetching chats');
    }

    return response.json();
  },

  // === PREFERENCES ===
  updatePreferences: async (preferences: UserPreferences): Promise<UserPreferences> => {
    const response = await authFetch('/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });

    if (!response.ok) {
      throw new Error('Error updating preferences');
    }

    return response.json();
  },

  // Enviar un mensaje
  sendMessage: async (matchId: number, content: string): Promise<Message> => {
    const response = await authFetch(`/chats/${matchId}`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      throw new Error('Error sending message');
    }

    return response.json();
  },

  // Obtener información de un match específico
  getMatchDetails: async (matchId: number): Promise<Match> => {
    const response = await authFetch(`/matches/${matchId}`);
    
    if (!response.ok) {
      throw new Error('Error fetching match details');
    }

    return response.json();
  },

  getPreferences: async (): Promise<UserPreferences> => { // Define UserPreferences
    const response = await authFetch('/preferences');
    
    if (!response.ok) {
      throw new Error('Error fetching preferences');
    }

    return response.json();
  },

    // ======================
  // COMMUNITIES (BACKEND)
  // ======================

  /** GET /communities/communities */
  getCommunities: async (
    params?: { q?: string; limit?: number; offset?: number }
  ): Promise<CommunityListDTO> => {

    const searchParams = new URLSearchParams();
    if (params?.q) searchParams.set('q', params.q);
    if (params?.limit != null) searchParams.set('limit', String(params.limit));
    if (params?.offset != null) searchParams.set('offset', String(params.offset));

    const query = searchParams.toString();
    const response = await authFetch(`/communities/communities${query ? `?${query}` : ''}`);

    if (!response.ok) {
      throw new Error(`Error al obtener comunidades (${response.status})`);
    }

    return response.json();
  },

  /** GET /communities/communities/my */
  getMyCommunities: async (): Promise<MyCommunityDTO[]> => {
    const response = await authFetch('/communities/communities/my');

    if (!response.ok) {
      throw new Error(`Error al obtener mis comunidades (${response.status})`);
    }

    return response.json();
  },

  /** POST /communities/communities */
  createCommunity: async (data: {
    name: string;
    info?: string | null;
    is_public?: boolean;
    game_ids?: number[];
  }): Promise<CommunityDTO> => {

    const payload = {
      name: data.name,
      info: data.info ?? null,
      is_public: data.is_public ?? true,
      game_ids: data.game_ids ?? undefined,
    };

    const response = await authFetch('/communities/communities', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const body = await response.json().catch(() => ({} as unknown));

    if (!response.ok) {
      throw new Error(body.detail || `Error al crear comunidad (${response.status})`);
    }

    return body as CommunityDTO;
  },

  /** PUT /communities/communities/{id} */
  updateCommunity: async (
    id: number,
    data: {
      name?: string;
      info?: string | null;
      is_public?: boolean;
      game_ids?: number[];
    }
  ): Promise<CommunityDTO> => {

    const response = await authFetch(`/communities/communities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    const body = await response.json().catch(() => ({} as unknown));

    if (!response.ok) {
      throw new Error(body.detail || `Error al actualizar comunidad (${response.status})`);
    }

    return body as CommunityDTO;
  },

  /** DELETE /communities/communities/{id} */
  deleteCommunity: async (id: number): Promise<void> => {
    const response = await authFetch(`/communities/communities/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({} as unknown));
      throw new Error(body.detail || `Error al eliminar comunidad (${response.status})`);
    }
  },

  /** POST /communities/communities/{id}/leave */
  leaveCommunity: async (id: number): Promise<{ message: string }> => {
    const response = await authFetch(`/communities/communities/${id}/leave`, {
      method: 'POST',
    });

    const body = await response.json().catch(() => ({} as unknown));

    if (!response.ok) {
      throw new Error(body.detail || `Error al salir de la comunidad (${response.status})`);
    }

    return body as { message: string };
  },

  /** POST /communities/communities/{id}/join */
  joinCommunity: async (id: number): Promise<{ message: string }> => {
    const response = await authFetch(`/communities/communities/${id}/join`, {
      method: 'POST',
    });

    const body = await response.json().catch(() => ({} as unknown));

    if (!response.ok) {
      throw new Error(body.detail || `Error al unirse a la comunidad (${response.status})`);
    }

    return body as { message: string };
  },
};
