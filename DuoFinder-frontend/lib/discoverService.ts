// services/discoverService.ts
import { Suggestion, SwipeInput, SwipeResponse, Profile } from '../lib/types';
import { authFetch } from '@/lib/auth';

export const discoverService = {
  // Obtener sugerencias de matches
  getSuggestions: async (skip: number = 0, limit: number = 20): Promise<Suggestion[]> => {
    const response = await authFetch(`/matches/suggestions?skip=${skip}&limit=${limit}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to fetch suggestions');
    }

    return await response.json();
  },

  // Enviar un swipe
  sendSwipe: async (swipeData: SwipeInput): Promise<SwipeResponse> => {
    const response = await authFetch('/matches/swipe', {
      method: 'POST',
      body: JSON.stringify(swipeData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to send swipe');
    }

    return await response.json();
  },

  // Función helper para convertir Suggestion a Profile
  suggestionToProfile: (suggestion: Suggestion): Profile => ({
    id: suggestion.id,
    name: suggestion.username,
    username: suggestion.username,
    age: suggestion.age,
    image: suggestion.image || '/default-avatar.png',
    bio: suggestion.bio || '',
    game: suggestion.game,
    skillLevel: suggestion.skill,
    isRanked: suggestion.isRanked,
    server: '',
    discord: '',
    tracker: ''
  }),
};