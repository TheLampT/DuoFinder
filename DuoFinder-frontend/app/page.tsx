'use client';

import React, { useState } from 'react';
import SwipeCard from '@/components/SwipeCard';
import ActionButtons from '@/components/ActionButtons';
import { profiles } from '@/lib/mockData';

const DuoFinder: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const handleSwipe = (direction: 'left' | 'right') => {
    console.log(`Swiped ${direction} on profile ${profiles[currentIndex].id}`);
    setCurrentIndex(prevIndex => prevIndex + 1);
  };

  const handleLike = () => {
    if (currentIndex < profiles.length) {
      handleSwipe('right');
    }
  };

  const handleDislike = () => {
    if (currentIndex < profiles.length) {
      handleSwipe('left');
    }
  };

  return (
    <div className="duo-finder-container">
      <header>
        <h1>DuoFinder</h1>
      </header>

      <div className="cards-container">
        {currentIndex < profiles.length ? (
          <SwipeCard
            profile={profiles[currentIndex]}
            onSwipe={handleSwipe}
          />
        ) : (
          <div className="no-more-profiles">
            <h2>No more profiles!</h2>
            <p>Check back later for new matches</p>
          </div>
        )}
      </div>

      <ActionButtons 
        onDislike={handleDislike} 
        onLike={handleLike} 
      />
    </div>
  );
};

export default DuoFinder;