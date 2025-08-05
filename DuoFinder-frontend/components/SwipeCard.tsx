import React, { useState, useRef, useEffect } from 'react';
import { Profile } from '@/lib/mockData';

interface SwipeCardProps {
  profile: Profile;
  onSwipe: (direction: 'left' | 'right') => void;
}

const SwipeCard: React.FC<SwipeCardProps> = ({ profile, onSwipe }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Handle mouse/touch start
  const handleStart = (clientX: number, clientY: number) => {
    setStartPos({ x: clientX, y: clientY });
    setIsDragging(true);
  };

  // Handle dragging
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

  // Handle end of drag
  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    // Determine if swipe was significant enough
    const threshold = 100;
    if (Math.abs(position.x) > threshold) {
      onSwipe(position.x > 0 ? 'right' : 'left');
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

  return (
    <div
      ref={cardRef}
      className="swipe-card"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="card-content">
        <div 
          className="profile-image"
          style={{ backgroundImage: `url(${profile.image})` }}
        />
        
        <div className="profile-info">
          <h2>{profile.name}, {profile.age}</h2>
          <p>{profile.bio}</p>
          
          <div className="interests">
            {profile.interests.map((interest, index) => (
              <span key={index} className="interest-tag">{interest}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SwipeCard;