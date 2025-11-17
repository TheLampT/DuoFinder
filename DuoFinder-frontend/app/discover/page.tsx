'use client';

import React, { useState, useRef, useEffect } from 'react';
import SwipeCard from '@/components/SwipeCard';
import ProfileDetail from '@/components/ProfileDetail';
import { Profile, Suggestion } from '@/lib/types';
import styles from '@/styles/pages/discover.module.css';
import Link from 'next/link';
import Image from 'next/image';
import { discoverService } from '@/lib/discoverService';

interface SwipeCardRef {
  triggerSwipe: (direction: 'left' | 'right') => void;
}

const Discover: React.FC = () => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const swipeCardRef = useRef<SwipeCardRef | null>(null);
  const [showNoMore, setShowNoMore] = useState(false);

  const BATCH_SIZE = 20;
  const LOAD_MORE_THRESHOLD = 3;

  // Cargar sugerencias iniciales
  useEffect(() => {
    loadSuggestions(0, BATCH_SIZE);
  }, []);

  // Cargar más sugerencias cuando quedan pocas
  useEffect(() => {
    const remainingSuggestions = suggestions.length - currentIndex;
    if (remainingSuggestions <= LOAD_MORE_THRESHOLD && !isLoadingMore && suggestions.length > 0) {
      loadMoreSuggestions();
    }
  }, [currentIndex, suggestions.length, isLoadingMore]);

  const loadSuggestions = async (skip: number = 0, limit: number = BATCH_SIZE) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await discoverService.getSuggestions(skip, limit);
      setSuggestions(data);
      setCurrentIndex(0);
      
    } catch (err) {
      console.error('Error loading suggestions:', err);
      setError('Error al cargar sugerencias');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreSuggestions = async () => {
    if (isLoadingMore) return;
    
    try {
      setIsLoadingMore(true);
      const newSuggestions = await discoverService.getSuggestions(suggestions.length, BATCH_SIZE);
      setSuggestions(prev => [...prev, ...newSuggestions]);
      
    } catch (err) {
      console.error('Error loading more suggestions:', err);
      setError('Error al cargar más sugerencias');
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (currentIndex >= suggestions.length) return;
    
    const currentProfile = suggestions[currentIndex];
    console.log(`Swiped ${direction} on profile ${currentProfile.id}`);
    
    try {
      // Enviar swipe a la API
      await discoverService.sendSwipe({
        target_user_id: currentProfile.id,
        like: direction === 'right',
      });
      
      // Start animation
      setIsAnimating(true);
      
      // Move to next profile after animation completes
      setTimeout(() => {
        setCurrentIndex(prevIndex => prevIndex + 1);
        setIsSwiping(false);
        setIsAnimating(false);
      }, 300);
      
    } catch (err) {
      console.error('Error sending swipe:', err);
      setError('Error al registrar el swipe');
      // Revertir el swipe si falla
      setIsSwiping(false);
    }
  };

  const handleLike = () => {
    if (currentIndex < suggestions.length && !isSwiping && !isLoading) {
      setIsSwiping(true);
      if (swipeCardRef.current) {
        swipeCardRef.current.triggerSwipe('right');
      }
    }
  };

  const handleDislike = () => {
    if (currentIndex < suggestions.length && !isSwiping && !isLoading) {
      setIsSwiping(true);
      if (swipeCardRef.current) {
        swipeCardRef.current.triggerSwipe('left');
      }
    }
  };

  const handleViewDetails = () => {
    if (currentIndex < suggestions.length) {
      const currentSuggestion = suggestions[currentIndex];
      const profile = discoverService.suggestionToProfile(currentSuggestion);
      setSelectedProfile(profile);
    }
  };

  const handleCloseDetails = () => {
    setSelectedProfile(null);
  };

  const handleDetailLike = () => {
    handleLike();
    handleCloseDetails();
  };

  const handleDetailDislike = () => {
    handleDislike();
    handleCloseDetails();
  };

  const handleRetry = () => {
    setError(null);
    loadSuggestions(0, BATCH_SIZE);
  };

  // Efecto para mostrar "no more profiles"
  useEffect(() => {
    if (currentIndex >= suggestions.length && suggestions.length > 0) {
      setShowNoMore(true);
    } else {
      setShowNoMore(false);
    }
  }, [currentIndex, suggestions.length]);

  // ... resto del componente (loading states, error states, etc.) igual que antes
  // [Mantén el mismo JSX que tenías en la versión anterior]

  if (isLoading) {
    return (
      <div className={styles.discoverContainer}>
        <header className={styles.header}>
          <div className={styles.brand}>
            <Image 
              src="/favicon.ico" 
              alt="DuoFinder" 
              width={40}
              height={40}
              className={styles.logo}
            />
            <span className={styles.brandText}>Descubrí</span>
          </div>
          <div className={styles.navButtons}>
            <Link href="/preferences" className={styles.settingsBtn}>⚙️</Link>
          </div>
        </header>
        <div className={styles.loadingContainer}>
          <p>Cargando sugerencias...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.discoverContainer}>
        <header className={styles.header}>
          <div className={styles.brand}>
            <Image 
              src="/favicon.ico" 
              alt="DuoFinder" 
              width={40}
              height={40}
              className={styles.logo}
            />
            <span className={styles.brandText}>Descubrí</span>
          </div>
          <div className={styles.navButtons}>
            <Link href="/preferences" className={styles.settingsBtn}>⚙️</Link>
          </div>
        </header>
        <div className={styles.errorContainer}>
          <p>{error}</p>
          <button onClick={handleRetry} className={styles.retryButton}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.discoverContainer}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <Image 
            src="/favicon.ico" 
            alt="DuoFinder" 
            width={40}
            height={40}
            className={styles.logo}
          />
          <span className={styles.brandText}>Descubrí</span>
        </div>
        
        <div className={styles.navButtons}>
          <Link href="/preferences" className={styles.settingsBtn}>⚙️</Link>
        </div>
      </header>

      <div className={styles.cardsContainer}>
        {currentIndex < suggestions.length ? (
          <>
            {/* Next card (always positioned behind) */}
            {currentIndex + 1 < suggestions.length && (
              <div className={`${styles.nextCardWrapper} ${isAnimating ? styles.animating : ''}`}>
                <SwipeCard
                  profile={discoverService.suggestionToProfile(suggestions[currentIndex + 1])}
                  onSwipe={handleSwipe}
                  onViewDetails={() => setSelectedProfile(discoverService.suggestionToProfile(suggestions[currentIndex + 1]))}
                />
              </div>
            )}
            
            {/* Current card */}
            <div className={`${styles.currentCardWrapper} ${isAnimating ? styles.animating : ''}`}>
              <SwipeCard
                ref={swipeCardRef}
                profile={discoverService.suggestionToProfile(suggestions[currentIndex])}
                onSwipe={handleSwipe}
                onViewDetails={handleViewDetails}
              />
            </div>

            {/* Loading indicator for more suggestions */}
            {isLoadingMore && (
              <div className={styles.loadingMore}>
                <p>Cargando más sugerencias...</p>
              </div>
            )}
          </>
        ) : (
          <div className={`${styles.noMoreProfiles} ${showNoMore ? styles.visible : ''}`}>
            <h2>No hay más perfiles!</h2>
            <p>Volve luego o ajusta tus preferencias para seguir buscando</p>
            <button onClick={() => loadSuggestions(0, BATCH_SIZE)} className={styles.retryButton}>
              Recargar sugerencias
            </button>
          </div>
        )}
      </div>

      {/* Profile Detail Modal */}
      {selectedProfile && (
        <ProfileDetail
          profile={selectedProfile}
          isOpen={!!selectedProfile}
          onClose={handleCloseDetails}
          onLike={handleDetailLike}
          onDislike={handleDetailDislike}
        />
      )}
    </div>
  );
};

export default Discover;