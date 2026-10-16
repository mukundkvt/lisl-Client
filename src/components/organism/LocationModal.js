import React from 'react';
import styles from './LocationModal.module.css';

const LocationModal = ({ onClose, onRetry }) => {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <button className={styles.closeButton} onClick={onClose}>×</button>
        <h2 className={styles.modalTitle}>Location Access Required</h2>
        <p className={styles.modalText}>
          We need your location to proceed with the verification process. 
          Please allow location access when prompted.
        </p>
        <button className={styles.modalButton} onClick={onRetry}>
          Try Again
        </button>
      </div>
    </div>
  );
};

export default LocationModal;
