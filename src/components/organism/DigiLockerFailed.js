import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './DigiLockerFailed.module.css';
import failedImage from '../../assets/icons/failed.svg';

const DigiLockerFailed = () => {
  const [countdown, setCountdown] = useState(3);
  const navigate = useNavigate();

  const errorMessage =
    'Please tick Aadhaar and PAN on DIgilocker page to procceed via digilocker..';

  useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else {
      navigate('/address', {
        state: { error: errorMessage },
        replace: true,
      });
    }
  }, [countdown, navigate, errorMessage]);

  return (
    <div className={styles.failedContainer}>
      <img src={failedImage} alt="Failed" className={styles.failedImage} />
      <h1 className={styles.title}>Verification Failed</h1>
      <p className={styles.message}>{errorMessage}</p>
      <p className={styles.countdown}>Redirecting in {countdown} seconds...</p>
      <p className={styles.redirectText}>Taking you back to the verification page</p>
    </div>
  );
};

export default DigiLockerFailed;