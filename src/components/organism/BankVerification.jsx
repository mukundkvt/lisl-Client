import React, { useState, useEffect, useRef } from "react";
import styles from "./BankVerification.module.css";
import KYCiconBank from "../../assets/icons/KYCiconBank.svg";
import clock from "../../assets/icons/ClockTimer.svg";
import shield from "../../assets/icons/warn.svg";
import UPIimg from "../../assets/icons/UPIimg.svg";
import bankifsc from "../../assets/icons/bankifsc.svg";
import UPI_Layer from "../../assets/icons/UPI_Layer.svg";
import phonepeIcon from "../../assets/icons/phonePeIcon.svg";
import gPayIcon from "../../assets/icons/gPayIcon.svg";
import paytmIcon from "../../assets/icons/paytmIcon.svg";
import paytmUPIIcon from "../../assets/icons/paytm_upi.png";
import bhimIcon from "../../assets/icons/bhimIcon.svg";
import whatsappPay from "../../assets/icons/whatsappPay.svg";
import { useNavigate } from "react-router-dom";
import { Upload, X, FileText } from "lucide-react";
import toast from "react-hot-toast";
import RejectionBanner from "../RejectionBanner";
import { useKyc } from "../../context/KycContext";

const BankVerification = () => {
  const navigate = useNavigate();
  const { navigateToNextStep, refreshKycStatus } = useKyc();
  const [countdown, setCountdown] = useState(30);
  const [isCheckedUPI, setIsCheckedUPI] = useState(false);
  const [isCheckedBank, setIsCheckedBank] = useState(true);
  const [ifscError, setIfscError] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showUPIPopup, setShowUPIPopup] = useState(false);
  const [apiError, setApiError] = useState("");
  const [accountNumberError, setAccountNumberError] = useState("");
  const [accountNumberInfo, setAccountNumberInfo] = useState();
  const [upiCreatedLink, setUpiCreatedLink] = useState(null);
  const [statusCheckCount, setStatusCheckCount] = useState(0);
  const [verificationData, setVerificationData] = useState(null);
  const [showVerificationSuccessPopup, setShowVerificationSuccessPopup] =
    useState(false);
  const [showTimerPopup, setShowTimerPopup] = useState(false);
  const [timerCountdown, setTimerCountdown] = useState(300); // 5 minutes in seconds
  const [selectedUpiApp, setSelectedUpiApp] = useState(null);
  const [isLoadingBank, setIsLoadingBank] = useState(false);
  const [isLoadingUPI, setIsLoadingUPI] = useState(false);
  const [isLoadingConfirm, setIsLoadingConfirm] = useState(false);
  const [showDocUploadPopup, setShowDocUploadPopup] = useState(false);
  const [bankProofFile, setBankProofFile] = useState(null);
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [savedBankDetails, setSavedBankDetails] = useState(null);
  const upiIntervalRef = useRef(null);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) return;
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/api/get_user_details`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          const bank = data?.data?.bank_account_details;
          if (bank) {
            setSavedBankDetails(bank);
            if (bank.account_number) {
              setAccountNumber(bank.account_number);
            }
            if (bank.ifsc_code) {
              setIfscCode(bank.ifsc_code);
            }
            if (bank.account_holder_name) {
              setAccountNumberInfo(bank);
            }
          }
        }
      } catch (err) {
        console.error("Error fetching user bank details:", err);
      }
    };

    fetchUserDetails();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 0) {
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (showUPIPopup) {
      const intervalId = setInterval(async () => {
        upiIntervalRef.current = intervalId;
        if (statusCheckCount < 150) {
          try {
            const token = localStorage.getItem("authToken");
            const response = await fetch(
              `${process.env.REACT_APP_API_URL}/api/verify_reverse_penny_drop`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  verificationId: upiCreatedLink.result.verificationId,
                }),
              },
            );

            if (response.ok) {
              const data = await response.json();
              setVerificationData(data.data);

              const status = data.data.status;
              if (
                status === "SUCCESS" ||
                status === "FAILURE" ||
                status === "EXPIRED"
              ) {
                clearInterval(intervalId);
                setShowUPIPopup(false);
                setShowTimerPopup(false);
                if (status === "SUCCESS") {
                  if (data.data.isNameMatch) {
                    setSavedBankDetails((prev) => ({
                      ...prev,
                      bank_proof_file: null,
                      bank_proof_date: null,
                    }));
                    setShowVerificationSuccessPopup(true);
                  } else {
                    setShowDocUploadPopup(true);
                  }
                }
              }
            }
          } catch (error) {
            console.error("Error checking status:", error);
          }
          setStatusCheckCount((prev) => prev + 1);
        } else {
          clearInterval(intervalId);
          setShowTimerPopup(false);
        }
      }, 3000);

      return () => clearInterval(intervalId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showUPIPopup]);

  useEffect(() => {
    let timer;
    if (showTimerPopup && timerCountdown > 0) {
      timer = setInterval(() => {
        setTimerCountdown((prev) => prev - 1);
      }, 1000);
    } else if (timerCountdown === 0) {
      setShowTimerPopup(false);
      setTimerCountdown(300);
    }
    return () => clearInterval(timer);
  }, [showTimerPopup, timerCountdown]);

  const handleUpiAppClick = (appName, url) => {
    setSelectedUpiApp(appName);
    setShowTimerPopup(true);
    window.location.href = url;
  };

  const handleUPICheck = () => {
    setIsCheckedUPI(true);
    setIsCheckedBank(false);
  };

  const handleBankCheck = () => {
    setIsCheckedUPI(false);
    setIsCheckedBank(true);
  };

  const validateIFSC = (value) => {
    const ifscPattern = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifscPattern.test(value)) {
      setIfscError("Invalid IFSC code.");
    } else {
      setIfscError("");
    }
  };

  const validateAccountNumber = (value) => {
    if (value.trim() === "") {
      setAccountNumberError("Account Number cannot be empty.");
    } else {
      setAccountNumberError("");
    }
  };

  const handleBankVerification = async () => {
    // Check if bank details already exist and neither account number nor IFSC has changed
    const hasSavedBank = !!(
      savedBankDetails?.account_number &&
      savedBankDetails?.ifsc_code
    );
    const isUnchanged =
      hasSavedBank &&
      accountNumber.trim() === (savedBankDetails.account_number || "").trim() &&
      ifscCode.trim().toUpperCase() === (savedBankDetails.ifsc_code || "").trim().toUpperCase();

    if (isUnchanged) {
      // Data is unchanged, do not call verification API!
      navigateToNextStep("/bank-verification");
      return;
    }

    setIsLoadingBank(true);
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/hybrid_bank_account_verification`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            beneficiaryAccount: accountNumber.trim(),
            beneficiaryIFSC: ifscCode.trim().toUpperCase(),
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Verification failed");
      }

      const data = await response.json();
      setAccountNumberInfo(data.data);
      setVerificationData(data.data);

      if (data.data.isNameMatch) {
        setSavedBankDetails((prev) => ({
          ...prev,
          bank_proof_file: null,
          bank_proof_date: null,
          account_number: accountNumber.trim(),
          ifsc_code: ifscCode.trim().toUpperCase(),
          account_holder_name: data.data.account_holder_name,
        }));
        setShowSuccessPopup(true);
      } else {
        setShowDocUploadPopup(true);
      }
      setApiError("");
    } catch (error) {
      setApiError("Verification failed. Please try again.");
      console.error("Error:", error);
    } finally {
      setIsLoadingBank(false);
    }
  };

  const handleUPICreateLink = async () => {
    setIsLoadingUPI(true);
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/reverse_penny_drop_create_link`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("UPI verification link creation failed");
      }

      const data = await response.json();
      setUpiCreatedLink(data.data);
      setShowUPIPopup(true);
    } catch (error) {
      setApiError("UPI verification failed. Please try again.");
      console.error("Error:", error);
    } finally {
      setIsLoadingUPI(false);
    }
  };

  const handleBankConfirmation = async () => {
    setIsLoadingConfirm(true);
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/confirm_bank`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Bank confirmation failed");
      }

      setShowVerificationSuccessPopup(false);
      setShowSuccessPopup(false);
      refreshKycStatus();
      navigateToNextStep("/bank-verification");
    } catch (error) {
      console.error("Error confirming bank:", error);
      setApiError("Bank confirmation failed. Please try again.");
    } finally {
      setIsLoadingConfirm(false);
    }
  };

  const handleCloseUPIPopup = () => {
    if (upiIntervalRef.current) {
      clearInterval(upiIntervalRef.current);
      upiIntervalRef.current = null;
    }

    setShowUPIPopup(false);
    setShowTimerPopup(false);
  };

  const handleBankProofUpload = async () => {
    if (!bankProofFile) return;

    setIsUploadingProof(true);
    const formData = new FormData();
    formData.append("bankProof", bankProofFile);

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/upload_bank_proof`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to upload bank proof");
      }

      toast.success("Bank proof uploaded successfully");
      setShowDocUploadPopup(false);
      refreshKycStatus();
      navigateToNextStep("/bank-verification");

    } catch (error) {
      console.error("Error uploading bank proof:", error);
      setApiError("Failed to upload bank proof. Please try again.");
      toast.error("Failed to upload bank proof");
    } finally {
      setIsUploadingProof(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size should be less than 5MB");
        return;
      }
      setBankProofFile(file);
    }
  };

  return (
    <>
      <div className={styles.MainContainer}>
        <div className={styles.MainWrapper}>
          <RejectionBanner section="bank" />
          <div className={styles.topPANDiv}>
            <img
              src={KYCiconBank}
              alt="PAN Icon"
              className={styles.topPanIcon}
            />
            <div className={styles.topPanText}>Add Your Bank Account</div>

            <div className={styles.topClockDiv}>
              <img src={clock} alt="Clock Icon" className={styles.clockIcon} />
              <div className={styles.clockText}>
                this takes less than {countdown} seconds.
              </div>
            </div>
          </div>

          <div className={styles.panDemoDiv}>
            <div className={styles.EnterYourPan}>
              Select the way to connect your Bank Account
            </div>
          </div>



          <div
            className={styles.PaymentDiv}
            onClick={(e) => {
              // Only trigger handleBankCheck if the click is not on an input field or its container
              if (
                !e.target.closest(`.${styles.PaymentDesBank}`) &&
                e.target.tagName !== "INPUT"
              ) {
                handleBankCheck();
              }
            }}
          >
            <div>
              <label className={styles.customCheckbox}>
                <input
                  type="checkbox"
                  checked={isCheckedBank}
                  onChange={handleBankCheck}
                />
                <span className={styles.checkmark}></span>
                <div className={styles.PaymentMode}>
                  <div className={styles.PaymentHeading}>
                    Verify Bank Via Account Number And IFSC{" "}
                    <span className={styles.UPI_Layer}>
                      <img
                        src={KYCiconBank}
                        alt="KYCiconBank"
                        className={styles.UPI_Layer}
                      />
                    </span>
                  </div>
                  {isCheckedBank && (
                    <div className={styles.PaymentDes}>
                      Verify your bank account by providing your account number
                      and IFSC code. This method allows direct verification with
                      your banking details.
                    </div>
                  )}
                </div>
              </label>

              {isCheckedBank && (
                <div
                  className={styles.PaymentDesBank}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div>
                    <div className={styles.BankLabel1}>
                      Enter Account Number
                    </div>
                    <input
                      type="text"
                      placeholder="Enter Account Number"
                      className={styles.bankInput1}
                      value={accountNumber}
                      onChange={(e) => {
                        setAccountNumber(e.target.value);
                        validateAccountNumber(e.target.value);
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />

                    <br />
                    <div className={styles.BankLabel2}>Enter IFSC Code</div>
                    <input
                      type="text"
                      placeholder="Enter IFSC code"
                      className={styles.bankInput2}
                      onChange={(e) => {
                        const upperCaseValue = e.target.value.toUpperCase();
                        setIfscCode(upperCaseValue);
                      }}
                      onBlur={() => validateIFSC(ifscCode)}
                      value={ifscCode}
                      onClick={(e) => e.stopPropagation()}
                    />
                    {accountNumberError && (
                      <div className={styles.errorText}>
                        {accountNumberError}
                      </div>
                    )}
                    {ifscError && (
                      <div className={styles.errorText}>{ifscError}</div>
                    )}
                    {apiError && (
                      <div className={styles.errorText}>{apiError}</div>
                    )}

                    {savedBankDetails?.bank_name && (
                      <div className={styles.bankInfoCard}>
                        <div className={styles.bankInfoItem}>
                          <span className={styles.bankInfoLabel}>Bank:</span>
                          <span className={styles.bankInfoValue}>
                            {savedBankDetails.bank_name}
                          </span>
                        </div>
                        {savedBankDetails?.branch && (
                          <div className={styles.bankInfoItem}>
                            <span className={styles.bankInfoLabel}>Branch:</span>
                            <span className={styles.bankInfoValue}>
                              {savedBankDetails.branch}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {savedBankDetails?.bank_proof_file && (
                      <div className={styles.attachedProofContainer}>
                        <div className={styles.attachedProofHeader}>
                          <div className={styles.attachedProofTitle}>
                            <FileText size={18} className={styles.attachedProofIcon} />
                            <span>Attached Bank Proof Document</span>
                          </div>
                        </div>
                        <div className={styles.attachedProofBody}>
                          <div className={styles.attachedProofName}>
                            {savedBankDetails.bank_proof_file.split("/").pop()}
                          </div>
                          <div className={styles.attachedProofActions}>
                            <a
                              href={`${process.env.REACT_APP_API_URL || ""}/${savedBankDetails.bank_proof_file.replace(/^\//, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.viewDocLink}
                              onClick={(e) => e.stopPropagation()}
                            >
                              View Document
                            </a>
                            <button
                              type="button"
                              className={styles.changeDocBtn}
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowDocUploadPopup(true);
                              }}
                            >
                              Change Document
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div>
              {isCheckedBank && (
                <img src={bankifsc} alt="UPIimg" className={styles.Bankifsc} />
              )}
            </div>
          </div>

          <div className={styles.shieldDiv}>
            <img src={shield} alt="shield Icon" className={styles.shieldIcon} />
            <div className={styles.shieldText}>
              Your account details are safe & secure with us.
            </div>
          </div>

          <div className={styles.Line}></div>


          {isCheckedBank && (
            <button
              className={`${styles.verifyButton} ${isLoadingBank ? styles.loading : ""}`}
              onClick={handleBankVerification}
              disabled={
                !accountNumber ||
                !ifscCode ||
                ifscError ||
                accountNumberError ||
                isLoadingBank
              }
            >
              {isLoadingBank ? (
                <>
                  Verifying
                  <div className={styles.loadingDots}>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </>
              ) : (
                "Proceed to Next"
              )}
            </button>
          )}
          {showSuccessPopup && (
            <div className={styles.popupOverlay}>
              <div className={styles.popup}>
                <div className={styles.popupContent}>
                  <h3>Bank Verification Successful!</h3>
                  <div
                    style={{
                      background: "#f8f8f8",
                      padding: "15px",
                      borderRadius: "10px",
                      margin: "15px 0",
                    }}
                  >
                    <p style={{ fontWeight: 500 }}>
                      Name:{" "}
                      <span style={{ color: "#333" }}>
                        {accountNumberInfo?.account_holder_name}
                      </span>
                    </p>
                    <p style={{ fontWeight: 500 }}>
                      Account Number:{" "}
                      <span style={{ color: "#333" }}>{accountNumber}</span>
                    </p>
                    <p style={{ fontWeight: 500 }}>
                      IFSC:{" "}
                      <span style={{ color: "#333" }}>
                        {accountNumberInfo?.ifsc_code?.toUpperCase()}
                      </span>
                    </p>
                  </div>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "#666",
                      marginBottom: "15px",
                    }}
                  >
                    Please confirm your bank account details
                  </p>
                  <button
                    onClick={handleBankConfirmation}
                    className={`${styles.verifyButton} ${isLoadingConfirm ? styles.loading : ""}`}
                    disabled={isLoadingConfirm}
                  >
                    {isLoadingConfirm ? (
                      <>
                        Confirming
                        <div className={styles.loadingDots}>
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      </>
                    ) : (
                      "Confirm Account"
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
          {showUPIPopup && (
            <div className={styles.popupOverlay}>
              <div className={styles.popup}>
                <button
                  className={styles.closeButton}
                  onClick={handleCloseUPIPopup}
                >
                  <X size={20} />
                </button>
                <div className={styles.popupContentDesktop}>
                  <h3>UPI Verification</h3>
                  <div>
                    <h4>Pay ₹1.00</h4>
                    <p>Scan QR code with any UPI app</p>
                    <div className={styles.upiImgPopupWrapper}>
                      <img
                        src={phonepeIcon}
                        alt="PhonePe"
                        className={styles.upiImgPopup}
                      />
                      <img
                        src={gPayIcon}
                        alt="Google Pay"
                        className={styles.upiImgPopup}
                      />
                      <img
                        src={paytmIcon}
                        alt="Paytm"
                        className={styles.upiImgPopup}
                      />
                      <img
                        src={bhimIcon}
                        alt="BHIM"
                        className={styles.upiImgPopup}
                      />
                      <img
                        src={whatsappPay}
                        alt="WhatsApp Pay"
                        className={styles.upiImgPopup}
                      />
                    </div>
                    <img
                      src={`data:image/png;base64,${upiCreatedLink.result.qrCodeUrl}`}
                      alt="UPI_QR"
                    />
                  </div>
                </div>

                <div className={styles.popupContentMobile}>
                  <h3>UPI Verification</h3>
                  <div>
                    <h4>Pay ₹1.00</h4>
                    <p>Select your preferred UPI app</p>
                    <div className={styles.upiAppButtons}>
                      <img
                        src={phonepeIcon}
                        alt="PhonePe"
                        className={styles.upiAppIcon}
                        onClick={() =>
                          handleUpiAppClick(
                            "PhonePe",
                            upiCreatedLink.result.phoneUrl,
                          )
                        }
                      />
                      <img
                        src={gPayIcon}
                        alt="Google Pay"
                        className={styles.upiAppIcon}
                        onClick={() =>
                          handleUpiAppClick(
                            "Google Pay",
                            upiCreatedLink.result.gPayUrl,
                          )
                        }
                      />
                      <img
                        src={paytmUPIIcon}
                        alt="Paytm"
                        className={styles.upiAppIcon}
                        onClick={() =>
                          handleUpiAppClick(
                            "Paytm",
                            upiCreatedLink.result.paytmUrl,
                          )
                        }
                      />
                      <img
                        src={bhimIcon}
                        alt="BHIM"
                        className={styles.upiAppIcon}
                        onClick={() =>
                          handleUpiAppClick(
                            "BHIM",
                            upiCreatedLink.result.bhimUrl,
                          )
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {showVerificationSuccessPopup && (
            <div className={styles.popupOverlay}>
              <div className={styles.popup}>
                <div className={styles.popupContent}>
                  <h3>Verification Successful!</h3>
                  <div
                    style={{
                      background: "#f8f8f8",
                      padding: "15px",
                      borderRadius: "10px",
                      margin: "15px 0",
                    }}
                  >
                    <p style={{ fontWeight: 500 }}>
                      Name:{" "}
                      <span style={{ color: "#333" }}>
                        {verificationData.account_holder_name}
                      </span>
                    </p>
                    <p style={{ fontWeight: 500 }}>
                      Bank Account:{" "}
                      <span style={{ color: "#333" }}>
                        {verificationData.account_number}
                      </span>
                    </p>
                    <p style={{ fontWeight: 500 }}>
                      IFSC:{" "}
                      <span style={{ color: "#333" }}>
                        {verificationData.ifsc_code}
                      </span>
                    </p>
                  </div>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "#666",
                      marginBottom: "15px",
                    }}
                  >
                    Please confirm your bank account details
                  </p>
                  <button
                    onClick={handleBankConfirmation}
                    className={`${styles.verifyButton} ${isLoadingConfirm ? styles.loading : ""}`}
                    disabled={isLoadingConfirm}
                  >
                    {isLoadingConfirm ? (
                      <>
                        Confirming
                        <div className={styles.loadingDots}>
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      </>
                    ) : (
                      "Confirm Account"
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
          {showTimerPopup && (
            <div className={styles.popupOverlay}>
              <div className={`${styles.popup} ${styles.timerPopup}`}>
                <div className={styles.popupContent}>
                  <button
                    className={styles.closeButton}
                    onClick={() => setShowTimerPopup(false)}
                  >
                    ×
                  </button>
                  <h3>Payment in Progress</h3>
                  <p>
                    Complete the payment in your{" "}
                    <span style={{ fontWeight: 600, color: "#f73439" }}>
                      {selectedUpiApp}
                    </span>{" "}
                    app
                  </p>
                  <div className={styles.timer}>
                    <div className={styles.timerCircle}>
                      <span>
                        {Math.floor(timerCountdown / 60)}:
                        {(timerCountdown % 60).toString().padStart(2, "0")}
                      </span>
                    </div>
                  </div>
                  <p className={styles.timerText}>
                    Time remaining to complete payment
                  </p>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#666",
                      marginTop: "15px",
                    }}
                  >
                    If you've already completed the payment, please wait while
                    we verify your transaction.
                  </p>
                </div>
              </div>
            </div>
          )}
          {showDocUploadPopup && (
            <div className={styles.popupOverlay}>
              <div className={styles.popup}>
                <button
                  className={styles.closeButton}
                  onClick={() => setShowDocUploadPopup(false)}
                >
                  <X size={20} />
                </button>

                <div className={styles.popupContent}>
                  <h3 className={styles.popupTitle}>
                    Bank Account Verification Pending
                  </h3>
                  {verificationData?.panName && verificationData?.bankName && (
                    <div style={{ background: '#fff0f0', padding: '10px', borderRadius: '5px', marginBottom: '10px', fontSize: '13px', textAlign: 'left' }}>
                        <p style={{ margin: '5px 0', color: '#d32f2f' }}><strong>Name mismatch detected:</strong></p>
                        <p style={{ margin: '5px 0' }}>Name as per PAN: <strong>{verificationData.panName}</strong></p>
                        <p style={{ margin: '5px 0' }}>Name as per Bank: <strong>{verificationData.bankName}</strong></p>
                    </div>
                  )}
                  <p className={styles.popupSubText}>
                    We are unable to verify your bank account automatically.
                    Please upload one of the following documents to complete
                    verification.
                  </p>
                  <div className={styles.documentBox}>
                    <p className={styles.documentTitle}>Accepted documents</p>
                    <ul>
                      <li>Cancelled Cheque (showing account number & name)</li>
                      <li>Bank Passbook – front page</li>
                      <li>Latest Bank Statement</li>
                    </ul>
                  </div>
                  <div className={styles.uploadField}>
                    <div className={styles.uploadBox}>
                      <Upload size={22} className={styles.uploadIcon} />

                      <p className={styles.uploadText}>
                        {bankProofFile ? bankProofFile.name : "Click to upload or drag & drop"}
                      </p>

                      <p className={styles.uploadHint}>
                        PNG, JPG, PDF (max 5MB)
                      </p>

                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className={styles.fileInput}
                        onChange={handleFileChange}
                      />
                    </div>
                  </div>
                  <button 
                    className={`${styles.popupPrimaryBtn} ${isUploadingProof ? styles.loading : ""}`}
                    onClick={handleBankProofUpload}
                    disabled={!bankProofFile || isUploadingProof}
                  >
                    {isUploadingProof ? (
                      <>
                        Uploading
                        <div className={styles.loadingDots}>
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      </>
                    ) : (
                      "Submit for Verification"
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default BankVerification;
