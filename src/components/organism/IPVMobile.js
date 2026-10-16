import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import styles from "./IPVMobile.module.css";
import LocationModal from "./LocationModal";
import toast from "react-hot-toast";

const IPVMobile = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [locationStatus, setLocationStatus] = useState("pending");
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [tokenReady, setTokenReady] = useState(false);
  const [error, setError] = useState("");
  const MAX_ATTEMPTS = 3;

  // On mount: extract token from URL query param and store in localStorage
  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      localStorage.setItem("authToken", token);
      setTokenReady(true);
    } else {
      setError("Invalid or missing session link. Please request a new email.");
    }
  }, [searchParams]);

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
    } catch {
      return false;
    }
  };

  const handleGetStarted = async () => {
    const token = localStorage.getItem("authToken");
    setLoading(true);
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
        localStorage.setItem("ipv_from_mobile", "true");
        window.open(data.url, "_self");
      } else {
        toast.error(data.message || "Error creating verification URL");
        setLoading(false);
      }
    } catch {
      toast.error("Network error occurred");
      setLoading(false);
    }
  };

  const handleLocationRequest = async () => {
    setLoading(true);
    const newAttempt = attemptCount + 1;
    setAttemptCount(newAttempt);

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 0,
        });
      });

      const { latitude, longitude } = position.coords;
      const saved = await saveGeoLocation(latitude, longitude);
      if (saved) {
        setLocationStatus("granted");
        toast.success("Location captured");
        setTimeout(() => handleGetStarted(), 500);
      } else {
        throw new Error("Failed to save location");
      }
    } catch {
      setLocationStatus("denied");
      setLoading(false);
      if (newAttempt < MAX_ATTEMPTS) {
        toast.error(`Location denied. Attempt ${newAttempt}/${MAX_ATTEMPTS}`);
        setShowLocationModal(true);
      } else {
        toast.error("Max location attempts exceeded.");
        setShowLocationModal(true);
      }
    }
  };

  const handleRetry = () => {
    setShowLocationModal(false);
    setLocationStatus("pending");
    handleLocationRequest();
  };

  if (error) {
    return (
      <div className={styles.errorPage}>
        <div className={styles.errorCard}>
          <div className={styles.errorIcon}>⚠️</div>
          <h2>Link Invalid</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!tokenReady) {
    return (
      <div className={styles.errorPage}>
        <div className={styles.loader}></div>
        <p>Loading your session...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.headerIcon}>📸</div>
          <h1 className={styles.title}>In-Person Verification</h1>
          <p className={styles.subtitle}>Complete your KYC selfie on this device</p>
        </div>

        <div className={styles.steps}>
          <div className={styles.step}>
            <div className={styles.stepIcon}>📍</div>
            <div>
              <div className={styles.stepTitle}>Allow Location</div>
              <div className={styles.stepDesc}>We need your location to verify you're in India</div>
            </div>
          </div>
          <div className={styles.stepArrow}>↓</div>
          <div className={styles.step}>
            <div className={styles.stepIcon}>🤳</div>
            <div>
              <div className={styles.stepTitle}>Take Selfie</div>
              <div className={styles.stepDesc}>Face the camera directly, good lighting required</div>
            </div>
          </div>
          <div className={styles.stepArrow}>↓</div>
          <div className={styles.step}>
            <div className={styles.stepIcon}>✅</div>
            <div>
              <div className={styles.stepTitle}>Verification Done</div>
              <div className={styles.stepDesc}>Your desktop session updates automatically</div>
            </div>
          </div>
        </div>

        <button
          className={`${styles.button} ${loading ? styles.loading : ""}`}
          onClick={handleLocationRequest}
          disabled={loading || locationStatus === "granted"}
        >
          {loading
            ? "Please wait..."
            : locationStatus === "granted"
            ? "Processing..."
            : "Start IPV Verification"}
        </button>

        <p className={styles.hint}>
          🔒 This link is unique to your account and expires in 24 hours.
        </p>
      </div>

      {showLocationModal && (
        <LocationModal
          onClose={() => setShowLocationModal(false)}
          onRetry={handleRetry}
          attemptCount={attemptCount}
          maxAttempts={MAX_ATTEMPTS}
        />
      )}
    </div>
  );
};

export default IPVMobile;
