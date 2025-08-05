import React from 'react';

interface ActionButtonsProps {
  onDislike: () => void;
  onLike: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ onDislike, onLike }) => {
  return (
    <div className="action-buttons">
      <button 
        className="dislike-button" 
        onClick={onDislike}
        aria-label="Dislike"
      >
        ✖️
      </button>
      <button 
        className="like-button" 
        onClick={onLike}
        aria-label="Like"
      >
        ❤️
      </button>
    </div>
  );
};

export default ActionButtons;