// app/discover/page.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import SwipeCard from '@/components/SwipeCard';
import ProfileDetail from '@/components/ProfileDetail';
import { useProfiles } from '@/hooks/useProfiles';
import { Profile } from '@/lib/types';
import styles from '@/styles/pages/discover.module.css';
import Link from 'next/link';
import Image from 'next/image';

interface SwipeCardRef {
  triggerSwipe: (direction: 'left' | 'right') => void;
}

const Discover: React.FC = () => {
  const { profiles, loading, error, hasMore, loadMoreProfiles, swipeProfile } = useProfiles();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showNoMore, setShowNoMore] = useState(false);
  const swipeCardRef = useRef<SwipeCardRef | null>(null);

  // Cargar más perfiles cuando queden 5
  useEffect(() => {
    if (hasMore && profiles.length > 0 && currentIndex >= profiles.length - 5) {
      loadMoreProfiles();
    }
  }, [currentIndex, profiles.length, hasMore, loadMoreProfiles]);

  // Mostrar "no más perfiles" cuando llegamos al final
  useEffect(() => {
    if (currentIndex >= profiles.length && !hasMore && !loading) {
      setShowNoMore(true);
    } else {
      setShowNoMore(false);
    }
  }, [currentIndex, profiles.length, hasMore, loading]);

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (currentIndex >= profiles.length) return;

    const currentProfile = profiles[currentIndex];
    console.log(`Swiped ${direction} on profile ${currentProfile.id}`);
    
    // Registrar el swipe en la API
    const success = await swipeProfile(currentProfile.id, direction === 'right');
    
    if (!success) {
      // Manejar error (podrías mostrar un toast o mensaje)
      console.error('Failed to register swipe');
    }

    // Start animation
    setIsAnimating(true);
    
    // Move to next profile after animation completes
    setTimeout(() => {
      setCurrentIndex(prevIndex => prevIndex + 1);
      setIsSwiping(false);
      setIsAnimating(false);
    }, 300);
  };

  const handleLike = () => {
    if (currentIndex < profiles.length && !isSwiping && !isAnimating) {
      setIsSwiping(true);
      if (swipeCardRef.current) {
        swipeCardRef.current.triggerSwipe('right');
      }
    }
  };

  const handleDislike = () => {
    if (currentIndex < profiles.length && !isSwiping && !isAnimating) {
      setIsSwiping(true);
      if (swipeCardRef.current) {
        swipeCardRef.current.triggerSwipe('left');
      }
    }
  };

  const handleViewDetails = () => {
    if (currentIndex < profiles.length) {
      setSelectedProfile(profiles[currentIndex]);
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

  // Resetear el índice cuando se cargan nuevos perfiles
  useEffect(() => {
    if (currentIndex >= profiles.length && profiles.length > 0) {
      setCurrentIndex(0);
    }
  }, [profiles.length]);

  // Mostrar loading inicial
  if (loading && profiles.length === 0) {
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
        <div className={styles.loadingState}>
          <p>Cargando perfiles...</p>
        </div>
      </div>
    );
  }

  // Mostrar error
  if (error && profiles.length === 0) {
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
        <div className={styles.errorState}>
          <p>Error: {error}</p>
          <button 
            onClick={() => loadMoreProfiles()} 
            className={styles.retryButton}
          >
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
        {currentIndex < profiles.length ? (
          <>
            {/* Next card (always positioned behind) */}
            {currentIndex + 1 < profiles.length && (
              <div className={`${styles.nextCardWrapper} ${isAnimating ? styles.animating : ''}`}>
                <SwipeCard
                  profile={profiles[currentIndex + 1]}
                  onSwipe={handleSwipe}
                  onViewDetails={() => setSelectedProfile(profiles[currentIndex + 1])}
                />
              </div>
            )}
            
            {/* Current card */}
            <div className={`${styles.currentCardWrapper} ${isAnimating ? styles.animating : ''}`}>
              <SwipeCard
                ref={swipeCardRef}
                profile={profiles[currentIndex]}
                onSwipe={handleSwipe}
                onViewDetails={handleViewDetails}
              />
            </div>

            {/* Loading indicator mientras carga más perfiles */}
            {loading && (
              <div className={styles.loadingIndicator}>
                <p>Cargando más perfiles...</p>
              </div>
            )}
          </>
        ) : (
          <div className={`${styles.noMoreProfiles} ${showNoMore ? styles.visible : ''}`}>
            <h2>No hay más perfiles!</h2>
            <p>Volve luego o ajusta tus preferencias para seguir buscando</p>
            {loading && (
              <div className={styles.loadingMore}>
                <p>Cargando más perfiles...</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action buttons */}
      {currentIndex < profiles.length && (
        <div className={styles.actionButtons}>
          <button 
            className={`${styles.dislikeButton} ${isSwiping || isAnimating ? styles.disabled : ''}`}
            onClick={handleDislike}
            disabled={isSwiping || isAnimating}
            aria-label="Dislike"
          >
            ✖️
          </button>
          <button 
            className={`${styles.likeButton} ${isSwiping || isAnimating ? styles.disabled : ''}`}
            onClick={handleLike}
            disabled={isSwiping || isAnimating}
            aria-label="Like"
          >
            ❤️
          </button>
        </div>
      )}

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