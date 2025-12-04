// components/MatchModal.tsx
'use client';

import React, { useEffect } from 'react';
import styles from '@/styles/components/MatchModal.module.css';
import Image from 'next/image';

interface MatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  avatar?: string;
}

const MatchModal: React.FC<MatchModalProps> = ({ isOpen, onClose, username, avatar }) => {
  // Cerrar automáticamente después de 3 segundos
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.matchModalOverlay}>
      <div className={styles.matchModal}>
        <div className={styles.matchModalContent}>
          <h2>🎉 ¡Es un match!</h2>
          <p>Has hecho match con <strong>{username}</strong></p>
          {avatar && (
            <div className={styles.matchAvatar}>
              <Image 
                src={avatar} 
                alt={username}
                width={80}
                height={80}
                className={styles.avatarImage}
              />
            </div>
          )}
          <p className={styles.matchMessage}>Ya pueden comenzar a chatear</p>
        </div>
      </div>
    </div>
  );
};

export default MatchModal;