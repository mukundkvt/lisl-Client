import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "./DigiLockerLanding.module.css";
import digilockerSmall from "../../assets/icons/digilockerSmall.svg";
import clock from "../../assets/icons/ClockTimer.svg";
import shield from "../../assets/icons/warn.svg";
import fastAndSecure from "../../assets/icons/Fast&Secure.svg";
import cardFront from "../../assets/images/fake_card_front.jpg";
import cardBack from "../../assets/images/fake_card_back.jpg";
import toast from 'react-hot-toast';
import KRAAddressModal from './KRAAddressModal';
import RejectionBanner from '../RejectionBanner';
import { useKyc } from '../../context/KycContext';

const normalizePrefix = (pref, gen) => {
  if (pref) {
    const pUpper = pref.replace(/\./g, '').trim().toUpperCase();
    if (pUpper === 'MR') return 'Mr';
    if (pUpper === 'MRS') return 'Mrs';
    if (pUpper === 'MS' || pUpper === 'MISS') return 'Miss';
    return pref;
  }
  if (gen) {
    const gLower = gen.toLowerCase();
    if (gLower === 'male') return 'Mr';
    if (gLower === 'female') return 'Mrs';
  }
  return '';
};

const DigiLockerLanding = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { navigateToNextStep, refreshKycStatus } = useKyc();
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [activeTab, setActiveTab] = useState('digilocker');
  const [userDetails, setUserDetails] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const stateError = location.state?.error;
    const searchParams = new URLSearchParams(location.search);
    const queryError = searchParams.get('error');
    const msg = stateError || queryError;
    if (msg) {
      setError(msg);
      toast.error(msg, { duration: 6000 });
      setActiveTab('digilocker');
    }
  }, [location]);
  const [prefix, setPrefix] = useState('');
  const [panName, setPanName] = useState('');
  const [gender, setGender] = useState('');
  const [addressProofType, setAddressProofType] = useState('');
  const [addressProofNumber, setAddressProofNumber] = useState('');
  const [addressProofFront, setAddressProofFront] = useState(null);
  const [addressProofBack, setAddressProofBack] = useState(null);
  const [panProof, setPanProof] = useState(null);
  const [addressProofError, setAddressProofError] = useState('');
  const [frontPreview, setFrontPreview] = useState(null);
  const [backPreview, setBackPreview] = useState(null);
  const [panPreview, setPanPreview] = useState(null);
  const [showKRAModal, setShowKRAModal] = useState(false);
  const [kraAddressData, setKraAddressData] = useState(null);
  const [districts, setDistricts] = useState([]);
  const [aadhaarNote, setAadhaarNote] = useState('');
  const [states] = useState([
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
    'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
    'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
  ]);
  const [address, setAddress] = useState({
    country: 'India',
    line1: '',
    line2: '',
    line3: '',
    city: '',
    state: '',
    district: '',
    pincode: ''
  });

  useEffect(() => {
    const fetchUserDetails = async () => {
      const token = localStorage.getItem("authToken");
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/api/get_user_details`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await response.json();
        if (response.ok) {
          const u = data?.data || null;
          setUserDetails(u);
          setPanName(u?.name?.fullName || '');
          const userGender = (u?.gender || '').toLowerCase();
          setGender(userGender);
          setPrefix(normalizePrefix(u?.prefix, userGender));

          if (u?.address) {
            setAddress(prev => ({
              ...prev,
              country: u?.address?.country || prev.country,
              line1: u?.address?.addressLine1 || '',
              line2: u?.address?.addressLine2 || '',
              line3: u?.address?.addressLine3 || '',
              city: u?.address?.city || '',
              state: u?.address?.state || '',
              district: u?.address?.district || '',
              pincode: u?.address?.pincode || '',
            }));
          }

          if (u?.addressProof) {
            setAddressProofType(u?.addressProof?.type || '');
            setAddressProofNumber(u?.addressProof?.number || '');

            const base = process.env.REACT_APP_API_URL || '';
            const toUrl = (p) => {
              if (!p) return null;
              const pathPart = p.startsWith('/') ? p.slice(1) : p;
              return `${base}/${pathPart}`;
            };

            setFrontPreview(toUrl(u?.addressProof?.frontImage));
            setBackPreview(toUrl(u?.addressProof?.backImage));
          }

          if (u?.PAN_file) {
            const base = process.env.REACT_APP_API_URL || '';
            const pathPart = u.PAN_file.startsWith('/') ? u.PAN_file.slice(1) : u.PAN_file;
            const panUrl = `${base}/${pathPart}`;
            if (!u.PAN_file.toLowerCase().endsWith('.pdf')) {
              setPanPreview(panUrl);
            }
          }
        } else {
          setError(data.message);
        }
      } catch (error) {
        setError("Failed to fetch user details");
      }
    };

    fetchUserDetails();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 0) {
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const verifyKRA = async () => {
      const token = localStorage.getItem("authToken");
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/api/verify_cams_kra`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await response.json();
        if (!response.ok) {
          setError(data.message);
        }
      } catch (error) {
        setError("Failed to verify KRA status");
      }
    };

    verifyKRA();
  }, []);

  useEffect(() => {
    if (addressProofType === 'aadhaar') {
      setAadhaarNote('Please upload masked Aadhaar.');
    } else {
      setAadhaarNote('');
    }
  }, [addressProofType]);

  useEffect(() => {
    const fetchDistricts = async () => {
      if (address.state) {
        const token = localStorage.getItem('authToken');
        try {
          const response = await fetch(
            `${process.env.REACT_APP_API_URL}/api/get_districts/${address.state}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          const data = await response.json();
          if (response.ok) {
            setDistricts(data);
          }
        } catch (error) {
          console.error('Failed to fetch districts');
        }
      }
    };
    fetchDistricts();
  }, [address.state]);

  const handleGetStarted = async () => {
    setError(null);
    setLoading(true);
    const token = localStorage.getItem("authToken");

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/create_digilocker_url`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (response.ok) {
        window.open(data.url, "_self");
      } else {
        const msg = data.message || "Failed to initiate Digilocker session";
        setError(msg);
        toast.error(msg);
      }
    } catch (error) {
      setError("Network error");
      toast.error("Network error");
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 2000);
    }
  };

  const handleKRAVerification = async () => {
    setLoading(true);
    const token = localStorage.getItem("authToken");

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/process_cams_kra`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (response.ok) {
        setKraAddressData(data.data);
        setShowKRAModal(true);
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError("Failed to process KRA verification");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e, side) => {
    if (!addressProofType) {
      toast.error('Please select document type first');
      e.target.value = '';
      return;
    }
    if (!addressProofNumber) {
      toast.error('Please enter document number first');
      e.target.value = '';
      return;
    }
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'image/jpeg' && file.type !== 'image/jpg') {
        toast.error('Only JPG/JPEG images are accepted');
        return;
      }
      if (file.size > 3 * 1024 * 1024) {
        toast.error('File size should not exceed 3MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        if (side === 'front') {
          setAddressProofFront(file);
          setFrontPreview(reader.result);
        } else {
          setAddressProofBack(file);
          setBackPreview(reader.result);
        }
      };
      reader.readAsDataURL(file);
      setAddressProofError('');
    }
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setAddress(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePrefixChange = (e) => {
    const val = e.target.value;
    setPrefix(val);
    if (val === 'Mr') {
      setGender('male');
    } else if (val === 'Mrs' || val === 'Miss' || val === 'Ms') {
      setGender('female');
    }
  };

  const handleGenderChange = (e) => {
    const val = e.target.value;
    setGender(val);
    if (val === 'male') {
      setPrefix('Mr');
    } else if (val === 'female' && prefix === 'Mr') {
      setPrefix('Mrs');
    }
  };

  const handlePanUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPG/JPEG/PNG/PDF files are accepted');
      e.target.value = '';
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      toast.error('File size should not exceed 3MB');
      e.target.value = '';
      return;
    }

    setPanProof(file);

    if (file.type === 'application/pdf') {
      setPanPreview(null);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPanPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleManualSubmit = async () => {
    if (!prefix) {
      toast.error('Please select prefix');
      return;
    }
    if (!gender) {
      toast.error('Please select gender');
      return;
    }
    if (!address.line1) {
      toast.error('Please enter address line 1');
      return;
    }
    if (!address.state || address.state === '') {
      toast.error('Please select state');
      return;
    }
    if (!address.city || address.city === '') {
      toast.error('Please select city');
      return;
    }
    if (!address.pincode) {
      toast.error('Please enter pincode');
      return;
    }
    if(address.pincode.length !== 6) {
      toast.error('Pincode should be 6 digits');
      return;
    }
    if (!addressProofType) {
      toast.error('Please select document type');
      return;
    }
    if (!addressProofNumber) {
      toast.error('Please enter document number');
      return;
    }
    if (!addressProofFront && !userDetails?.addressProof?.frontImage) {
      toast.error('Please upload front side of document');
      return;
    }
    if (addressProofType !== 'driving_license' && !addressProofBack && !userDetails?.addressProof?.backImage) {
      toast.error('Please upload back side of document');
      return;
    }
    if (!panProof && !userDetails?.PAN_file) {
      toast.error('Please upload PAN card');
      return;
    }
    
    const formData = new FormData();
    formData.append('prefix', prefix);
    formData.append('panName', panName);
    formData.append('gender', gender);
    formData.append('addressProofType', addressProofType);
    formData.append('addressProofNumber', addressProofNumber);
    if (addressProofFront) {
      formData.append('addressProofFront', addressProofFront);
    }
    if (addressProofType !== 'driving_license') {
      if (addressProofBack) {
        formData.append('addressProofBack', addressProofBack);
      }
    }
    if (panProof) {
      formData.append('panProof', panProof);
    }
    Object.keys(address).forEach(key => {
      if(key !== 'district') formData.append(key, address[key]);
    });

    setLoading(true);
    const token = localStorage.getItem('authToken');

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/submit_manual_kyc`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData
      });

      const data = await response.json();
      if (response.ok) {
        refreshKycStatus();
        navigateToNextStep('/address');
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Failed to submit KYC details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className={styles.MainContainer}>
        <div className={styles.MainWrapper}>
          <RejectionBanner section="address" />
          <div className={styles.topPANDiv}>
            <img src={digilockerSmall} alt="Digilocker Icon" className={styles.topPanIcon} />
            <div className={styles.topPanText}>Complete Your KYC</div>

            <div className={styles.topClockDiv}>
              <img src={clock} alt="Clock Icon" className={styles.clockIcon} />
              <div className={styles.clockText}>
                this takes less than {countdown} seconds.{" "}
              </div>
            </div>
          </div>

          <div className={styles.tabsContainer}>
            <div 
              className={`${styles.tab} ${activeTab === 'digilocker' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('digilocker')}
            >
              DigiLocker
            </div>
            {userDetails?.digilocker_api_call_count && userDetails?.camskra_available ? (
              <div 
                className={`${styles.tab} ${activeTab === 'kra' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('kra')}
              >
                Got your KYC!
              </div>
            ) : null}
            {userDetails?.digilocker_api_call_count ? (
              <div 
                className={`${styles.tab} ${activeTab === 'manual' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('manual')}
              >
                Manual
              </div>
            ) : null}
          </div>

          {activeTab === 'digilocker' && (
            <div className={styles.tabContent}>
              <div className={styles.panDemoDiv}>
                <div className={styles.EnterYourPan}>Complete your KYC via Digilocker</div>
                <div>
                  <img src={fastAndSecure} alt="Fast and Secure" className={styles.panImage} />
                </div>
              </div>

              <div className={styles.ListDiv}>
                <ul>
                  <li className={styles.ListItem}>Instantly pull documents through Digilocker (Aadhaar, PAN etc)</li>
                  <li className={styles.ListItem}>Skip manual video verification</li>
                  <li className={styles.ListItem}>Your Aadhaar number/copy will not be stored</li>
                </ul>
              </div>

              <div className={styles.consentDiv}>I provide my consent to share my Aadhaar Number, Date of Birth and Name from my Aadhaar eKYC information with the Income Tax Department for the purpose of fetching my PAN into DigiLocker.</div>

              <div className={styles.shieldDiv}>
                <img src={shield} alt="shield Icon" className={styles.shieldIcon} />
                <div className={styles.shieldText}>
                  Your account details are safe & secure with us.
                </div>
              </div>

              <div className={styles.Line}></div>

              {error && (
                <div className={styles.errorBanner}>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ flexShrink: 0, marginRight: "8px" }}
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <button className={styles.verifyButton} onClick={handleGetStarted} disabled={loading}>
                {loading ? 'Taking you to Digilocker...' : 'Proceed via Digilocker (Fast KYC)'}
              </button>
            </div>
          )}

          {activeTab === 'kra' && (
            <div className={styles.tabContent}>
              <div className={styles.panDemoDiv}>
                <div className={styles.EnterYourPan}>We have your profile available in KRA (CAMS)</div>
              </div>

              <div className={styles.ListDiv}>
                <ul>
                  <li className={styles.ListItem}>Verify through KRA (KYC Registration Agency)</li>
                  <li className={styles.ListItem}>Use existing KYC if already completed with any KRA</li>
                  <li className={styles.ListItem}>Secure and compliant with regulatory requirements</li>
                </ul>
              </div>

              <div className={styles.shieldDiv}>
                <img src={shield} alt="shield Icon" className={styles.shieldIcon} />
                <div className={styles.shieldText}>
                  Your account details are safe & secure with us.
                </div>
              </div>

              <div className={styles.Line}></div>

              <button className={styles.verifyButton} onClick={handleKRAVerification} disabled={loading}>
                {loading ? 'Processing...' : 'Proceed via KRA'}
              </button>
            </div>
          )}

          {activeTab === 'manual' && (
            <div className={styles.tabContent}>
              <div className={styles.panDemoDiv}>
                <div className={styles.EnterYourPan}>Complete your KYC Manually</div>
              </div>

              <div className={styles.addressFormContainer}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Prefix*</label>
                    <select 
                      value={prefix}
                      onChange={handlePrefixChange}
                      className={styles.formInput}
                      required
                    >
                      <option value="">Select Prefix</option>
                      <option value="Mr">Mr</option>
                      <option value="Mrs">Mrs</option>
                      <option value="Miss">Miss</option>
                      <option value="Ms">Ms</option>
                    </select>
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Name (as per PAN)</label>
                    <input 
                      type="text"
                      value={userDetails?.name?.fullName}
                      className={styles.formInput}
                      disabled
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Gender*</label>
                    <select 
                      value={gender}
                      onChange={handleGenderChange}
                      className={styles.formInput}
                      required
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Address Line 1*</label>
                  <input 
                    type="text"
                    name="line1"
                    value={address.line1}
                    onChange={handleAddressChange}
                    className={styles.formInput}
                    placeholder="House/Flat No., Building Name, Street"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Address Line 2</label>
                  <input 
                    type="text"
                    name="line2"
                    value={address.line2}
                    onChange={handleAddressChange}
                    className={styles.formInput}
                    placeholder="Area, Landmark"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Address Line 3</label>
                  <input 
                    type="text"
                    name="line3"
                    value={address.line3}
                    onChange={handleAddressChange}
                    className={styles.formInput}
                    placeholder="Optional"
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Country*</label>
                    <input 
                      type="text"
                      name="country"
                      value={address.country}
                      className={styles.formInput}
                      disabled
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>State*</label>
                    <select 
                      name="state"
                      value={address.state}
                      onChange={handleAddressChange}
                      className={styles.formInput}
                    >
                      <option value="">Select State</option>
                      {states.map((state) => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>City*</label>
                    <select 
                      name="city"
                      value={address.city}
                      onChange={handleAddressChange}
                      className={styles.formInput}
                      disabled={!address.state}
                    >
                      <option value="">Select City</option>
                      {districts.map((district) => (
                        <option key={district} value={district}>{district}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Pincode*</label>
                    <input 
                      type="text"
                      name="pincode"
                      value={address.pincode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                        handleAddressChange({
                          target: {
                            name: 'pincode',
                            value
                          }
                        });
                      }}
                      className={styles.formInput}
                      placeholder="Pincode"
                      maxLength="6"
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Address Proof Type*</label>
                    <select 
                      value={addressProofType}
                      onChange={(e) => setAddressProofType(e.target.value)}
                      className={styles.formInput}
                    >
                      <option value="">Select Document Type</option>
                      <option value="aadhaar">Aadhaar</option>
                      <option value="passport">Passport</option>
                      <option value="driving_license">Driving License</option>
                      <option value="voter_id">Voter ID</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Address Proof Number*</label>
                    <input 
                      type="text"
                      value={addressProofNumber}
                      onChange={(e) => setAddressProofNumber(e.target.value)}
                      className={styles.formInput}
                      placeholder="Enter document number"
                    />
                  </div>
                </div>

                {addressProofType === 'aadhaar' && (
                  <div className={styles.aadhaarNote}>{aadhaarNote}</div>
                )}

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Upload Address Proof*</label>
                  <div className={styles.documentUploadContainer}>
                    <div className={styles.uploadSection}>
                      <div className={styles.previewContainer}>
                        <img 
                          src={frontPreview || cardFront} 
                          alt="Front side" 
                          className={styles.previewImage}
                        />
                        <input
                          type="file"
                          accept=".jpg,.jpeg"
                          onChange={(e) => handleFileUpload(e, 'front')}
                          className={styles.fileInput}
                          style={{ display: 'none' }}
                          id="frontUpload"
                        />
                        <button 
                          className={styles.uploadButton} 
                          onClick={() => document.getElementById('frontUpload').click()}
                        >
                          {frontPreview ? 'Change Front Side' : 'Upload Front Side'}
                        </button>
                      </div>

                      {addressProofType !== 'driving_license' && (
                        <div className={styles.previewContainer}>
                          <img 
                            src={backPreview || cardBack} 
                            alt="Back side" 
                            className={styles.previewImage}
                          />
                          <input
                            type="file"
                            accept=".jpg,.jpeg"
                            onChange={(e) => handleFileUpload(e, 'back')}
                            className={styles.fileInput}
                            style={{ display: 'none' }}
                            id="backUpload"
                          />
                          <button 
                            className={styles.uploadButton} 
                            onClick={() => document.getElementById('backUpload').click()}
                          >
                            {backPreview ? 'Change Back Side' : 'Upload Back Side'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Upload PAN Card*</label>
                  <div className={styles.documentUploadContainer}>
                    <div className={styles.uploadSection}>
                      <div className={styles.previewContainer}>
                        <img
                          src={panPreview || cardFront}
                          alt="PAN preview"
                          className={styles.previewImage}
                        />
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.pdf"
                          onChange={handlePanUpload}
                          className={styles.fileInput}
                          style={{ display: 'none' }}
                          id="panUpload"
                        />
                        <button
                          className={styles.uploadButton}
                          onClick={() => document.getElementById('panUpload').click()}
                        >
                          {panProof ? 'Change PAN File' : 'Upload PAN File'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  className={styles.verifyButton} 
                  onClick={handleManualSubmit} 
                  disabled={loading || !prefix || !gender}
                >
                  {loading ? 'Processing...' : 'Submit KYC Details'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {showKRAModal && kraAddressData && (
        <KRAAddressModal
          addressData={kraAddressData}
          onClose={() => setShowKRAModal(false)}
        />
      )}
    </>
  );
};



export default DigiLockerLanding
;
