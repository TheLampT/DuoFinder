import React from 'react';
import styles from './../styles/ActionButtons.module.css'; // Create this file

interface ActionButtonsProps {
  onDislike: () => void;
  onLike: () => void;
  disabled: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ 
  onDislike, 
  onLike,
  disabled 
}) => {
  return (
    <div className={styles.actionButtons}>
      <button 
        className={styles.dislikeButton} 
        onClick={onDislike}
        aria-label="Dislike"
        disabled={disabled}
      >
        ✖️
      </button>
      <button 
        className={styles.likeButton} 
        onClick={onLike}
        aria-label="Like"
        disabled={disabled}
      >
        ❤️
      </button>
    </div>
  );
};

export default ActionButtons;