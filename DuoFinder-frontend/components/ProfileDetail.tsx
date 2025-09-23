import React, { useState } from 'react';
import { Profile } from '@/test/mock/mockData';
import styles from '@/styles/components/ProfileDetail.module.css';

interface ProfileDetailProps {
  profile: Profile;
  isOpen: boolean;
  onClose: () => void;
  onLike: () => void;
  onDislike: () => void;
}

const ProfileDetail: React.FC<ProfileDetailProps> = ({ 
  profile, 
  isOpen, 
  onClose, 
  onLike, 
  onDislike 
}) => {
  const [showCopyFeedback, setShowCopyFeedback] = useState(false);
  const [copiedUsername, setCopiedUsername] = useState('');

  if (!isOpen) return null;

  const handleLike = () => {
    onLike();
    onClose();
  };

  const handleDislike = () => {
    onDislike();
    onClose();
  };

  // Render ranked or casual icon
  const renderRankedIcon = (isRanked: boolean) => {
    return isRanked ? (
      <span className={styles.rankedIcon} title="Ranked Competitive">🏆</span>
    ) : (
      <span className={styles.casualIcon} title="Casual Play">🎮</span>
    );
  };

  // Copy Discord username to clipboard with nice feedback
  const copyDiscordToClipboard = async () => {
    if (profile.discord) {
      try {
        await navigator.clipboard.writeText(profile.discord);
        setCopiedUsername(profile.discord);
        setShowCopyFeedback(true);
        
        // Auto-hide after 2 seconds
        setTimeout(() => {
          setShowCopyFeedback(false);
        }, 2000);
      } catch (err) {
        console.error('Failed to copy: ', err);
      }
    }
  };

  return (
    <div className={styles['modal-overlay']} onClick={onClose}>
      {/* Copy Feedback Modal */}
      {showCopyFeedback && (
        <div className={styles.copyFeedback}>
          <div className={styles.feedbackContent}>
            <div className={styles.feedbackIcon}>✅</div>
            <div className={styles.feedbackText}>
              <span className={styles.feedbackMain}>Copied to clipboard!</span>
              <span className={styles.feedbackSub}>{copiedUsername}</span>
            </div>
          </div>
        </div>
      )}
      
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose} aria-label="Close">
          ✕
        </button>
        
        <div className={styles.profileHeader}>
          <div 
            className={styles.profileImage}
            style={{ backgroundImage: `url(${profile.image})` }}
          />
          <div className={styles.profileBasicInfo}>
            <h2>{profile.username}, {profile.age}</h2>
          </div>
        </div>
        
        <div className={styles.detailsSection}>
          <h3>About Me</h3>
          <p>{profile.bio}</p>
        </div>
        
        <div className={styles.interestsSection}>
          <h3>Gaming Skills</h3>
          <div className={styles.gameSkillsGrid}>
            {profile.gameSkill.map((gameSkill, index) => (
              <div key={index} className={styles.gameSkillItem}>
                <div className={styles.gameInfo}>
                  <div className={styles.gameHeader}>
                    <span className={styles.gameName}>{gameSkill.game}</span>
                    {renderRankedIcon(gameSkill.isRanked)}
                  </div>
                  <div className={styles.skillLevel}>{gameSkill.skill}</div>
                </div>
              </div>
            ))}
          </div>
        </div>        
        <div className={styles.actionButtons}>
          <button className={styles.dislikeButton} onClick={handleDislike}>
            ✖️
          </button>
          <button className={styles.likeButton} onClick={handleLike}>
            ❤️
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileDetail;