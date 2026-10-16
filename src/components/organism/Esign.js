import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import styles from './Esign.module.css';
import SignatureIcon from '../../assets/icons/KYCiconsSign.svg';
import EditStepModal from './EditStepModal';
import DdpiModal from './DdpiModal';
import RejectionBanner from '../RejectionBanner';

const formatAssignmentError = (message) => {
  if (!message) return 'An error occurred. Please try again.';
  const msgStr = String(message).trim();
  const lower = msgStr.toLowerCase();

  if (lower.includes('dp id') && (lower.includes('assign') || lower.includes('not able'))) {
    return 'Not able to assign DP ID, Please contact Admin';
  }
  if ((lower.includes('client code') || lower.includes('ucc')) && (lower.includes('assign') || lower.includes('not able'))) {
    return 'Not able to assign Client Code, Please contact Admin';
  }
  return msgStr;
};

const Esign = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [annexureJEnabled, setAnnexureJEnabled] = useState(true); // default ON

  // DDPI states
  const [showDdpiModal, setShowDdpiModal] = useState(false);
  const [ddpiConsent, setDdpiConsent] = useState({
    transfer_of_security: false,
    pledging: false,
    mutual_fund_transaction: false,
    tendering_shares: false,
  });
  const [hasDdpiConsent, setHasDdpiConsent] = useState(false);

  const [part1Status, setPart1Status] = useState({
    signed: false,
    generated: false,
    filePath: null,
    loading: true
  });
  
  const [part2Status, setPart2Status] = useState({
    signed: false,
    generated: false,
    filePath: null,
    loading: true
  });

  const token = localStorage.getItem('authToken');

  // Fetch the Annexure J system setting (public, no auth)
  const fetchAnnexureJSetting = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/setting/annexure-j-status`);
      const data = await response.json();
      if (data.success) {
        setAnnexureJEnabled(data.annexureJEnabled);
        return data.annexureJEnabled;
      }
    } catch (err) {
      console.error('Error fetching annexureJ setting:', err);
    }
    return true; // fail-open: default ON
  };

  // Fetch user details for DDPI consent
  const fetchUserDetails = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/get_user_details`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success && data.data.ddpiConcent) {
          setDdpiConsent(data.data.ddpiConcent);
          const hasAny = Object.values(data.data.ddpiConcent).some(v => v === true);
          setHasDdpiConsent(hasAny);
      }
    } catch (err) {
      console.error('Error fetching user details:', err);
    }
  };

  // Helper to fetch status for Part 1
  const fetchPart1Status = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/fill_form`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (data.success) {
        setPart1Status({
          signed: data.isSigned || false,
          generated: true,
          filePath: data.filePath,
          loading: false
        });
        return data.isSigned;
      } else {
        const errorMsg = formatAssignmentError(data.message);
        console.error('Part 1 fetch failed:', data.message);
        setError(errorMsg);
        toast.error(errorMsg, { duration: 6000 });
        setPart1Status(prev => ({ ...prev, loading: false }));
        return false;
      }
    } catch (err) {
      console.error('Part 1 fetch error:', err);
      const msg = 'Failed to generate KYC document. Please try again.';
      setError(msg);
      toast.error(msg, { duration: 5000 });
      setPart1Status(prev => ({ ...prev, loading: false }));
      return false;
    }
  };

  // Helper to fetch status for Part 2 (only if annexureJ is enabled AND part1 is signed)
  const fetchPart2Status = async (part1Signed, annexureJOn) => {
    if (!annexureJOn || !part1Signed) {
        setPart2Status(prev => ({ ...prev, loading: false }));
        return;
    }
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/fill_annexure_j`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (data.success) {
        setPart2Status({
          signed: data.isSigned || false,
          generated: true,
          filePath: data.filePath,
          loading: false
        });
      } else {
        const errorMsg = formatAssignmentError(data.message);
        console.error('Part 2 fetch failed:', data.message);
        setError(errorMsg);
        toast.error(errorMsg, { duration: 6000 });
        setPart2Status(prev => ({ ...prev, loading: false }));
      }
    } catch (err) {
      console.error('Part 2 fetch error:', err);
      setPart2Status(prev => ({ ...prev, loading: false }));
    }
  };

  const fetchStatuses = async () => {
    setIsLoading(true);
    setError(null);
    const annexureJOn = await fetchAnnexureJSetting();
    const p1Signed = await fetchPart1Status();
    await fetchPart2Status(p1Signed, annexureJOn);
    await fetchUserDetails();
    setIsLoading(false);
  };

  // Navigate to thank-you when signing is complete
  useEffect(() => {
    if (!isLoading) {
      if (annexureJEnabled) {
        // 2-step: need both signed
        if (part1Status.signed && part2Status.signed) {
          navigate('/thank-you');
        }
      } else {
        // 1-step: only part 1 needed
        if (part1Status.signed) {
          navigate('/thank-you');
        }
      }
    }
  }, [isLoading, annexureJEnabled, part1Status.signed, part2Status.signed, navigate]);

  const verifyContract = async (part) => {
    setIsLoading(true);
    setError(null);
    const endpoint = part === '1' ? '/api/pull_contract' : '/api/pull_annexure_j';
    
    try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        });
        const data = await response.json();
        
        if (data.success) {
            await fetchStatuses();
            navigate('/esign', { replace: true });
        } else {
            const errorMsg = formatAssignmentError(data.message || 'Verification failed');
            setError(errorMsg);
            toast.error(errorMsg, { duration: 6000 });
            setIsLoading(false);
        }
    } catch (err) {
        const errorMsg = 'Verification failed. Please try again.';
        setError(errorMsg);
        toast.error(errorMsg, { duration: 5000 });
        setIsLoading(false);
    }
  };

  useEffect(() => {
    const part = searchParams.get('part');
    const status = searchParams.get('status');
    
    if (part && status === 'success') {
        verifyContract(part);
    } else if (part && status === 'failed') {
        const errorMsg = 'Signing failed or was cancelled.';
        setError(errorMsg);
        toast.error(errorMsg, { duration: 5000 });
        fetchStatuses();
        navigate('/esign', { replace: true });
    } else {
        fetchStatuses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  const handleSignClick = async (part) => {
    if (part === 1 && !part1Status.generated && !part1Status.signed && error) {
      toast.error(error, { duration: 6000 });
      return;
    }
    setIsLoading(true);
    setError(null);
    const endpoint = part === 1 ? '/api/create_contract_url' : '/api/create_annexure_j_url';
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.signingUrl) {
        window.location.href = data.signingUrl;
      } else {
        const errorMsg = formatAssignmentError(data.message || 'Failed to get signing URL');
        setError(errorMsg);
        toast.error(errorMsg, { duration: 6000 });
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Error creating contract URL:', err);
      const msg = 'Failed to create contract URL. Please try again.';
      setError(msg);
      toast.error(msg, { duration: 5000 });
      setIsLoading(false);
    }
  };

  const handleDownload = (filePath) => {
      if (!filePath) return;
      const normalizedPath = filePath.replace(/\\/g, '/');
      const cleanPath = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
      const baseUrl = (process.env.REACT_APP_API_URL || '').replace(/\/+$/, '');
      const url = `${baseUrl}${cleanPath}`;
      window.open(url, '_blank');
  };

  const saveDdpiConsent = async (newOptions) => {
    try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/save_ddpi_consent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(newOptions)
        });
        const data = await response.json();
        if (data.success) {
            setDdpiConsent(newOptions);
            const hasAny = Object.values(newOptions).some(v => v === true);
            setHasDdpiConsent(hasAny);
            setShowDdpiModal(false);
        } else {
            alert('Failed to save DDPI consent');
        }
    } catch (error) {
        console.error('Error saving DDPI consent:', error);
        alert('Error saving DDPI consent');
    }
  };

  const isEditDisabled = part1Status.signed || part2Status.signed;
  const isDdpiDisabled = part1Status.signed || part2Status.signed;

  return (
    <div className={styles.MainContainer}>
      <div className={styles.MainWrapper}>
        <RejectionBanner section="digitalSign" />
        {error && (
          <div className={styles.errorToast}>
            {error}
          </div>
        )}
        
        <div className={styles.TopSection}>
          <div className={styles.TopLeft}>
            <img src={SignatureIcon} alt="Signature Icon" className={styles.TopIcon} />
            <h1 className={styles.TopText}>eSign Your Documents</h1>
          </div>
          {!isEditDisabled && (
            <button 
                className={styles.EditButton} 
                onClick={() => setShowEditModal(true)}
            >
                Edit Details
            </button>
          )}
        </div>

        <p className={styles.SubText}>
          Securely sign your documents electronically with ease and confidence.
        </p>
        
        {/* Step Progress Bar — only shown in 2-step mode */}
        {annexureJEnabled && (
          <div className={styles.ProgressBar}>
              <div className={styles.StepIndicator}>
                  <div className={`${styles.StepCircle} ${part1Status.signed ? styles.completed : styles.active}`}>1</div>
                  <div className={`${styles.StepLabel} ${part1Status.signed ? styles.completed : styles.active}`}>Step 1</div>
              </div>
              <div className={styles.StepIndicator}>
                  <div className={`${styles.StepCircle} ${part2Status.signed ? styles.completed : (part1Status.signed ? styles.active : '')}`}>2</div>
                  <div className={`${styles.StepLabel} ${part2Status.signed ? styles.completed : (part1Status.signed ? styles.active : '')}`}>Step 2</div>
              </div>
          </div>
        )}

        {/* SEBI note — only shown in 2-step mode */}
        {annexureJEnabled && (
          <div className={styles.SebiText}>
              <strong>Note:</strong> According to new SEBI Regulations effective Nov 1 2022, you need to eSign your KYC in 2 parts, Part 1 and Part 2.
          </div>
        )}

        <div className={styles.DdpiContainer}>
            <label
                className={`${styles.DdpiCheckboxLabel} ${isDdpiDisabled ? styles.DdpiCheckboxLabelDisabled : ''}`}
                onClick={() => {
                    if (!isDdpiDisabled) setShowDdpiModal(true);
                }}
            >
                <input 
                    type="checkbox" 
                    checked={hasDdpiConsent} 
                    readOnly 
                    disabled={isDdpiDisabled}
                    className={styles.DdpiCheckbox}
                />
                <span>
                    I wish to authorise Lakshmishree Group for Demat Account open with DDPI
                </span>
            </label>
        </div>

        <div className={styles.LayoutContainer}>
            {/* Part 1 */}
            <div className={`${styles.StepCard} ${part1Status.signed ? styles.completed : styles.active}`}>
                <div className={styles.StepHeader}>
                    <h2 className={styles.StepTitle}>
                      {annexureJEnabled ? 'Part 1: KYC Document' : 'KYC Document'}
                    </h2>
                    <span className={`${styles.StepStatus} ${part1Status.signed ? styles.completed : styles.pending}`}>
                        {part1Status.signed ? 'Completed' : 'Pending'}
                    </span>
                </div>
                <p className={styles.CardDescription}>
                    {part1Status.signed 
                        ? 'Part 1 document has been successfully signed.' 
                        : 'Please review and sign the KYC document to proceed.'}
                </p>
                <div className={styles.StepActions}>
                    {!part1Status.signed ? (
                        <>
                            <button 
                                className={styles.SignButton}
                                onClick={() => handleSignClick(1)}
                            >
                                {annexureJEnabled ? 'Sign Part 1' : 'Sign Document'}
                            </button>
                            {part1Status.generated && (
                                <button 
                                    className={styles.DownloadButton}
                                    onClick={() => handleDownload(part1Status.filePath)}
                                >
                                    Download Draft
                                </button>
                            )}
                        </>
                    ) : (
                        <button 
                            className={styles.DownloadButton}
                            onClick={() => handleDownload(part1Status.filePath)}
                        >
                            Download Signed PDF
                        </button>
                    )}
                </div>
            </div>

            {/* Part 2 — only rendered when Annexure J is enabled */}
            {annexureJEnabled && (
              <div className={`${styles.StepCard} ${part2Status.signed ? styles.completed : ''}`}>
                  <div className={styles.StepHeader}>
                      <h2 className={styles.StepTitle}>Part 2: Annexure J</h2>
                      <span className={`${styles.StepStatus} ${part2Status.signed ? styles.completed : styles.pending}`}>
                          {part2Status.signed ? 'Completed' : 'Pending'}
                      </span>
                  </div>
                  <p className={styles.CardDescription}>
                      {part2Status.signed 
                          ? 'Annexure J has been successfully signed.' 
                          : 'Please sign the Annexure J document. (Available after Part 1)'}
                  </p>
                  <div className={styles.StepActions}>
                      {!part2Status.signed ? (
                          <>
                              <button 
                                  className={`${styles.SignButton} ${!part1Status.signed ? styles.DisabledButton : ''}`}
                                  onClick={() => handleSignClick(2)}
                                  disabled={!part1Status.signed}
                              >
                                  Sign Part 2
                              </button>
                              {part2Status.generated && (
                                  <button 
                                      className={styles.DownloadButton}
                                      onClick={() => handleDownload(part2Status.filePath)}
                                  >
                                      Download Draft
                                  </button>
                              )}
                          </>
                      ) : (
                          <button 
                              className={styles.DownloadButton}
                              onClick={() => handleDownload(part2Status.filePath)}
                          >
                              Download Signed PDF
                          </button>
                      )}
                  </div>
              </div>
            )}
        </div>

      </div>
      
      {isLoading && (
        <div className={styles.LoaderModal}>
          <div className={styles.LoaderContent}>
            <div className={styles.LoaderSpinner}></div>
            <p className={styles.LoaderText}>Please wait...</p>
          </div>
        </div>
      )}
      
      {showEditModal && (
        <EditStepModal 
            isOpen={showEditModal} 
            onClose={() => setShowEditModal(false)}
            onUpdate={() => {
                setShowEditModal(false);
                fetchStatuses();
            }}
        />
      )}

      <DdpiModal 
        isOpen={showDdpiModal}
        onClose={() => setShowDdpiModal(false)}
        onSave={saveDdpiConsent}
        initialData={ddpiConsent}
      />
    </div>
  );
};

export default Esign;
