import React, { useState, useRef } from 'react';
import { Profile } from '@/lib/mockData';
import styles from './../styles/SwipeCard.module.css';

interface SwipeCardProps {
  profile: Profile;
  onSwipe: (direction: 'left' | 'right') => void;
}

const SwipeCard: React.FC<SwipeCardProps> = ({ profile, onSwipe }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isSwipingOut, setIsSwipingOut] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Handle drag start
  const handleStart = (clientX: number, clientY: number) => {
    if (isSwipingOut) return;
    
    setStartPos({ x: clientX, y: clientY });
    setIsDragging(true);
    
    // Remove transition during dragging
    if (cardRef.current) {
      cardRef.current.style.transition = 'none';
      cardRef.current.classList.remove(styles.swipingRight, styles.swipingLeft);
    }
  };

  // Handle movement during drag
  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging || isSwipingOut) return;
    
    const x = clientX - startPos.x;
    const y = clientY - startPos.y;
    setPosition({ x, y });
    
    // Add rotation based on swipe direction
    const rotate = x * 0.05;
    if (cardRef.current) {
      cardRef.current.style.transform = `translate(${x}px, ${y}px) rotate(${rotate}deg)`;
    }
  };

  // Animate card swipe out and remove it
  const animateSwipeOut = (direction: 'left' | 'right') => {
    setIsSwipingOut(true);
    
    if (cardRef.current) {
      // Add smooth exit animation
      cardRef.current.style.transition = 'transform 0.5s ease, opacity 0.5s ease';
      
      // Apply the appropriate animation class
      if (direction === 'right') {
        cardRef.current.classList.add(styles.swipingRight);
      } else {
        cardRef.current.classList.add(styles.swipingLeft);
      }
      
      // Call onSwipe callback after animation completes
      setTimeout(() => {
        onSwipe(direction);
      }, 300);
    }
  };

  // Handle drag end
  const handleEnd = () => {
    if (!isDragging || isSwipingOut) return;
    setIsDragging(false);
    
    // Determine if drag exceeded the threshold
    const threshold = 100;
    if (Math.abs(position.x) > threshold) {
      // Animate card swipe out
      animateSwipeOut(position.x > 0 ? 'right' : 'left');
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

  // Don't render if card is swiped out
  if (isSwipingOut) {
    return null;
  }

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
      <div className={styles.cardContent}>
        <div 
          className={styles.profileImage}
          style={{ backgroundImage: `url(${profile.image})` }}
        />
        
        <div className={styles.profileInfo}>
          <h2>{profile.name}, {profile.age}</h2>
          <p>{profile.bio}</p>
          
          <div className={styles.interests}>
            {profile.interests.map((interest, index) => (
              <span key={index} className={styles.interestTag}>{interest}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SwipeCard;