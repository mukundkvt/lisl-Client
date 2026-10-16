import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKyc } from '../../context/KycContext';
import styles from './ThankYou.module.css';

const ThankYou = () => {
  const navigate = useNavigate();
  const { isRejectedMode, firstPendingRejectedStep, handleLogout } = useKyc();

  // If in rejection mode, automatically redirect user to the first rejected step
  useEffect(() => {
    if (isRejectedMode && firstPendingRejectedStep) {
      navigate(firstPendingRejectedStep.path, { replace: true });
    }
  }, [isRejectedMode, firstPendingRejectedStep, navigate]);

  if (isRejectedMode && firstPendingRejectedStep) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div
            className={styles.checkmarkContainer}
            style={{ background: '#fef2f2', borderColor: '#fca5a5' }}
          >
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#dc2626"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <h1 className={styles.title} style={{ color: '#991b1b' }}>
            Correction Required
          </h1>
          <p className={styles.message}>
            Our team has reviewed your KYC details. Some sections need your correction before we can finalize your account.
          </p>
          <button
            className={styles.logoutButton}
            style={{
              backgroundImage: 'linear-gradient(45deg, #2563eb, #3b82f6)',
              marginBottom: '0.5rem'
            }}
            onClick={() => navigate(firstPendingRejectedStep.path)}
          >
            Fix {firstPendingRejectedStep.title} Details
          </button>
          <button className={styles.logoutButton} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.checkmarkContainer}>
          <svg
            className={styles.checkmark}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 52 52"
          >
            <circle className={styles.checkmarkCircle} cx="26" cy="26" r="25" fill="none" />
            <path
              className={styles.checkmarkCheck}
              fill="none"
              d="M14.1 27.2l7.1 7.2 16.7-16.8"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <h1 className={styles.title}>Account Processed!</h1>
        <p className={styles.message}>
          Your EKYC Process has been completed. Our team will verify your details and revert accordingly. Thank you for your patience. You may reach out to us on support@lakshmishree.in for any query.
        </p>
        <button className={styles.logoutButton} onClick={handleLogout}>
          Return to Home
        </button>
      </div>
    </div>
  );
};

export default ThankYou;