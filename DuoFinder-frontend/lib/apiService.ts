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
  ChatMessage, 
  FrontendMessage,
  FrontendChat  ,
} from './types';

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

// prefijo REAL del backend (por los archivos communitys.py)
const COMMUNITY_BASE = '/community';

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

    const body = await response.json().catch(() => ({} as any));

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

    const body = await response.json().catch(() => ({} as any));

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
      const body = await response.json().catch(() => ({} as any));
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
