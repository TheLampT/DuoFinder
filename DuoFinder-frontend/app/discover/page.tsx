'use client';

import React, { useState } from 'react';
import SwipeCard from '@/components/SwipeCard';
import ActionButtons from '@/components/ActionButtons';
import { profiles } from '@/lib/mockData';
import styles from './../../styles/page.module.css'; // Create this file for page-specific styles

const DuoFinder: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipedCards, setSwipedCards] = useState<number[]>([]);
  const [nextCardReady, setNextCardReady] = useState(false);
  
  // Handle swipe completion
  const handleSwipe = (direction: 'left' | 'right') => {
    console.log(`Swiped ${direction} on profile ${profiles[currentIndex].id}`);
    
    // Mark current card as swiped
    setSwipedCards(prev => [...prev, currentIndex]);
    
    // Prepare next card with a slight delay
    setTimeout(() => {
      setNextCardReady(true);
    }, 200);
    
    // Move to next profile after animation completes
    setTimeout(() => {
      setCurrentIndex(prevIndex => prevIndex + 1);
      setIsSwiping(false);
      setNextCardReady(false);
    }, 500); // Match CSS animation duration
  };

  // Handle like button click
  const handleLike = () => {
    if (currentIndex < profiles.length && !isSwiping) {
      setIsSwiping(true);
      handleSwipe('right');
    }
  };

  // Handle dislike button click
  const handleDislike = () => {
    if (currentIndex < profiles.length && !isSwiping) {
      setIsSwiping(true);
      handleSwipe('left');
    }
  };

  return (
    <div className={styles.duoFinderContainer}>
      <header className={styles.header}>
        <h1>DuoFinder</h1>
      </header>

      <div className={styles.cardsContainer}>
        {currentIndex < profiles.length ? (
          <>
            {/* Current card with smooth exit */}
            {!swipedCards.includes(currentIndex) && (
              <div className={`${styles.cardWrapper} ${isSwiping ? styles.exiting : ''}`}>
                <SwipeCard
                  profile={profiles[currentIndex]}
                  onSwipe={handleSwipe}
                />
              </div>
            )}
            
            {/* Next card with smooth entrance */}
            {nextCardReady && currentIndex + 1 < profiles.length && (
              <div className={`${styles.cardWrapper} ${styles.entering}`}>
                <SwipeCard
                  profile={profiles[currentIndex + 1]}
                  onSwipe={handleSwipe}
                />
              </div>
            )}
          </>
        ) : (
          <div className={styles.noMoreProfiles}>
            <h2>No more profiles!</h2>
            <p>Check back later for new matches</p>
          </div>
        )}
      </div>

      <ActionButtons 
        onDislike={handleDislike} 
        onLike={handleLike} 
        disabled={isSwiping || currentIndex >= profiles.length}
      />
    </div>
  );
};

export default DuoFinder;