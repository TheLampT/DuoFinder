import React, { useState, useRef, useImperativeHandle, forwardRef, useEffect } from 'react';
import { Profile, UserGame } from '@/lib/types';
import styles from '@/styles/components/SwipeCard.module.css';

interface SwipeCardProps {
  profile: Profile;
  onSwipe: (direction: 'left' | 'right') => void;
  onViewDetails: () => void;
}

export interface SwipeCardHandle {
  triggerSwipe: (direction: 'left' | 'right') => void;
}

const SwipeCard = forwardRef<SwipeCardHandle, SwipeCardProps>(({ profile, onSwipe, onViewDetails }, ref) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Reset card when profile changes
  useEffect(() => {
    if (cardRef.current) {
      cardRef.current.style.transform = 'translate(0px, 0px) rotate(0deg)';
      cardRef.current.style.opacity = '1';
      cardRef.current.style.transition = '';
    }
    setPosition({ x: 0, y: 0 });
    setIsDragging(false);
  }, [profile]);

  // Expose the triggerSwipe method to parent component
  useImperativeHandle(ref, () => ({
    triggerSwipe: (direction: 'left' | 'right') => {
      // Animate swipe out for button clicks
      if (cardRef.current) {
        cardRef.current.style.transition = 'transform 0.5s ease, opacity 0.5s ease';
        
        // Use smaller distances that won't extend beyond the container
        if (direction === 'right') {
          cardRef.current.style.transform = 'translate(400px, 100px) rotate(30deg)';
        } else {
          cardRef.current.style.transform = 'translate(-400px, 100px) rotate(-30deg)';
        }
        cardRef.current.style.opacity = '0';
        
        // Call onSwipe after animation completes
        setTimeout(() => {
          onSwipe(direction);
        }, 300);
      }
    }
  }));

  // Handle drag start
  const handleStart = (clientX: number, clientY: number) => {
    setStartPos({ x: clientX, y: clientY });
    setIsDragging(true);
    
    // Remove transition during dragging
    if (cardRef.current) {
      cardRef.current.style.transition = 'none';
    }
  };

  // Handle movement during drag
  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    
    const x = clientX - startPos.x;
    const y = clientY - startPos.y;
    setPosition({ x, y });
    
    // Add rotation based on swipe direction
    const rotate = x * 0.05;
    if (cardRef.current) {
      cardRef.current.style.transform = `translate(${x}px, ${y}px) rotate(${rotate}deg)`;
    }
  };

  // Handle drag end
  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    // Determine if drag exceeded the threshold
    const threshold = 100;
    if (Math.abs(position.x) > threshold) {
      // For manual swipe, animate out
      if (cardRef.current) {
        cardRef.current.style.transition = 'transform 0.5s ease, opacity 0.5s ease';
        
        if (position.x > 0) {
          cardRef.current.style.transform = 'translate(800px, 100px) rotate(30deg)';
        } else {
          cardRef.current.style.transform = 'translate(-800px, 100px) rotate(-30deg)';
        }
        cardRef.current.style.opacity = '0';
        
        // Call onSwipe after animation completes
        setTimeout(() => {
          onSwipe(position.x > 0 ? 'right' : 'left');
        }, 300);
      }
    } else {
      // Return to original position
      setPosition({ x: 0, y: 0 });
      if (cardRef.current) {
        cardRef.current.style.transform = 'translate(0px, 0px) rotate(0deg)';
        cardRef.current.style.transition = 'transform 0.3s ease';
        setTimeout(() => {
          if (cardRef.current) {
            cardRef.current.style.transition = '';
          }
        }, 300);
      }
    }
  };

  // Mouse event handlers
  const onMouseDown = (e: React.MouseEvent) => handleStart(e.clientX, e.clientY);
  const onMouseMove = (e: React.MouseEvent) => handleMove(e.clientX, e.clientY);
  const onMouseUp = () => handleEnd();
  const onMouseLeave = () => handleEnd();
  
  // Touch event handlers
  const onTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
  };
  
  const onTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);
  };
  
  const onTouchEnd = () => handleEnd();

  // Info button handler
  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering drag events
    onViewDetails();
  };

  return (
    <div
      ref={cardRef}
      className={styles.swipeCard}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <button 
        className={styles.infoButton} 
        onClick={handleInfoClick}
        aria-label="View profile details"
      >
        ℹ️
      </button>
      
      <div className={styles.cardContent}>
        <div 
          className={styles.profileImage}
          style={{ backgroundImage: `url(${profile.image})` }}
        />
        
        <div className={styles.profileInfo}>
          <h2>{profile.username || profile.name}, {profile.age}</h2>
          <p>{profile.bio}</p>
          
          <div className={styles.gameInfo}>
            <span className={styles.gameTag}>{profile.game}</span>
            <span className={styles.skillLevel}>{profile.skillLevel}</span>
            {profile.isRanked && (
              <span className={styles.rankedBadge}>Ranked</span>
            )}
          </div>

          {/* Si quieres mostrar múltiples juegos (opcional) */}
          {profile.games && profile.games.length > 0 && (
            <div className={styles.additionalGames}>
              <p>Otros juegos:</p>
              <div className={styles.gameTags}>
                {profile.games.slice(0, 3).map((game: UserGame, index: number) => (
                  <span key={game.game_id || index} className={styles.gameTag}>
                    {game.game_name}
                  </span>
                ))}
                {profile.games.length > 3 && (
                  <span className={styles.moreGames}>+{profile.games.length - 3}</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

SwipeCard.displayName = 'SwipeCard';

export default SwipeCard;