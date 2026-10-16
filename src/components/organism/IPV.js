import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./IPV.module.css";
import clock from "../../assets/icons/ClockTimer.svg";
import Camera_Icon from "../../assets/icons/Camera_Icon.svg";
import sideface from "../../assets/icons/sideface.svg";
import frontface from "../../assets/icons/frontface.svg";
import GroupPhoto from "../../assets/icons/GroupPhoto.svg";
import cross from "../../assets/icons/cross.png";
import accept from "../../assets/icons/accept.png";
import kycInfo from "../../assets/icons/kycInfo.svg";
import LocationModal from "./LocationModal";
import toast from "react-hot-toast";
import RejectionBanner from "../RejectionBanner";
import { useKyc } from "../../context/KycContext";

const IPV = () => {
  const navigate = useNavigate();
  const { navigateToNextStep, refreshKycStatus } = useKyc();
  const [countdown, setCountdown] = useState(30);
  const [loading, setLoading] = useState(false);
  const [locationStatus, setLocationStatus] = useState("pending"); // pending, granted, denied
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [coordinates, setCoordinates] = useState(null);
  const [attemptCount, setAttemptCount] = useState(0);

  // Email & polling states
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [ipvComplete, setIpvComplete] = useState(false);
  const [showCompleteOverlay, setShowCompleteOverlay] = useState(false);

  const pollIntervalRef = useRef(null);

  const MAX_ATTEMPTS = 3;

  // Countdown timer (decorative)
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev === 0 ? 30 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // ─── Polling: check IPV status every 5 seconds once email is sent ───────────
  useEffect(() => {
    if (emailSent && !ipvComplete) {
      pollIntervalRef.current = setInterval(async () => {
        try {
          const token = localStorage.getItem("authToken");
          const res = await fetch(
            `${process.env.REACT_APP_API_URL}/api/check_ipv_status`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          const data = await res.json();

          if (res.ok && data.isComplete) {
            clearInterval(pollIntervalRef.current);
            setIpvComplete(true);
            setShowCompleteOverlay(true);
            // Auto-navigate to signature after 3.5s
            setTimeout(() => {
              refreshKycStatus();
              navigateToNextStep("/ipv");
            }, 3500);
          }
        } catch (err) {
          console.error("Poll error:", err);
        }
      }, 5000);
    }
    return () => clearInterval(pollIntervalRef.current);
  }, [emailSent, ipvComplete, navigate]);

  // ─── Stop polling when component unmounts ───────────────────────────────────
  useEffect(() => {
    return () => clearInterval(pollIntervalRef.current);
  }, []);

  const saveGeoLocation = async (latitude, longitude) => {
    const token = localStorage.getItem("authToken");
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/save_geo_location`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ latitude, longitude }),
        }
      );
      return response.ok;
    } catch (error) {
      console.error("Error saving location:", error);
      return false;
    }
  };

  const handleLocationRequest = async () => {
    setLoading(true);
    const newAttemptCount = attemptCount + 1;
    setAttemptCount(newAttemptCount);

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        });
      });

      const { latitude, longitude } = position.coords;
      setCoordinates({ latitude, longitude });

      const locationSaved = await saveGeoLocation(latitude, longitude);
      if (locationSaved) {
        setLocationStatus("granted");
        toast.success("Location captured successfully");
        setTimeout(() => {
          handleGetStarted();
        }, 500);
      } else {
        throw new Error("Failed to save location");
      }
    } catch (error) {
      console.error("Location error:", error);
      setLocationStatus("denied");
      setLoading(false);

      if (newAttemptCount < MAX_ATTEMPTS) {
        toast.error(`Location access denied. Attempt ${newAttemptCount}/${MAX_ATTEMPTS}`);
        setShowLocationModal(true);
      } else {
        toast.error("Maximum location access attempts exceeded. Please try again later.");
        setShowLocationModal(true);
      }
    }
  };

  const handleGetStarted = async () => {
    setLoading(true);
    const token = localStorage.getItem("authToken");

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/create_ipv_url`,
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
        toast.error(data.message || "Error creating verification URL");
      }
    } catch (error) {
      console.error("Network error:", error);
      toast.error("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  // ─── Send IPV email ──────────────────────────────────────────────────────────
  const handleSendEmail = async () => {
    setEmailSending(true);
    const token = localStorage.getItem("authToken");
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/send_ipv_email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Email sent! Check your inbox.");
        setEmailSent(true);
      } else {
        toast.error(data.message || "Failed to send email.");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setEmailSending(false);
    }
  };

  const getButtonText = () => {
    if (loading) return "Please wait...";
    if (locationStatus === "granted") return "Processing...";
    return `Allow Location`;
  };

  const handleButtonClick = () => {
    if (loading || locationStatus === "granted") return;
    handleLocationRequest();
  };

  const handleRetryLocation = () => {
    setShowLocationModal(false);
    setLocationStatus("pending");
    handleLocationRequest();
  };

  return (
    <div className={styles.MainContainer}>
      <div className={styles.MainWrapper}>
        <RejectionBanner section="ipv" />
        <div className={styles.topPhotoDiv}>
          <div className={styles.topPhotoContainer}>
            <img
              src={Camera_Icon}
              alt="Camera Icon"
              className={styles.topCameraIcon}
            />
            <div className={styles.topCameraText}>Upload Your Photo</div>
          </div>

          <div className={styles.topClockDiv}>
            <img src={clock} alt="Clock Icon" className={styles.clockIcon} />
            <div className={styles.clockText}>
              this takes less than {countdown} seconds.{" "}
            </div>
          </div>
        </div>

        <div className={styles.shieldDiv}>
          <div className={styles.shieldText}>
            <h2 className={styles.shieldHeading}> Let's Capture your Photo</h2>
          </div>
          <div className={styles.imageDiv}>
            <div>
              <div className={styles.ImageContainer}>
                <img src={sideface} alt="Sideface" className={styles.Image1} />
                <img src={cross} alt="cross" className={styles.logo} />
              </div>
              <div className={styles.Ins1}>
                <div className={styles.Incorrect}>Incorrect Photo</div>
                <div className={styles.Parra1}>Side facing </div>
                <div className={styles.Parra1}>With sunglasses</div>
                <div className={styles.Parra1}>With filters.</div>
              </div>
            </div>
            <div>
              <div className={styles.ImageContainer}>
                <img src={frontface} alt="Frontface" className={styles.Image} />
                <img src={accept} alt="accept" className={styles.logo} />
              </div>
              <div className={styles.Ins}>
                <div className={styles.Correct}> Correct Photo</div>
                <div className={styles.Parra}>Face the Camera </div>
                <div className={styles.Parra}>Full face in photo</div>
                <div className={styles.Parra}> No filters</div>
              </div>
            </div>
            <div>
              <div className={styles.ImageContainer}>
                <img
                  src={GroupPhoto}
                  alt="GroupPhoto"
                  className={styles.Image}
                />
                <img src={cross} alt="cross" className={styles.logo} />
              </div>
              <div className={styles.Ins}>
                <div className={styles.Incorrect}>Incorrect Photo</div>
                <div className={styles.Parra}>Group Photo</div>
                <div className={styles.Parra}>Not clear</div>
                <div className={styles.Parra}>Tilted camera</div>
              </div>
            </div>
          </div>
          <div className={styles.Instruction}>
            {locationStatus === "pending"
              ? "Please allow location access to proceed with verification."
              : "Initializing photo verification..."}
          </div>
          <div className={styles.kycInfo}>
            <img src={kycInfo} alt="kycInfo" className={styles.InfoImg} />
            <div className={styles.Info}>
              Picture should be recent and capture your full face.
            </div>
          </div>
        </div>

        <div className={styles.Line}></div>

        {/* Primary action: verify on this device */}
        <button
          className={`${styles.verifyButton} ${loading ? styles.loading : ""}`}
          onClick={handleButtonClick}
          disabled={loading || locationStatus === "granted"}
        >
          {getButtonText()}
        </button>

        {/* Divider */}
        <div className={styles.orDivider}>
          <span className={styles.orLine}></span>
          <span className={styles.orText}>or complete on mobile</span>
          <span className={styles.orLine}></span>
        </div>

        {/* Send email button */}
        {!emailSent ? (
          <button
            className={`${styles.emailButton} ${emailSending ? styles.loading : ""}`}
            onClick={handleSendEmail}
            disabled={emailSending}
            id="send-ipv-email-btn"
          >
            {emailSending ? (
              <>
                <span className={styles.btnSpinner}></span> Sending Email...
              </>
            ) : (
              <>📧 Send Link to My Email</>
            )}
          </button>
        ) : (
          <div className={styles.emailSentBox}>
            <div className={styles.emailSentIcon}>✉️</div>
            <div className={styles.emailSentTitle}>Email Sent!</div>
            <div className={styles.emailSentDesc}>
              Open the link on your mobile to complete IPV.
              <br />
              This page will update automatically once done.
            </div>
            <div className={styles.pollingIndicator}>
              <span className={styles.pulseDot}></span>
              Waiting for completion

            </div>
          </div>
        )}
      </div>

      {/* Location modal */}
      {showLocationModal && (
        <LocationModal
          onClose={() => setShowLocationModal(false)}
          onRetry={handleRetryLocation}
          attemptCount={attemptCount}
          maxAttempts={MAX_ATTEMPTS}
        />
      )}

      {/* IPV Completion Animated Overlay */}
      {showCompleteOverlay && (
        <div className={styles.completeOverlay}>
          <div className={styles.completeCard}>
            <div className={styles.completeRing}>
              <svg viewBox="0 0 80 80" className={styles.completeSvg}>
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  fill="none"
                  stroke="#f86a6e"
                  strokeWidth="5"
                  className={styles.completeCircle}
                />
                <path
                  d="M24 40 l12 12 l20 -22"
                  fill="none"
                  stroke="#f86a6e"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={styles.completeTick}
                />
              </svg>
            </div>
            <h2 className={styles.completeTitle}>IPV Completed! 🎉</h2>
            <p className={styles.completeSubtitle}>
              Your In-Person Verification is successful.
              <br />
              Redirecting to next step...
            </p>
            <div className={styles.completeProgress}></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IPV;
