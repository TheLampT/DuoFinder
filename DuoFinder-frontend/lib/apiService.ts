import { authFetch } from './auth';
import { 
  Suggestion, 
  UserProfile, 
  SwipeResponse, 
  SwipeInput,
  UpdateProfileRequest,
  UpdateProfileResponse ,
  Match ,
  Chat ,
  UserPreferences
} from './types';

export const apiService = {
  // === USER PROFILE (movido desde auth.ts) ===
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
  getMatches: async (): Promise<Match[]> => { // Define el tipo Match
    const response = await authFetch('/matches');
    
    if (!response.ok) {
      throw new Error('Error fetching matches');
    }

    return response.json();
  },

  getChats: async (): Promise<Chat[]> => { // Define el tipo Chat
    const response = await authFetch('/chats');
    
    if (!response.ok) {
      throw new Error('Error fetching chats');
    }

    return response.json();
  },

  // === PREFERENCES ===
  updatePreferences: async (preferences: UserPreferences): Promise<UserPreferences> => { // Define UserPreferences
    const response = await authFetch('/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });

    if (!response.ok) {
      throw new Error('Error updating preferences');
    }

    return response.json();
  },

  getPreferences: async (): Promise<UserPreferences> => { // Define UserPreferences
    const response = await authFetch('/preferences');
    
    if (!response.ok) {
      throw new Error('Error fetching preferences');
    }

    return response.json();
  }
};