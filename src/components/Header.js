/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    const checkLoginStatus = async () => {
      // Skip API call if current path is '/digilocker-success'
      if (location.pathname === '/digilocker-success') {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const token = localStorage.getItem('authToken');

        if (!token) {
          navigate('/'); // Redirect to home page (login) if no token
          return;
        }

        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/is_logged_in`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();

        if (response.ok) {
          switch (data.max_step_completed) {
            case 1: navigate('/pan'); break;
            case 2: navigate('/address'); break;
            case 3: navigate('/bank-verification'); break;
            case 4: navigate('/profile'); break;
            case 5: navigate('/exchange'); break;
            case 6: navigate('/ipv'); break;
            case 7: navigate('/signature'); break;
            case 8: navigate('/esign'); break;
            case 9: navigate('/thank-you'); break;
            default: navigate('/'); break; // Redirect to home page for 0 or undefined
          }
        } else {
          navigate('/'); // Redirect to home page on API error
        }
      } catch (error) {
        console.error('Error checking login status:', error);
        navigate('/'); // Redirect to home page on network error
      } finally {
        setIsLoading(false);
      }
    };

    // checkLoginStatus();
  }, []); // Empty dependency array - runs only once on mount

  return (
    <>
      
    </>
  );
};

export default Header;