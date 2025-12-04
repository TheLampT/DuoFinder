'use client';

import React, { useEffect } from 'react';
import styles from '@/styles/components/SuccessModal.module.css'; // You'll need to create this CSS module
import Image from 'next/image';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

const SuccessModal: React.FC<SuccessModalProps> = ({ 
  isOpen, 
  onClose, 
  message = '¡Cuenta creada con éxito!' 
}) => {
  // Close automatically after 3 seconds and redirect
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
    <div className={styles.successModalOverlay}>
      <div className={styles.successModal}>
        <div className={styles.successModalContent}>
          <div className={styles.successIcon}>
            <Image 
              src="/favicon.ico" 
              alt="DuoFinder" 
              width={60}
              height={60}
            />
          </div>
          <h2 className={styles.successTitle}>¡Excelente!</h2>
          <p className={styles.successMessage}>{message}</p>
          <div className={styles.successProgressBar}>
            <div className={styles.successProgress} />
          </div>
          <p className={styles.successSubtext}>Redirigiendo al inicio de sesión...</p>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;