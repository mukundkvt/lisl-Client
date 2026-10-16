import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import toast from 'react-hot-toast';
import logo from '../assets/icons/logo.png'
import fullLogo from '../assets/icons/fullLogo.png'
import styles from './Homepage.module.css'
import light from '../assets/icons/light-striking.svg'
import mobileprefix from '../assets/icons/mobileprefix.svg'
import editIcon from '../assets/icons/edit_icon.svg';
import OTPIcon from '../assets/icons/PINorOTPIcon.svg';
import EmailIcon from '../assets/icons/emailIcon.svg';
const getInitialRedirectRoute = (data) => {
  const isRejected =
    (data.userStatus === 'rejected' ||
      (Array.isArray(data.rejectedSteps) && data.rejectedSteps.length > 0)) &&
    data.userStatus !== 'esigned' &&
    data.userStatus !== 'approved';

  if (isRejected) {
    const done = Array.isArray(data.rejectedStepsDone) ? data.rejectedStepsDone : [];
    const pendingRejected = data.rejectedSteps.filter((stepNum) => !done.includes(stepNum));
    const targetStep =
      pendingRejected.length > 0 ? Math.min(...pendingRejected) : Math.min(...data.rejectedSteps);

    switch (targetStep) {
      case 2:
        return '/address';
      case 3:
        return '/bank-verification';
      case 4:
        return '/profile';
      case 5:
        return '/exchange';
      case 6:
        return '/ipv';
      case 7:
        return '/signature';
      case 8:
        return '/esign';
      default:
        return '/address';
    }
  }

  // Standard non-rejected flow based on max_step_completed
  switch (data.max_step_completed) {
    case 1:
      return '/pan';
    case 2:
      return '/address';
    case 3:
      return '/bank-verification';
    case 4:
      return '/profile';
    case 5:
      return '/exchange';
    case 6:
      return '/ipv';
    case 7:
      return '/signature';
    case 8:
      return '/esign';
    case 9:
      return '/thank-you';
    default:
      return '/pan';
  }
};

const Homepage = () => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const Trade = ["Stocks", "IPO", "ETFs", "Futures", "Options", "Commodity"]
  const [currentTrade, setCurrentTrade] = useState(Trade[0]);
  const [index, setIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [mobileNumber, setMobileNumber] = useState('');
  const [mobileOTP, setMobileOTP] = useState('');
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [email, setEmail] = useState('');
  const [timer, setTimer] = useState(1);
  const [isResendEnabled, setIsResendEnabled] = useState(false);
  const [selectedUserType, setSelectedUserType] = useState('new');
  const [panNumber, setPanNumber] = useState("");
  const [loginMobileNumber, setLoginMobileNumber] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (page === 1 || page === 3) {
      setTimeout(() => {
        const firstInput = document.getElementById('otp-input-0');
        if (firstInput) {
          firstInput.focus();
        }
      }, 100);
    }
  }, [page]);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setIndex((prevIndex) => (prevIndex + 1) % Trade.length);
        setCurrentTrade(Trade[(index + 1) % Trade.length]);
        setIsVisible(true);
      }, 500);
    }, 3000);

    return () => clearInterval(interval);
  }, [Trade, index]);

  useEffect(() => {
    if (timer > 0) {
      const countdown = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);

      return () => clearInterval(countdown);
    } else {
      setIsResendEnabled(true);
    }
  }, [timer]);

  const handleMobileChange = (e) => {
    const value = e.target.value;
    if (/^\d{0,10}$/.test(value)) {
      setMobileNumber(value);
      setError('');
    }
  };

  const handleBlur = () => {
    if (mobileNumber.length < 10) {
      setError('Enter Mobile Number');
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    setError(''); // Clear any existing error
  };

  const handleEmailBlur = () => {
    if (!email) {
      setError('Email is required');
    } else if (!validateEmail(email)) {
      setError('Please enter a valid email address');
    } else {
      setError('');
    }
  };

  const handleOTPKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !mobileOTP[index] && index > 0) {
      document.getElementById(`otp-input-${index - 1}`).focus();
    }
  };


  const handleMobileProceed = async () => {
    if (mobileNumber.length < 10) {
      setError('Enter Mobile Number');
      return
    }
    setLoading(true);
    try {
      // Extract referralid from URL
      const urlParams = new URLSearchParams(window.location.search);
      const referralid = urlParams.get('referralid');
      console.log("referralid : " , referralid);
      
      
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/send_mobile_otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mobileNumber, referralid }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.isExistingUser) {
          setLoginMobileNumber(mobileNumber);
          setLoginError('');
          setPage('existingPan');
          setError('');
        } else {
          setPage(1);
          setError('');
          if (data.token) {
            localStorage.setItem('authToken', data.token);
          }
          setTimer(30);
          setIsResendEnabled(false);
        }
      } else {
        setError(data.message);
        if (data.message) {
          toast.error(data.message);
        }
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      setError('Failed to send OTP. Please try again.');
      toast.error('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const validateMobileOTP = async () => {
    try {
      // Check if OTP is 6 digits
      if (!mobileOTP || mobileOTP.length !== 6 || !/^\d+$/.test(mobileOTP)) {
        setError('Please enter a valid 6-digit OTP');
        return;
      }

      const token = localStorage.getItem('authToken');

      if (!token) {
        setError('Session expired. Redirecting to home.');
        setTimeout(() => {
          setPage(0);
        }, 3000);
        return;
      }

      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/verify_mobile_otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ otp: mobileOTP })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to verify OTP');
      }

      // If user is rejected or has already completed email verification and later steps, redirect them
      const isRejected =
        (data.userStatus === 'rejected' ||
          (Array.isArray(data.rejectedSteps) && data.rejectedSteps.length > 0)) &&
        data.userStatus !== 'esigned' &&
        data.userStatus !== 'approved';

      const hasLaterSteps =
        data.emailVerified &&
        data.max_step_completed !== undefined &&
        data.max_step_completed !== null &&
        data.max_step_completed > 0;

      if (isRejected || hasLaterSteps) {
        navigate(getInitialRedirectRoute(data));
        return;
      }

      // New user or email not yet verified: Proceed to Email verification (Page 2)
      setPage(2);
      setMobileOTP('');
      setError(''); // Clear any existing errors

    } catch (error) {
      if (error.message === 'Session expired') {
        localStorage.removeItem('token');
      }
      setError(error.message || 'Failed to verify OTP');
    }
  };

  const handleOTPInputChange = (e, index) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) && value.length <= 1) {
      const newOTP = mobileOTP.split('');
      newOTP[index] = value;
      setMobileOTP(newOTP.join(''));

      // Move focus to next input if current input is filled
      if (value && index < 5) {
        document.getElementById(`otp-input-${index + 1}`).focus();
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const pastedDigits = pastedData.replace(/\D/g, '').slice(0, 6);
    
    if (pastedDigits.length > 0) {
        setMobileOTP(pastedDigits.padEnd(6, ''));
        
        // Focus the last filled input or the next empty one
        const focusIndex = Math.min(pastedDigits.length, 5);
        document.getElementById(`otp-input-${focusIndex}`).focus();
    }
  };

  const resendMobileOTP = async () => {
    setMobileOTP('')
    if (!isResendEnabled) return;

    // Get the token from localStorage
    const token = localStorage.getItem('authToken');

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/resend_mobile_otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Add token to headers
        },
        body: JSON.stringify({
          mobileNumber,
          token // Also include token in body if needed by your API
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update token if new one is sent
        if (data.token) {
          localStorage.setItem('authToken', data.token);
        }

        setTimer(30);
        setIsResendEnabled(false);
        setError('');
      } else {
        setError(data.message || 'Failed to resend OTP');
      }
    } catch (error) {
      console.error('Error resending OTP:', error);
      setError('Failed to resend OTP. Please try again.');
    }
  };

  const handleEmailProceed = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || !emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Session expired. Please try again.');
        setPage(0);
        return;
      }

      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/send_email_otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        setError('');
        setPage(3); // Move to email OTP verification page
        // You might want to start a timer here similar to mobile OTP
        setTimer(30);
        setIsResendEnabled(false);
      } else {
        setError(data.message || 'Failed to send email OTP');
        if (response.status === 401) {
          // Handle session expiry
          localStorage.removeItem('authToken');
          setPage(0);
        }
      }
    } catch (error) {
      console.error('Error sending email OTP:', error);
      setError('Failed to send email OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resendEmailOTP = async () => {
    setMobileOTP('')
    if (!isResendEnabled) return;
    
  
    const token = localStorage.getItem('authToken');
  
    try {
      setTimer(30);
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/resend_email_otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          
        })
      });
  
      const data = await response.json();
  
      if (response.ok) {
        setTimer(26);
        setIsResendEnabled(false);
        setError('');
        
        
      } else {
        setError(data.message || 'Failed to resend OTP');
      }
    } catch (error) {
      console.error('Error resending email OTP:', error);
      setError('Failed to resend OTP. Please try again.');
    }
  };

  const validateEmailOTP = async () => {
    try {
        // Check if OTP is 6 digits
        if (!mobileOTP || mobileOTP.length !== 6 || !/^\d+$/.test(mobileOTP)) {
            setError('Please enter a valid 6-digit OTP');
            return;
        }

        const token = localStorage.getItem('authToken');

        if (!token) {
            setError('Session expired. Please try again.');
            setPage(0);
            return;
        }

        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/verify_email_otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
                email,
                otp: mobileOTP 
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to verify OTP');
        }

        // Store the new token if provided
        if (data.token) {
            localStorage.setItem('authToken', data.token);
        }

        // Clear OTP and error
        setMobileOTP('');
        setError('');
        navigate(getInitialRedirectRoute(data));

        // Move to next page or handle success
        // setPage(4); // Uncomment and adjust page number as needed

    } catch (error) {
        if (error.message === 'Session expired') {
            localStorage.removeItem('authToken');
            setPage(0);
        }
        setError(error.message || 'Failed to verify OTP');
    }
};


let panTimeout; // Declare timeout variable

const handleLoginMobileChange = (e) => {
  const value = e.target.value;
  if (/^\d{0,10}$/.test(value)) {
    setLoginMobileNumber(value);
    setLoginError('');
  }
};


const handleLoginMobileBlur = () => {
  if (mobileNumber.length < 10) {
    setError('Enter Mobile Number');
  }
};

const handlePanChange = (e) => {
  let value = e.target.value; // Get the entered value
  setPanNumber(value); // Update state immediately

  clearTimeout(panTimeout); // Clear previous timeout if user types again

  // Set a timeout to capitalize after 300ms
  panTimeout = setTimeout(() => {
    setPanNumber(value.toUpperCase());
  }, 100);
};

  // Function to validate PAN format
  const handlePanBlur = () => {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/; // PAN format: ABCDE1234F

    if (!panRegex.test(panNumber)) {
      setLoginError("Invalid PAN format. Example: ABCDE1234F");
    } else {
      setLoginError(""); // Clear error if valid
    }
  };


  const handleLogin = async () => {
    setLoginError("");
    const targetMobile = loginMobileNumber || mobileNumber;

    if (targetMobile.length !== 10) {
      setLoginError("Enter a valid 10-digit mobile number");
      return;
    }

    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(panNumber)) {
      setLoginError("Invalid PAN format. Example: ABCDE1234F");
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/login_user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mobileNumber: targetMobile,
          PAN: panNumber,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 400) {
          setLoginError("Mobile number and PAN are required.");
        } else if (response.status === 404) {
          setLoginError("User not found. Please check your details.");
        } else if (response.status === 403) {
          setLoginError("User is not registered - PAN not confirmed.");
        } else {
          setLoginError(data.message || "Login failed. Please try again.");
        }
        return;
      }

      if (data.token) {
        localStorage.setItem("authToken", data.token);
        navigate(getInitialRedirectRoute(data));
      } else {
        setLoginError("Unexpected response from server.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setLoginError("Something went wrong. Please try again later.");
    }
  };
  
  // localStorage.setItem('authToken', newToken);
  // localStorage.removeItem('authToken');

  return (
    <>
      <div className={styles.parentContainer}>
        <div className={styles.backgroundBlur}>
          <div ></div>
          <div ></div>
          <div ></div>
        </div>


        <div className={styles.leftContainer}>
          <div><img src={fullLogo} alt='logo' /></div>

          <div>
            <h1>ALL-IN-1 Investment Account</h1>
            <h2>Gateway To Your Financial Goals</h2>
            <p>Advanced Trading Features & Fast Execution. Trade like a Super Trader!</p>
          </div>

          <div className={styles.d_flex}>
            <div><img src={light} alt='lighting-strike' className={styles.lighting_strike} /></div>
            <div>
              <h3 className={styles.LightningText}>Made for</h3>
              <h4 className={styles.TradingNInvesting}> Trading & Investing in <span className={`${styles.StocksText} ${isVisible ? styles.fadeIn : styles.fadeOut}`}>{currentTrade}</span> </h4>
            </div>
          </div>

          <div></div>

        </div>

        <div className={styles.rightContainer}>

          <div className={styles.registerContent}>
            <div className={styles.registerLog}>
              <img src={logo} alt='logo' className={styles.rightLogo} />
            </div>

            {page === 0 && (
              <>
                <h2 className={styles.createAccountText}>Open Account / Login</h2>

                <div className={styles.form__input_group}>
                  <input
                    className={styles.form__input}
                    type="text"
                    placeholder="Enter mobile number"
                    value={mobileNumber}
                    onChange={handleMobileChange}
                    onBlur={handleBlur}
                  />
                  <label className={styles.form__input_label}>Mobile Number </label>
                  <img src={mobileprefix} alt='mobile' className={styles.mobileprefix} />
                </div>
                {error && <p className={styles.errorText}>{error}</p>}

                <div className={styles.checkBoxContainer}>
                  <p>By proceeding you agree to all Terms & Conditions</p>
                </div>

                <button className={styles.Button} onClick={handleMobileProceed} disabled={loading}>
                  {loading ? 'Loading...' : 'Proceed'}
                </button>
              </>
            )}

            {page === 1 && (
              <>
                <h2 className={styles.createAccountText}>Mobile OTP</h2>

                <div className={styles.stepperContainer}>
                  <div className={styles.stepperWrapper}>
                    <div className={`${styles.stepperItem} ${page >= 1 ? styles.active : ''} ${page > 1 ? styles.completed : ''}`}>
                      <div className={styles.stepCounter}>1</div>
                      <div className={styles.stepName}>Phone</div>
                    </div>
                    <div className={`${styles.stepperItem} ${page >= 2 ? styles.active : ''}`}>
                      <div className={styles.stepCounter}>2</div>
                      <div className={styles.stepName}>Email</div>
                    </div>
                  </div>
                </div>

                <div className={styles.OTPTextContainer}>
                  <img src={OTPIcon} alt='OTP_ICON' className={styles.OTPIcon} />
                  <h4> Enter OTP sent to {mobileNumber}</h4>
                  <img onClick={() => { setPage(0); setMobileOTP('') }} src={editIcon} alt='OTP_ICON' className={styles.OTPIcon} />
                </div>

                <div className={styles.form__input_group}>
                  {[...Array(6)].map((_, index) => (
                    <input
                      key={index}
                      id={`otp-input-${index}`}
                      className={styles.otpInput}
                      type="number"
                      value={mobileOTP[index] || ''}
                      onChange={(e) => handleOTPInputChange(e, index)}
                      onKeyDown={(e) => handleOTPKeyDown(e, index)}
                      onPaste={handlePaste}
                      maxLength={1}
                    />
                  ))}
                </div>
                {error && <p className={styles.errorText}>{error}</p>}
                <div className={styles.resendContainer}>
                  {timer > 0 ? (
                    <p className={styles.timerText}>
                      Resend OTP in <span>{timer}s</span>
                    </p>
                  ) : (
                    <p
                      className={`${styles.timerText} ${isResendEnabled ? styles.enabled : styles.disabled}`}
                      onClick={resendMobileOTP}
                    >
                      OTP not received?<span className={styles.resendText}> Send Again</span>
                    </p>
                  )}
                </div>

                <button className={styles.Button} onClick={validateMobileOTP}>Verify OTP</button>
              </>
            )}

            {page === 2 && (
              <>
                <h2 className={styles.createAccountText}>Input Email</h2>

                <div className={styles.stepperContainer}>
                  <div className={styles.stepperWrapper}>
                    <div className={`${styles.stepperItem} ${page >= 1 ? styles.active : ''} ${page > 1 ? styles.completed : ''}`}>
                      <div className={styles.stepCounter}>1</div>
                      <div className={styles.stepName}>Phone</div>
                    </div>
                    <div className={`${styles.stepperItem} ${page >= 2 ? styles.active : ''}`}>
                      <div className={styles.stepCounter}>2</div>
                      <div className={styles.stepName}>Email</div>
                    </div>
                  </div>
                </div>
                <div className={styles.form__input_group}>
                  <input
                    className={styles.form__input}
                    type="email"
                    placeholder="Enter Email"
                    value={email}
                    onChange={handleEmailChange}
                    onBlur={handleEmailBlur}
                  />
                  <label className={styles.form__input_label}>Email </label>
                  <img src={EmailIcon} alt='mobile' className={styles.mobileprefix} />
                </div>
                {error && <p className={styles.errorText}>{error}</p>}

                <button className={styles.Button} onClick={handleEmailProceed} disabled={loading}>
                  {loading ? 'Loading...' : 'Proceed'}
                </button>
              </>
            )}

            {page === 3 && (
              <>
                <h2 className={styles.createAccountText}>Email OTP</h2>

                <div className={styles.stepperContainer}>
                  <div className={styles.stepperWrapper}>
                    <div className={`${styles.stepperItem} ${page >= 1 ? styles.active : ''} ${page > 1 ? styles.completed : ''}`}>
                      <div className={styles.stepCounter}>1</div>
                      <div className={styles.stepName}>Phone</div>
                    </div>
                    <div className={`${styles.stepperItem} ${page >= 2 ? styles.active : ''}`}>
                      <div className={styles.stepCounter}>2</div>
                      <div className={styles.stepName}>Email</div>
                    </div>
                  </div>
                </div>

                <div className={styles.OTPTextContainer}>
                  <img src={OTPIcon} alt='OTP_ICON' className={styles.OTPIcon} />
                  <h4 className={styles.emailOTPText}> Enter OTP sent to {email}</h4>
                  <img onClick={() => { setPage(2); setMobileOTP('') }} src={editIcon} alt='OTP_ICON' className={styles.OTPIcon} />
                </div>

                <div className={styles.form__input_group}>
                  {[...Array(6)].map((_, index) => (
                    <input
                      key={index}
                      id={`otp-input-${index}`}
                      className={styles.otpInput}
                      type="number"
                      value={mobileOTP[index] || ''}
                      onChange={(e) => handleOTPInputChange(e, index)}
                      onKeyDown={(e) => handleOTPKeyDown(e, index)}
                      onPaste={handlePaste}
                      maxLength={1}
                    />
                  ))}
                </div>
                {error && <p className={styles.errorText}>{error}</p>}
                <div className={styles.resendContainer}>
                  {timer > 0 ? (
                    <p className={styles.timerText}>
                      Resend OTP in <span>{timer}s</span>
                    </p>
                  ) : (
                    <p
                      className={`${styles.timerText} ${isResendEnabled ? styles.enabled : styles.disabled}`}
                      onClick={resendEmailOTP}
                    >
                      OTP not received?<span className={styles.resendText}> Send Again</span>
                    </p>
                  )}
                </div>

                <button className={styles.Button} onClick={validateEmailOTP}>Verify OTP</button>
              </>
            )}

            {page === 'existingPan' && (
              <>
                <h2 className={styles.createAccountText}>Enter PAN to Login</h2>

                <div className={styles.OTPTextContainer}>
                  <img src={OTPIcon} alt='OTP_ICON' className={styles.OTPIcon} />
                  <h4>Mobile: {mobileNumber}</h4>
                  <img
                    onClick={() => {
                      setPage(0);
                      setPanNumber('');
                      setLoginError('');
                    }}
                    src={editIcon}
                    alt='edit'
                    className={styles.OTPIcon}
                    style={{ cursor: 'pointer' }}
                  />
                </div>

                <div className={styles.form__input_group}>
                  <input
                    className={styles.form__input}
                    type="text"
                    placeholder="Enter PAN number"
                    value={panNumber}
                    onChange={handlePanChange}
                    onBlur={handlePanBlur}
                    maxLength={10}
                  />
                  <label className={styles.form__input_label}>PAN Number</label>
                </div>

                {loginError && <p className={styles.errorText}>{loginError}</p>}

                <div className={styles.checkBoxContainer}>
                  <p>By proceeding you agree to all Terms & Conditions</p>
                </div>

                <button className={styles.Button} onClick={handleLogin}>
                  Proceed to Login
                </button>
              </>
            )}
          


          </div>



        </div>
      </div>

      {/* <Footer /> */}
    </>
  )
}

export default Homepage