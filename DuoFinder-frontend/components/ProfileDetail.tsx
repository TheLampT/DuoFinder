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

        {/* Discord Section */}
        {profile.discord && (
          <div className={styles.discordSection}>
            <h3>Connect on Discord</h3>
            <div className={styles.discordCard} onClick={copyDiscordToClipboard}>
              <div className={styles.discordIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.09 16.09 0 0 0-4.8 0c-.14-.34-.35-.76-.54-1.09c-.01-.02-.04-.03-.07-.03c-1.5.26-2.93.71-4.27 1.33c-.01 0-.02.01-.03.02C2.44 8.78 1.91 12.04 2.2 15.28c0 .02.01.04.03.05c1.58 1.15 3.12 1.84 4.65 2.3c.03.01.06 0 .07-.02c.4-.55.76-1.13 1.07-1.74c.02-.04 0-.08-.04-.09c-.57-.22-1.11-.48-1.64-.78c-.04-.02-.04-.08-.01-.11c.11-.08.22-.17.33-.25c.02-.02.05-.02.07-.01c3.44 1.57 7.15 1.57 10.55 0c.02-.01.05-.01.07.01c.11.09.22.17.33.26c.04.03.04.09-.01.11c-.52.31-1.07.56-1.64.78c-.04.01-.05.06-.04.09c.32.61.68 1.19 1.07 1.74c.03.01.06.02.09.01c1.53-.46 3.07-1.15 4.65-2.3c.02-.01.03-.03.03-.05c.35-3.53-.73-6.78-2.46-9.93c-.01-.02-.02-.03-.04-.03zm-11.02 8.08c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.84 2.12-1.89 2.12zm6.5 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.83 2.12-1.89 2.12z"/>
                </svg>
              </div>
              <div className={styles.discordInfo}>
                <span className={styles.discordUsername}>{profile.discord}</span>
                <span className={styles.discordHint}>Click to copy username</span>
              </div>
              <div className={styles.copyIcon}>📋</div>
            </div>
          </div>
        )}
        
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