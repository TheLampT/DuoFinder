import React from 'react';
import { Profile } from '@/lib/mockData';
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
  if (!isOpen) return null;

  const handleLike = () => {
    onLike();
    onClose();
  };

  const handleDislike = () => {
    onDislike();
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
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
            <h2>{profile.name}, {profile.age}</h2>
            <p>{profile.bio}</p>
          </div>
        </div>
        
        <div className={styles.detailsSection}>
          <h3>About Me</h3>
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.</p>
          {/* Add more detailed information here */}
        </div>
        
        <div className={styles.interestsSection}>
          <h3>Interests</h3>
          <div className={styles.interests}>
            {profile.interests.map((interest, index) => (
              <span key={index} className={styles.interestTag}>{interest}</span>
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