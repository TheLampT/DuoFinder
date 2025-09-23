'use client';

import React, { useState, useRef, useEffect } from 'react';
import SwipeCard from '@/components/SwipeCard';
import ProfileDetail from '@/components/ProfileDetail';
import { profiles, Profile } from '@/test/mock/mockData';
import styles from '@/styles/pages/discover.module.css';
import Link from 'next/link';

const Discover: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const swipeCardRef = useRef<any>(null);
  const [showNoMore, setShowNoMore] = useState(false);


  useEffect(() => {
    if (currentIndex >= profiles.length) {
      setShowNoMore(true);
    } else {
      setShowNoMore(false);
    }
  }, [currentIndex]);
  
  const handleSwipe = (direction: 'left' | 'right') => {
    console.log(`Swiped ${direction} on profile ${profiles[currentIndex].id}`);
    
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
    if (currentIndex < profiles.length && !isSwiping) {
      setIsSwiping(true);
      // Trigger swipe animation programmatically
      if (swipeCardRef.current) {
        swipeCardRef.current.triggerSwipe('right');
      }
    }
  };

  const handleDislike = () => {
    if (currentIndex < profiles.length && !isSwiping) {
      setIsSwiping(true);
      // Trigger swipe animation programmatically
      if (swipeCardRef.current) {
        swipeCardRef.current.triggerSwipe('left');
      }
    }
  };

  const handleViewDetails = () => {
    setSelectedProfile(profiles[currentIndex]);
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

  return (
    <div className={styles.discoverContainer}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>
          <img src="/favicon.ico" alt="DuoFinder" className={styles.logo} />
          <span className={styles.brandText}>DuoFinder</span>
        </Link>
        
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
          </>
        ) : (
          <div className={`${styles.noMoreProfiles} ${showNoMore ? styles.visible : ''}`}>
            <h2>No more profiles!</h2>
            <p>Check back later for new matches</p>
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