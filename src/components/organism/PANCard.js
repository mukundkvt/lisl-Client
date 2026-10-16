import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import styles from "./PANCard.module.css";
import TopPanIcon from "../../assets/icons/KYCiconsPAN.svg";
import clock from "../../assets/icons/ClockTimer.svg";
import shield from "../../assets/icons/warn.svg";
import Lion from "../../assets/icons/Lion.png";
import PAN_1 from "../../assets/images/PAN_1.svg";
import editIcon from "../../assets/icons/edit_icon.svg";

const PANCard = () => {
  const navigate = useNavigate();
  const [panNumber, setPanNumber] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [countdown, setCountdown] = useState(10);
  const [PANData, setPANData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isOpenConfirmationModal, setIsOpenConfirmationModal] = useState();
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessageModal, setErrorMessageModal] = useState("");
  const [dobError, setDobError] = useState("");
  const [file, setFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [panConfirmMode, setPanConfirmMode] = useState("check_pan");
  const [filePreviewUrl, setFilePreviewUrl] = useState("");
  const fileInputRef = useRef(null);

  const [manualPANData, setManualPANData] = useState({
    number: "",
    name: "",
    dateOfBirth: "",
  });

  const resetPanFileUpload = () => {
    setFile(null);
    setFilePreviewUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validatePAN = (pan) => {
    const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panPattern.test(pan);
  };

  const handleSubmit = async (e) => {
    const token = localStorage.getItem("authToken");
    e.preventDefault();
    if (!validatePAN(panNumber)) {
      setErrorMessage("Enter a valid PAN number");
      return;
    }
    setIsLoading(true);
    setErrorMessage("");
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/check_pan`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ panNumber: panNumber }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        setIsLoading(false);
        const errorMsg = data.message || "PAN verification failed";
        setErrorMessage(errorMsg);
        toast.error(errorMsg);
        return;
      }
      if (
        data &&
        data.panDetails &&
        data.panDetails.result.name &&
        data.panDetails.result.dateOfBirth
      ) {
        setPanConfirmMode("check_pan");
        setIsOpenConfirmationModal(true);
        setPANData(data.panDetails.result);
      } else {
        setShowErrorModal(true);
        setManualPANData({ ...manualPANData, number: panNumber });
      }
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      console.error("Error verifying PAN:", error);
      setShowErrorModal(true);
      setManualPANData({ ...manualPANData, number: panNumber });
    }
  };

  const handlePanConfirmation = async () => {
    const token = localStorage.getItem("authToken");
    try {
      const url =
        panConfirmMode === "extract_pan"
          ? `${process.env.REACT_APP_API_URL}/api/confirm_extract_pan`
          : `${process.env.REACT_APP_API_URL}/api/confirm_pan`;

      const response = await fetch(url, {
        method: "POST",
        headers:
          panConfirmMode === "extract_pan"
            ? { Authorization: `Bearer ${token}` }
            : {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
        body:
          panConfirmMode === "extract_pan"
            ? undefined
            : JSON.stringify({ panData: PANData }),
      });

      const data = await response.json();
      if (data.success) {
        console.log("PAN confirmed successfully");
        setIsOpenConfirmationModal(false);
        navigate("/address");
      } else {
        console.error("Failed to confirm PAN:", data.message);
        toast.error(data.message || "Failed to confirm PAN");
      }
    } catch (error) {
      console.error("Error confirming PAN:", error);
      toast.error("Error confirming PAN");
    }
  };


  // upload pan file fuctionality

  const extractPanFromFile = async (selectedFile) => {
    const token = localStorage.getItem("authToken");
    try {
      if (!selectedFile) return;

      const formFile = new FormData();
      formFile.append("pan_file", selectedFile);
      setIsLoading(true);
      setErrorMessage("");
      setErrorMessageModal("");

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/extract_pan`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formFile,
        }
      );

      const data = await response.json();
      if (response.ok && data.success) {
        setIsLoading(false);
        setPanConfirmMode("extract_pan");
        setPANData(data.data);
        setShowErrorModal(false);
        setIsOpenConfirmationModal(true);
      } else {
        setIsLoading(false);
        const errorMsg = data.message || "Failed to extract PAN from image.";
        setErrorMessageModal(errorMsg);
        toast.error(errorMsg);
      }
    } catch (error) {
      setIsLoading(false);
      setErrorMessageModal("Failed to extract PAN from image.");
      console.error("Error confirming PAN:", error);
    }
  };

  const setSelectedFile = (nextFile) => {
    if (!nextFile) return;
    if (!String(nextFile.type || "").startsWith("image/")) {
      setErrorMessageModal("Please upload an image file only (JPG/PNG).");
      setFile(null);
      setFilePreviewUrl("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setErrorMessageModal("");
    setFile(nextFile);
    extractPanFromFile(nextFile);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  useEffect(() => {
    if (!file) {
      setFilePreviewUrl("");
      return;
    }
    const url = URL.createObjectURL(file);
    setFilePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 0) {
          return 10;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      {/* <Header/> */}
      <div className={styles.MainContainer}>
        <div className={styles.MainWrapper}>
          <div className={styles.topPANDiv}>
            <img
              src={TopPanIcon}
              alt="PAN Icon"
              className={styles.topPanIcon}
            />
            <div className={styles.topPanText}>Verify Your PAN</div>

            <div className={styles.topClockDiv}>
              <img src={clock} alt="Clock Icon" className={styles.clockIcon} />
              <div className={styles.clockText}>
                this takes less than {countdown} seconds.{" "}
              </div>
            </div>
          </div>

          <div className={styles.panDemoDiv}>
            <div className={styles.EnterYourPan}>Enter Your Pan</div>

            <div>
              <img src={PAN_1} alt="PAN Icon" className={styles.panImage} />
            </div>

            <div className={styles.SamplePANText}>Showing sample PAN</div>
          </div>

          <div className={styles.panInputDiv}>
            <div className={styles.panLabel}>Enter PAN Number*</div>

            <input
              type="text"
              value={panNumber}
              onChange={(e) => {
                setPanNumber(e.target.value);
                if (errorMessage) setErrorMessage("");
              }}
              placeholder="Enter your PAN to proceed"
              onInput={(e) => (e.target.value = e.target.value.toUpperCase())}
              onKeyPress={(e) => {
                if (e.key === "Enter" && validatePAN(panNumber)) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              maxLength={10}
              className={styles.panInput}
            />

            {errorMessage && (
              <div className={styles.errorMessage}>{errorMessage}</div>
            )}
          </div>

          <div className={styles.shieldDiv}>
            <img src={shield} alt="shield Icon" className={styles.shieldIcon} />
            <div className={styles.shieldText}>
              Your account details are safe & secure with us.
            </div>
          </div>

          <div className={styles.Line}></div>

          <button className={styles.verifyButton} onClick={handleSubmit}>
            Verify PAN
          </button>
        </div>
      </div>

      {isLoading && (
        <div className={styles.loader}>
          <div className={styles.loaderDiv}>
            <div className={styles.fetchingText}>Fetching PAN Information</div>
            <div>
              <div className={styles.loadingText}>
                Please wait, this may take a while!
              </div>
              <div className={styles.loadingText}>
                Do not press back key or refresh this page
              </div>
            </div>

            <div className={styles.shieldDiv}>
              <img
                src={shield}
                alt="shield Icon"
                className={styles.shieldIcon}
              />
              <div className={styles.shieldText}>
                Your account details are safe & secure with us.
              </div>
            </div>
          </div>
        </div>
      )}

      {isOpenConfirmationModal && (
        <div className={styles.confirmationDiv}>
          <div className={styles.confirmationWrapper}>
            <div className={styles.modalHeader}>
              <h2>Fetched details from Income Tax Department</h2>
              <button
                className={styles.closeButton}
                onClick={() => {
                  resetPanFileUpload();
                  setIsOpenConfirmationModal(false);
                }}
              >
                &times;
              </button>
            </div>

            <div className={styles.confirmationItemDiv}>
              <div className={styles.PanDesign}>
                <div className={styles.PanInner}>
                  <div className={styles.PanAuthority}>
                    <div className={styles.PanAuthorityText}>
                      INCOME TAX DEPARTMENT
                    </div>
                    <img
                      src={Lion}
                      alt="Lion Icon"
                      className={styles.LionImage}
                    />
                    <div className={styles.PanAuthorityText}>
                      GOVT. OF INDIA
                    </div>
                  </div>

                  <div className={styles.PanNumberContainer}>
                    <div className={styles.PanNumberHeading}>
                      Permanent Account Number
                    </div>
                    <div className={styles.PanNumberText}>
                      {PANData.number}
                      <img
                        src={editIcon}
                        alt="Edit"
                        className={styles.editIcon}
                        onClick={() => {
                          setPanNumber(PANData.number);
                          resetPanFileUpload();
                          setIsOpenConfirmationModal(false);
                        }}
                      />
                    </div>
                  </div>

                  <div className={styles.PanDetailContainerTop}>
                    <div className={styles.PanNameContainer}>
                      <div className={styles.PanName}>Name</div>
                      <div className={styles.PanNameValue}>{PANData.name}</div>
                    </div>
                  </div>

                  <div className={styles.PanDetailContainer}>
                    <div className={styles.PanNameContainer}>
                      <div className={styles.PanName}>Father's Name</div>
                      <div className={styles.PanNameValue}>
                        {PANData.fatherName}
                      </div>
                    </div>
                  </div>

                  <div className={styles.PanDetailContainer}>
                    <div className={styles.PanNameContainer}>
                      <div className={styles.PanName}>Date of Birth</div>
                      <div className={styles.PanNameValue}>
                        {PANData.dateOfBirth}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              className={styles.confirmButton}
              onClick={handlePanConfirmation}
            >
              Confirm
            </button>
          </div>
        </div>
      )}
      {showErrorModal && (
        <div className={styles.confirmationDiv}>
          <div className={styles.confirmationWrapper}>
            <div className={styles.modalHeader}>
              <h2>Unable to fetch PAN details automatically</h2>
              <button
                className={styles.closeButton}
                onClick={() => {
                  setPanNumber(manualPANData.number);
                  resetPanFileUpload();
                  setShowErrorModal(false);
                }}
              >
                &times;
              </button>
            </div>

            <div className={styles.confirmationItemDiv}>
              <div className={styles.PanDesign}>
                <div className={styles.PanInner}>
                  <div className={styles.PanAuthority}>
                    <div className={styles.PanAuthorityText}>
                      INCOME TAX DEPARTMENT
                    </div>
                    <img
                      src={Lion}
                      alt="Lion Icon"
                      className={styles.LionImage}
                    />
                    <div className={styles.PanAuthorityText}>
                      GOVT. OF INDIA
                    </div>
                  </div>

                  <div className={styles.PanNumberContainer}>
                    <div className={styles.PanNumberHeading}>
                      Permanent Account Number
                    </div>
                    <div className={styles.PanNumberText}>
                      {panNumber}
                      <img
                        src={editIcon}
                        alt="Edit"
                        className={styles.editIcon}
                        onClick={() => {
                          setPanNumber(panNumber);
                          resetPanFileUpload();
                          setShowErrorModal(false);
                        }}
                      />
                    </div>
                  </div>

                  {/* <div className={styles.PanDetailContainerTop}>
                    <div className={styles.PanNameContainer}> 
                      <div className={styles.PanName}>Name</div>
                      <div className={styles.PanNameValue}>
                        <input
                          type="text"
                          value={manualPANData.name}
                          onChange={(e) => setManualPANData({ ...manualPANData, name: e.target.value })}
                          className={styles.nomineeDetailsInput}
                          placeholder="Enter Name As Per PAN"
                        />
                      </div>
                    </div>
                  </div> */}

                  {/* <div className={styles.PanDetailContainer}>
                    <div className={styles.PanNameContainer}> 
                      <div className={styles.PanName}>Date of Birth</div>
                      <div className={styles.PanNameValue}>
                        <input
                          type="date"
                          value={manualPANData.dateOfBirth}
                          onChange={(e) => {
                            const selectedDate = new Date(e.target.value);
                            const today = new Date();
                            const minAgeDate = new Date(today.setFullYear(today.getFullYear() - 18));
                            
                            if (selectedDate > minAgeDate) {
                              setDobError("You must be at least 18 years old");
                            } else {
                              setDobError("");
                              setManualPANData({ ...manualPANData, dateOfBirth: e.target.value });
                            }
                          }}
                          className={styles.nomineeDetailsInput}
                          max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                        />
                        {dobError && <div className={styles.errorMessage}>{dobError}</div>}
                      </div>
                    </div>
                  </div> */}
                  <div className={styles.PanDetailContainer}>
                    <div className={styles.PanNameContainer}>
                      <div className={styles.PanName}>Upload Pan File</div>
                      <div
                        className={`${styles.dropZone} ${
                          isDragOver ? styles.dropZoneActive : ""
                        }`}
                        onDragOver={(ev) => {
                          ev.preventDefault();
                          setIsDragOver(true);
                        }}
                        onDragLeave={() => setIsDragOver(false)}
                        onDrop={(ev) => {
                          ev.preventDefault();
                          setIsDragOver(false);
                          const dropped = ev.dataTransfer?.files?.[0];
                          setSelectedFile(dropped);
                        }}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <div className={styles.uploadIcon}></div>

                        {/* Hidden file input */}
                        <input
                          type="file"
                          name="pan_file"
                          id="fileInput"
                          className={styles.fileInput}
                          accept="image/*"
                          onChange={handleFileChange}
                          ref={fileInputRef}
                        />

                        {/* Styled label works as Browse button */}
                        {filePreviewUrl ? (
                          <>
                            <img
                              src={filePreviewUrl}
                              alt="PAN Preview"
                              className={styles.panPreview}
                            />
                            <p className={styles.hint}>
                              {isLoading ? "Extracting PAN..." : "Tap to change image or drop another image"}
                            </p>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              className={styles.browseButton}
                              onClick={(ev) => {
                                ev.preventDefault();
                                ev.stopPropagation();
                                fileInputRef.current?.click();
                              }}
                            >
                              Browse
                            </button>
                            <p className={styles.hint}>Drop an image here</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <p>{errorMessageModal}</p>
          </div>
        </div>
      )}
    </>
  );
};

export default PANCard;
