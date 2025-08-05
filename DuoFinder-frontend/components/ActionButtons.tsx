import React from 'react';

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
    <div className="action-buttons">
      <button 
        className="dislike-button" 
        onClick={onDislike}
        aria-label="Dislike"
        disabled={disabled}
      >
        ✖️
      </button>
      <button 
        className="like-button" 
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