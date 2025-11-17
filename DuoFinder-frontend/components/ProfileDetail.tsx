// components/ProfileDetail.tsx
import React from 'react';
import { Profile } from '@/lib/types';
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
  onDislike,
}) => {
  const [showCopyFeedback, setShowCopyFeedback] = useState(false);
  const [copiedUsername, setCopiedUsername] = useState('');

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>
          ×
        </button>
        
        <div className={styles.profileHeader}>
          <img
            src={profile.image}
            alt={profile.name}
            className={styles.profileImage}
          />
          <div className={styles.profileInfo}>
            <h2 className={styles.profileName}>{profile.name}</h2>
            <p className={styles.profileAge}>{profile.age} años</p>
            {profile.server && (
              <p className={styles.profileServer}>Servidor: {profile.server}</p>
            )}
          </div>
        </div>

        <div className={styles.profileDetails}>
          {profile.bio && (
            <div className={styles.detailSection}>
              <h3>Bio</h3>
              <p>{profile.bio}</p>
            </div>
          )}

          <div className={styles.detailSection}>
            <h3>Juego</h3>
            <p>{profile.game}</p>
          </div>

          <div className={styles.detailSection}>
            <h3>Nivel de habilidad</h3>
            <p>{profile.skillLevel}</p>
            {profile.isRanked && <span className={styles.rankedBadge}>Ranked</span>}
          </div>

          {profile.discord && (
            <div className={styles.detailSection}>
              <h3>Discord</h3>
              <p>{profile.discord}</p>
            </div>
          )}

          {profile.tracker && (
            <div className={styles.detailSection}>
              <h3>Tracker</h3>
              <p>{profile.tracker}</p>
            </div>
          )}
        </div>

        <div className={styles.actionButtons}>
          <button
            className={`${styles.actionButton} ${styles.dislikeButton}`}
            onClick={onDislike}
          >
            ✕
          </button>
          <button
            className={`${styles.actionButton} ${styles.likeButton}`}
            onClick={onLike}
          >
            ♥
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileDetail;