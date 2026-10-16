import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './KRAAddressModal.module.css';

const KRAAddressModal = ({ addressData, onClose }) => {
  const navigate = useNavigate();

  const handleProceed = () => {
    navigate('/bank-verification');
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2 className={styles.modalTitle}>KRA Address Details</h2>
        
        <div className={styles.addressContainer}>
          <div className={styles.addressField}>
            <label>Address Line 1</label>
            <div className={styles.value}>{addressData.addressLine1}</div>
          </div>

          <div className={styles.addressField}>
            <label>Address Line 2</label>
            <div className={styles.value}>{addressData.addressLine2}</div>
          </div>

          <div className={styles.addressRow}>
            <div className={styles.addressField}>
              <label>City</label>
              <div className={styles.value}>{addressData.city}</div>
            </div>

            <div className={styles.addressField}>
              <label>State</label>
              <div className={styles.value}>{addressData.state}</div>
            </div>
          </div>

          <div className={styles.addressRow}>
            <div className={styles.addressField}>
              <label>Country</label>
              <div className={styles.value}>{addressData.country}</div>
            </div>

            <div className={styles.addressField}>
              <label>Pincode</label>
              <div className={styles.value}>{addressData.pincode}</div>
            </div>
          </div>
        </div>

        <button className={styles.proceedButton} onClick={handleProceed}>
          Proceed
        </button>
      </div>
    </div>
  );
};

export default KRAAddressModal;