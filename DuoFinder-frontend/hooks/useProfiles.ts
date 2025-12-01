// hooks/useProfiles.ts
import { useState, useEffect, useCallback } from 'react';
import { Profile, Suggestion } from '@/lib/types';
import { apiService } from '@/lib/apiService';

export const useProfiles = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Transformar Suggestion a Profile
  const transformSuggestionToProfile = (suggestion: Suggestion): Profile => {
    return {
      id: suggestion.id,
      username: suggestion.username,
      age: suggestion.age,
      image: suggestion.image,
      bio: suggestion.bio,
      gameSkill: [{
        game: suggestion.game,
        skill: suggestion.skill,
        isRanked: suggestion.isRanked,
      }],
    };
  };

  // Cargar más perfiles
  const loadMoreProfiles = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
        const suggestions = await apiService.getSuggestions(skip, 20);
        
        if (suggestions.length === 0) {
        setHasMore(false);
        } else {
        const newProfiles = suggestions.map(transformSuggestionToProfile);
        setProfiles(prev => [...prev, ...newProfiles]);
        setSkip(prev => prev + suggestions.length);
        }
    } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading profiles');
    } finally {
        setLoading(false);
    }
    }, [skip, loading, hasMore]);

  // Cargar perfiles iniciales
  useEffect(() => {
    if (profiles.length === 0) {
      loadMoreProfiles();
    }
  }, []);

  // Función para hacer swipe
  const swipeProfile = async (profileId: number, like: boolean) => {
    try {
      // Encontrar el juego principal (puedes mejorar esta lógica)
      const profile = profiles.find(p => p.id === profileId);
      const mainGameId = profile?.gameSkill[0] ? 1 : undefined;
      
      const result = await apiService.swipeUser({
        target_user_id: profileId,
        like,
        game_id: mainGameId
      });
      
      console.log('Swipe result:', result);
      return true;
    } catch (err) {
      console.error('Error swiping user:', err);
      return false;
    }
  };

  // Reiniciar el estado
  const resetProfiles = useCallback(() => {
    setProfiles([]);
    setSkip(0);
    setHasMore(true);
    setError(null);
    loadMoreProfiles();
  }, [loadMoreProfiles]);

  return {
    profiles,
    loading,
    error,
    hasMore,
    loadMoreProfiles,
    swipeProfile,
    resetProfiles,
  };
};