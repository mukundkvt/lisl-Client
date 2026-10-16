import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './EsignVerify.module.css';
import SignatureIcon from '../../assets/icons/KYCiconsSign.svg';

const EsignVerify = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    const verifyContract = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          setError('Authentication failed. Please login again.');
          setIsLoading(false);
          return;
        }
        
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/pull_contract`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        
        const data = await response.json();
        
        if (data.success) {
          // Redirect to thank-you page on success
          navigate('/thank-you');
        } else {
          setError(data.message || 'Verification failed. Please try again.');
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error verifying contract:', err);
        setError('Failed to verify document. Please try again.');
        setIsLoading(false);
      }
    };
    
    verifyContract();
  }, [navigate]);
  
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {isLoading ? (
          <>
            <img src={SignatureIcon} alt="Signature Icon" className={styles.icon} />
            <h2 className={styles.title}>Verifying E-Sign Document</h2>
            <p className={styles.message}>Please wait while we verify your document...</p>
            <div className={styles.loader}></div>
          </>
        ) : (
          <>
            <img src={SignatureIcon} alt="Signature Icon" className={styles.icon} />
            <h2 className={styles.title}>Verification Failed</h2>
            <p className={styles.message}>{error}</p>
            <button 
              onClick={() => navigate('/esign')} 
              className={styles.retryButton}
            >
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default EsignVerify;