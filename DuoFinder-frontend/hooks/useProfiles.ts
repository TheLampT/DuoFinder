// hooks/useProfiles.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { Profile, Suggestion } from '@/lib/types';
import { apiService } from '@/lib/apiService';

export const useProfiles = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [lastResponseCount, setLastResponseCount] = useState<number>(0);
  const loadingRef = useRef(false); // Para evitar doble carga

  // Transformar Suggestion a Profile
  const transformSuggestionToProfile = (suggestion: Suggestion): Profile => {
    return {
      id: suggestion.id,
      username: suggestion.username,
      age: suggestion.age,
      image: suggestion.image || '/default-profile.png',
      bio: suggestion.bio,
      gameSkill: [{
        game: suggestion.game,
        skill: suggestion.skill,
        isRanked: suggestion.isRanked,
      }],
    };
  };

  // Cargar más perfiles con control de duplicados
  const loadMoreProfiles = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;
    
    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const suggestions = await apiService.getSuggestions(skip, 20); // Reducir a 10
      
      console.log('API Response:', {
        skip,
        received: suggestions.length,
        hasIds: suggestions.map(s => s.id)
      });

      if (suggestions.length === 0) {
        console.log('No more suggestions available');
        setHasMore(false);
        return;
      }

      // Filtrar duplicados por ID
      const existingIds = new Set(profiles.map(p => p.id));
      const newSuggestions = suggestions.filter(s => !existingIds.has(s.id));
      
      if (newSuggestions.length === 0) {
        console.log('All received suggestions are duplicates');
        setHasMore(false);
        return;
      }

      const newProfiles = newSuggestions.map(transformSuggestionToProfile);
      
      setProfiles(prev => {
        const updated = [...prev, ...newProfiles];
        console.log(`Total profiles: ${updated.length}, New: ${newProfiles.length}`);
        return updated;
      });
      
      setSkip(prev => prev + newSuggestions.length);
      setLastResponseCount(newSuggestions.length);
      
      // Si recibimos menos de lo solicitado, probablemente no hay más
      if (newSuggestions.length < 10) {
        console.log(`Received less than requested (${newSuggestions.length}/10), marking as no more`);
        setHasMore(false);
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading profiles');
      console.error('Error loading profiles:', err);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [skip, hasMore, profiles]);

  // Cargar perfiles iniciales solo una vez
  useEffect(() => {
    if (profiles.length === 0 && !loading && hasMore) {
      console.log('Initial load');
      loadMoreProfiles();
    }
  }, []);

  // Función para hacer swipe
  const swipeProfile = async (profileId: number, like: boolean) => {
    try {
      const profile = profiles.find(p => p.id === profileId);
      const mainGameId = profile?.gameSkill[0] ? 1 : undefined;
      
      const result = await apiService.swipeUser({
        target_user_id: profileId,
        like,
        game_id: mainGameId
      });
      
      console.log('Swipe result:', result);
      return result;
    } catch (err) {
      console.error('Error swiping user:', err);
      return null;
    }
  };

  // Reiniciar el estado
  const resetProfiles = useCallback(() => {
    setProfiles([]);
    setSkip(0);
    setHasMore(true);
    setError(null);
    setLastResponseCount(0);
    loadingRef.current = false;
  }, []);

  return {
    profiles,
    loading,
    error,
    hasMore,
    loadMoreProfiles,
    swipeProfile,
    resetProfiles,
    lastResponseCount,
  };
};