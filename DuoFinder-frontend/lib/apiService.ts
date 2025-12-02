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
  ChatMessage, 
  FrontendMessage,
  FrontendChat  ,
} from './types';

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

// prefijo REAL del backend (por los archivos communitys.py)
const COMMUNITY_BASE = '/community';

// ======================= API SERVICE =======================

export const chatService = {
  // Obtener lista de chats
  getChats: async (): Promise<any[]> => {
    const response = await authFetch('/chats');
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Error fetching chats');
    }

    return await response.json();
  },

  // Obtener mensajes de un chat
  getChatMessages: async (matchId: number): Promise<any[]> => {
    const response = await authFetch(`/chats/${matchId}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Error fetching messages');
    }

    return await response.json();
  },

  // Enviar mensaje
  sendMessage: async (matchId: number, content: string): Promise<any> => {
    const response = await authFetch(`/chats/${matchId}`, {
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

    return await response.json();
  },

  // Marcar mensajes como leídos
  markMessagesAsRead: async (matchId: number): Promise<void> => {
    const response = await authFetch(`/chats/${matchId}/read`, {
      method: 'PUT',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Error marking messages as read');
    }
  }
};

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

  updateProfile: async (
    profileData: UpdateProfileRequest
  ): Promise<UpdateProfileResponse> => {
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
  getSuggestions: async (
    skip: number = 0,
    limit: number = 20
  ): Promise<Suggestion[]> => {
    const response = await authFetch(
      `/matches/suggestions?skip=${skip}&limit=${limit}`
    );

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
  updatePreferences: async (
    preferences: UserPreferences
  ): Promise<UserPreferences> => {
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

  getPreferences: async (): Promise<UserPreferences> => {
    const response = await authFetch('/preferences');

    if (!response.ok) {
      throw new Error('Error fetching preferences');
    }

    return response.json();
  },

  // ================== COMMUNITIES (BACKEND REAL) ==================

// === COMUNIDADES ===

getCommunities: async (): Promise<CommunityListDTO> => {
  const response = await authFetch('/community');
  if (!response.ok) {
    throw new Error(`Error al obtener comunidades (${response.status})`);
  }
  return response.json();
},

getMyCommunities: async (): Promise<MyCommunityDTO[]> => {
  const response = await authFetch('/community/my');

  if (response.status === 404) {
    console.warn(
      '[getMyCommunities] Endpoint /community/my no encontrado (404). ' +
      'Devolviendo lista vacía por ahora.'
    );
    return [];
  }

  if (!response.ok) {
    throw new Error(`Error al obtener mis comunidades (${response.status})`);
  }

  return response.json();
},


  // Crear comunidad
  createCommunity: async (data: {
    name: string;
    info: string | null;
    is_public: boolean;
    game_ids: number[]; // de momento lo dejamos así, aunque no lo uses
  }): Promise<CommunityDTO> => {
    const response = await authFetch(`${COMMUNITY_BASE}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(
        err.detail || `Error al crear comunidad (${response.status})`
      );
    }

    return response.json();
  },

  // Actualizar comunidad
  updateCommunity: async (
    id: number,
    data: {
      name?: string;
      info?: string | null;
      is_public?: boolean;
      game_ids?: number[];
    }
  ): Promise<CommunityDTO> => {
    const response = await authFetch(`${COMMUNITY_BASE}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(
        err.detail || `Error al actualizar comunidad (${response.status})`
      );
    }

    return response.json();
  },

  // Eliminar comunidad
  deleteCommunity: async (id: number): Promise<{ message: string }> => {
    const response = await authFetch(`${COMMUNITY_BASE}/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(
        err.detail || `Error al eliminar comunidad (${response.status})`
      );
    }

    return response.json();
  },

  // Unirse a comunidad
  joinCommunity: async (id: number): Promise<{ message: string }> => {
    const response = await authFetch(`${COMMUNITY_BASE}/${id}/join`, {
      method: 'POST',
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(
        err.detail || `Error al unirse a la comunidad (${response.status})`
      );
    }

    return response.json();
  },

  // Salir de comunidad
  leaveCommunity: async (id: number): Promise<{ message: string }> => {
    const response = await authFetch(`${COMMUNITY_BASE}/${id}/leave`, {
      method: 'POST',
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(
        err.detail || `Error al salir de la comunidad (${response.status})`
      );
    }

    return response.json();
  },
};
