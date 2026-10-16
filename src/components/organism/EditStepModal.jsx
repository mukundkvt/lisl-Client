import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './EditStepModal.module.css';

const EditStepModal = ({ onClose }) => {
  const navigate = useNavigate();

  const steps = [
    { id: 'pan', label: 'PAN Step', route: '/pan?redirect=/esign', icon: '📄' },
    { id: 'address', label: 'Address Step', route: '/address?redirect=/esign', icon: '🏠' },
    { id: 'bank', label: 'Bank Step', route: '/bank-verification?redirect=/esign', icon: '🏦' },
    { id: 'profile', label: 'Profile Step', route: '/profile?redirect=/esign', icon: '👤' },
    { id: 'exchange', label: 'Exchange Step', route: '/exchange?redirect=/esign', icon: '💱' },
    { id: 'ipv', label: 'IPV Step', route: '/ipv?redirect=/esign', icon: '📹' },
    { id: 'signature', label: 'Signature Step', route: '/signature?redirect=/esign', icon: '✍️' },
  ];

  const handleStepClick = (route) => {
    navigate(route);
    onClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Select Step to Edit</h3>
          <button className={styles.closeButton} onClick={onClose}>&times;</button>
        </div>
        <div className={styles.modalBody}>
          <p className={styles.modalDescription}>
            Please select the step you would like to edit. You will be redirected to that page.
          </p>
          <div className={styles.optionsGrid}>
            {steps.map((step) => (
              <div 
                key={step.id} 
                className={styles.optionCard}
                onClick={() => handleStepClick(step.route)}
              >
                <div className={styles.optionIcon}>{step.icon}</div>
                <div className={styles.optionLabel}>{step.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditStepModal;
