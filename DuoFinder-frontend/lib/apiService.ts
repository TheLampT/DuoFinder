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
  ChatListItem,
  FrontendMessage,
  FrontendChat
} from './types';

import { ApiMessageResponse } from '@/app/messages/message.types'

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


// ======================= CHAT SERVICE =======================
export const chatService = {
  // Obtener todos los matches del usuario
  getAllMatches: async (): Promise<any[]> => {
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
  }> => {
    const response = await authFetch(`/chats/chats/${matchId}/info`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Error fetching chat info');
    }

    return await response.json();
  },

  // Obtener todos los mensajes de un chat específico
  getChatMessages: async (matchId: number): Promise<FrontendMessage[]> => {
  try {
    const response = await authFetch(`/chats/chats/${matchId}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Error fetching messages');
    }

    const data = await response.json();
    
    console.log(`Respuesta de /chats/${matchId}:`, data);
    
    // Si la respuesta es null o undefined, retornar array vacío
    if (!data) {
      console.warn(`Respuesta vacía de /chats/${matchId}`);
      return [];
    }
    
    // Asegurarnos de que siempre trabajamos con un array
    let messagesArray: any[] = [];
    
    if (Array.isArray(data)) {
      messagesArray = data;
    } else {
      // Si no es array, intentar convertirlo
      console.warn(`Respuesta no es array, intentando convertir:`, typeof data);
      messagesArray = [data];
    }
    
    // Convertir de API a frontend
    return messagesArray.map((msg: ApiMessageResponse) => ({
      id: msg.id || 0,
      match_id: msg.match_id || matchId,
      sender_id: msg.sender_id || 0,
      content: msg.content || '',
      created_at: msg.created_at || new Date().toISOString(),
      read: msg.read || true
    }));
  } catch (error) {
    console.error(`Error en getChatMessages para match ${matchId}:`, error);
    throw error;
  }
},

  // Enviar mensaje
  sendMessage: async (matchId: number, content: string): Promise<FrontendMessage> => {
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

    const message = await response.json();
    
    // Convertir de API a frontend
    return {
      id: message.id || message.ID,
      match_id: message.match_id || message.MatchesID || matchId,
      sender_id: message.sender_id || message.SenderID || 0,
      content: message.content || message.ContentChat || content,
      created_at: message.created_at || message.CreatedDate || new Date().toISOString(),
      read: message.read || message.ReadChat || true
    };
  },

  // Función para combinar información del match con información del chat
  combineMatchAndChatInfo: (
    matchData: any, 
    chatInfo: {
      partner_id: number;
      partner_username: string;
      last_message?: string;
      unread_count: number;
    }
  ): FrontendChat => {
    // Determinar quién es el otro usuario
    // Primero intentamos usar la info del chat (más confiable)
    const partnerId = chatInfo.partner_id;
    const partnerUsername = chatInfo.partner_username;
    
    // Si el match tiene información del otro usuario, la usamos como respaldo
    const otherUserFromMatch = matchData.other_user || {
      id: matchData.other_user_id || partnerId,
      name: matchData.other_user_name || partnerUsername,
      avatar: matchData.other_user_avatar || '/default-avatar.png'
    };

    // Crear el último mensaje como FrontendMessage si existe
    const lastMessage = chatInfo.last_message ? {
      id: 0, // Temporal, se actualizará cuando carguemos los mensajes
      match_id: matchData.match_id || matchData.id,
      sender_id: partnerId, // Asumimos que el último mensaje es del partner
      content: chatInfo.last_message,
      created_at: new Date().toISOString(), // Temporal
      read: true
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
        gamePreferences: otherUserFromMatch.gamePreferences || otherUserFromMatch.game_preferences || [],
        onlineStatus: otherUserFromMatch.online_status || otherUserFromMatch.onlineStatus || false,
        lastOnline: otherUserFromMatch.last_online,
        location: otherUserFromMatch.location || '',
        skillLevel: otherUserFromMatch.skill_level || otherUserFromMatch.skillLevel || '',
        favoriteGames: otherUserFromMatch.favoriteGames || otherUserFromMatch.favorite_games || []
      }
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

  /** POST /communities/community */
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

    const response = await authFetch('/communities/community', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const body = await response.json().catch(() => ({} as unknown));

    if (!response.ok) {
      throw new Error(body.detail || `Error al crear comunidad (${response.status})`);
    }

    return body;
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

    return body;
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

  /** MOCK: leave */
  leaveCommunity: async () => {
    console.log("leaveCommunity (sin endpoint)");
  },

  /** MOCK: join */
  joinCommunity: async () => {
    console.log("joinCommunity (sin endpoint)");
  },
};
