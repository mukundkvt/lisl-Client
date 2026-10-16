import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './DigiLockerSuccess.module.css';
import successImage from '../../assets/icons/success.gif';

const DigiLockerSuccess = () => {
  // eslint-disable-next-line no-unused-vars
  const [digilockerDetails, setDigilockerDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(3);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDigilockerDetails = async () => {
      const token = localStorage.getItem('authToken');

      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/get_digilocker_details`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setDigilockerDetails(data); // Store the response data
          setCountdown(3); // Start countdown after successful API call
        } else {
          const errorData = await response.json();
          const errorMsg =
            errorData.message ||
            'Please tick Aadhaar and PAN on DIgilocker page to procceed via digilocker..';
          setError(errorMsg);
          navigate('/address', {
            state: { error: errorMsg },
            replace: true,
          });
        }
      } catch (error) {
        console.error('Error fetching Digilocker details:', error);
        const errorMsg =
          'Please tick Aadhaar and PAN on DIgilocker page to procceed via digilocker..';
        setError(errorMsg);
        navigate('/address', {
          state: { error: errorMsg },
          replace: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDigilockerDetails();
  }, [navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else {
      navigate('/bank-verification'); // Use useNavigate for navigation
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown]);

  if (loading) {
    return <h1>Loading...</h1>;
  }

  if (error) {
    return <h1>Error: {error}</h1>;
  }

  return (
    <div className={styles.successContainer}>
      <img src={successImage} alt="Success" className={styles.successImage} />
      <h1>Success</h1>
      <p>Your DigiLocker request was successful!</p>
      {countdown > 0 && <p>Redirecting in {countdown} seconds...</p>}
    </div>
  );
};

export default DigiLockerSuccess;