import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./ExchangeSelection.module.css";
import TariffSheet from "../../assets/pdfs/TariffSheet.pdf";
import syncIcon from "../../assets/icons/sync.png";
import RejectionBanner from "../RejectionBanner";
import { useKyc } from "../../context/KycContext";

const ExchangeSelection = () => {
  const navigate = useNavigate();
  const { navigateToNextStep, refreshKycStatus } = useKyc();
  const [checkedSegments, setCheckedSegments] = useState({
    Cash: true,
    FO: false,
    MF: true,
    Commodities: false,
  });
  const [customerClassification, setCustomerClassification] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [financialProofs, setFinancialProofs] = useState([{ type: "", file: null }]);
  const [filePaths, setFilePaths] = useState([]);
  const [allOptions] = useState([
    "Bank Statement",
    "ITR Copy",
    "Salary Slip",
    "Copy of Net Worth",
    "Copy of DP holding statement",
  ]); // Static list of all options
  const [isSubmitting, setIsSubmitting] = useState(false); // To prevent multiple submits
  const [schemeDetails, setSchemeDetails] = useState(null);

  useEffect(() => {
    fetchExchangeData();
  }, []);

  const fetchExchangeData = async () => {
    const token = localStorage.getItem("authToken");
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/get_exchange`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch exchange data");
      const data = await response.json();
      if (data.data.tradingSegments?.length > 0) {
        const segments = {};
        data.data.tradingSegments.forEach((segment) => (segments[segment] = true));
        setCheckedSegments(segments);
      }
      if (data.data.customerClassification) {
        setCustomerClassification(data.data.customerClassification);
      }
      if (data.data.schemeDetails) {
        setSchemeDetails(data.data.schemeDetails);
      } else if (data.data.appliedScheme?._id && typeof data.data.appliedScheme._id === "object") {
        setSchemeDetails(data.data.appliedScheme._id);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (event) => {
    const { name, checked } = event.target;
    setCheckedSegments((prevState) => ({ ...prevState, [name]: checked }));
  };

  const handleCustomerClassificationChange = (event) => {
    setCustomerClassification(event.target.value);
  };

  const handleAddFinancialProof = () => {
    if (financialProofs.length < 5 && getAvailableOptions().length > 0) {
      setFinancialProofs([...financialProofs, { type: "", file: null }]);
    }
  };

  const getAvailableOptions = (indexToExclude = -1) => {
    const selectedTypes = financialProofs
      .map((proof, index) => (index === indexToExclude ? null : proof.type))
      .filter((type) => type);
    return allOptions.filter((option) => !selectedTypes.includes(option));
  };

  const handleFinancialProofChange = (index, value) => {
    const newProofs = [...financialProofs];
    newProofs[index].type = value;
    setFinancialProofs(newProofs);
    setError(null); // Clear error on change
  };

  const handleFileChange = (index, file) => {
    if (file && file.type !== "application/pdf") {
      setError("Only PDF files are allowed");
      return;
    }
    if (file && file.size > 5 * 1024 * 1024) {
      setError("File size should not exceed 5MB");
      return;
    }
    const newProofs = [...financialProofs];
    newProofs[index].file = file;
    setFinancialProofs(newProofs);
    setError(null);
  };

  const uploadFile = async (file, documentType) => {
    const formData = new FormData();
    const fileName = file.name.split(".")[0]; // Extract base name
    const fileExtension = file.name.split(".").pop(); // Extract extension
    formData.append("file", file);
    formData.append("fileName", documentType || fileName); // Matches backend
    formData.append("fileExtension", fileExtension); // Matches backend

    const token = localStorage.getItem("authToken");
    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!response.ok) throw new Error("Upload failed");
    return response.json();
  };

  const handleSubmit = async () => {
    if (isSubmitting || !validateForm()) return;

    setIsSubmitting(true); // Disable further clicks
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const selectedSegments = Object.entries(checkedSegments)
        .filter(([_, checked]) => checked)
        .map(([segment]) => segment);

      // Upload all files and collect paths
      const uploadPromises = financialProofs
        .filter((proof) => proof.file && proof.type)
        .map((proof) => uploadFile(proof.file, proof.type));
      const results = await Promise.all(uploadPromises);
      setFilePaths(results);

      // Send paths to submitExchange
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/submit_exchange`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tradingSegments: selectedSegments,
          customerClassification: customerClassification || "Others",
          filePaths: results,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit exchange data");
      }

      refreshKycStatus();
      navigateToNextStep("/exchange");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setIsSubmitting(false); // Re-enable button on completion
    }
  };

  const handleRemoveFinancialProof = (index) => {
    const newProofs = financialProofs.filter((_, i) => i !== index);
    setFinancialProofs(newProofs);
    setError(null);
  };

  const validateForm = () => {
    let isValid = true;
    let newError = null;

    if (checkedSegments.Commodities && !customerClassification) {
      newError = "Please select customer classification for Commodities segment";
      isValid = false;
    }
    if ((checkedSegments.Commodities || checkedSegments.FO) && (!financialProofs[0].type || !financialProofs[0].file)) {
      newError = "Please provide at least one financial proof with type and file - Required for F&O and Commodities segment";
      isValid = false;
    }
    financialProofs.forEach((proof, index) => {
      if (proof.file && !proof.type) {
        newError = `Please select a document type for file ${index + 1}`;
        isValid = false;
      }
    });
    setError(newError);
    return isValid;
  };

  const triggerFileInput = (index) => {
    document.getElementById(`file-input-${index}`).click();
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading exchange data...</p>
      </div>
    );
  }

  return (
    <>
      <div className={styles.tableContainer}>
        <RejectionBanner section="exchange" />
        <h2>Exchange Segment</h2>
        <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Trading Segment</th>
              <th>Cash</th>
              <th>F & O</th>
              <th>Mutual Funds</th>
              <th>Commodities</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>NSE</td>
              <td>
                <input
                  type="checkbox"
                  name="Cash"
                  checked={checkedSegments.Cash}
                  onChange={handleCheckboxChange}
                  disabled
                />
              </td>
              <td>
                <input
                  type="checkbox"
                  name="FO"
                  checked={checkedSegments.FO}
                  onChange={handleCheckboxChange}
                />
              </td>
              <td></td>
              <td>
                <input
                  type="checkbox"
                  name="Commodities"
                  checked={checkedSegments.Commodities}
                  onChange={handleCheckboxChange}
                />
              </td>
            </tr>
            <tr>
              <td>BSE</td>
              <td>
                <input
                  type="checkbox"
                  name="Cash"
                  checked={checkedSegments.Cash}
                  onChange={handleCheckboxChange}
                  disabled
                />
              </td>
              <td>
                <input
                  type="checkbox"
                  name="FO"
                  checked={checkedSegments.FO}
                  onChange={handleCheckboxChange}
                />
              </td>
              <td>
                <input
                  type="checkbox"
                  name="MF"
                  checked={checkedSegments.MF}
                  onChange={handleCheckboxChange}
                  disabled
                />
                BSE Mutual Fund
              </td>
              <td>
                <input type="checkbox" disabled />
              </td>
            </tr>
            <tr>
              <td>MCX</td>
              <td></td>
              <td></td>
              <td></td>
              <td>
                <input
                  type="checkbox"
                  name="Commodities"
                  checked={checkedSegments.Commodities}
                  onChange={handleCheckboxChange}
                />
              </td>
            </tr>
          </tbody>
        </table>
        </div>
      </div>


      
      {(checkedSegments.Commodities || checkedSegments.FO) && (
        <div className={styles.tableContainer}>
          <h2>Financial Proof</h2>
          {error && error.includes("financial proof") && (
            <div className={styles.errorMessage}>{error}</div>
          )}
          <div>
            {financialProofs.length < 5 && getAvailableOptions().length > 0 && (
              <button onClick={handleAddFinancialProof} className={styles.addButton}>
                Add Financial Proof
              </button>
            )}
            {financialProofs.map((proof, index) => {
              const availableOptions = getAvailableOptions(index);
              const options = proof.type
                ? [proof.type, ...availableOptions] // Include the selected option if it exists
                : availableOptions; // Otherwise, show only available options
              return (
                <div key={index} className={styles.proofRow}>
                  <select
                    name="financialProof"
                    value={proof.type || ""} // Ensure value is always valid
                    onChange={(e) => handleFinancialProofChange(index, e.target.value)}
                    className={styles.customDropdown}
                    disabled={availableOptions.length === 0 && !proof.type}
                  >
                    <option value="">Select</option>
                    {options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <input
                    type="file"
                    id={`file-input-${index}`}
                    style={{ display: "none" }}
                    onChange={(e) => handleFileChange(index, e.target.files[0])}
                    accept=".pdf"
                  />
                  {proof.file && (
                    <div className={styles.fileInfo}>
                      <span>Selected file:</span>
                      <span className={styles.fileName}>{proof.file.name}</span>
                    </div>
                  )}
                  <div className={styles.uploadButtonGroup}>
                    <button
                      className={styles.uploadButton}
                      onClick={() => triggerFileInput(index)}
                    >
                      {proof.file ? (
                        <>
                          <img src={syncIcon} alt="Change" className={styles.syncIcon} />
                          Change File
                        </>
                      ) : (
                        "Upload File"
                      )}
                    </button>
                    <button
                      className={styles.removeButton}
                      onClick={() => handleRemoveFinancialProof(index)}
                    >
                      Remove
                    </button>
                  </div>
                  {proof.type && (
                    <p className={styles.proofNote}>
                      {proof.type === "Bank Statement"
                        ? "Last six month bank statement required."
                        : proof.type === "ITR Copy"
                        ? "Copy of annual accounts required."
                        : proof.type === "Salary Slip"
                        ? "Latest three month salary slip or last year Form 16 required."
                        : proof.type === "Copy of Net Worth"
                        ? "As on date or latest financial year required."
                        : "Latest DP holding statement with more than 50K stock value required."}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      

      <div className={styles.tableContainer}>
        <h2>Brokerage tariff details</h2>
        <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Segment/Exchange</th>
              <th>Trading Brokerage (%)</th>
              <th>Delivery Brokerage (%)</th>
              <th>Minimum Brokerage (paisa)</th>
              <th>Option Brokerage (Rs)</th>
            </tr>
          </thead>
          <tbody>
            {checkedSegments.Cash && (
              <tr>
                <td>CM Segment</td>
                <td>
                  {schemeDetails?.cMSegmentTradingBrokerage !== undefined && schemeDetails?.cMSegmentTradingBrokerage !== null
                    ? `${schemeDetails.cMSegmentTradingBrokerage}%`
                    : "0.02%"}
                </td>
                <td>
                  {schemeDetails?.cMSegmentDeliveryBrokerage !== undefined && schemeDetails?.cMSegmentDeliveryBrokerage !== null
                    ? `${schemeDetails.cMSegmentDeliveryBrokerage}%`
                    : "0.20%"}
                </td>
                <td>
                  {schemeDetails?.cMSegmentMinimumBrokerageInPaisa !== undefined && schemeDetails?.cMSegmentMinimumBrokerageInPaisa !== null
                    ? schemeDetails.cMSegmentMinimumBrokerageInPaisa
                    : "0.02"}
                </td>
                <td>-</td>
              </tr>
            )}
            {checkedSegments.FO && (
              <tr>
                <td>F & O Segment</td>
                <td>
                  {schemeDetails?.fOSegmentTradingBrokerage !== undefined && schemeDetails?.fOSegmentTradingBrokerage !== null
                    ? `${schemeDetails.fOSegmentTradingBrokerage}%`
                    : "0.02%"}
                </td>
                <td>
                  {schemeDetails?.fOSegmentDeliveryBrokerage !== undefined && schemeDetails?.fOSegmentDeliveryBrokerage !== null
                    ? `${schemeDetails.fOSegmentDeliveryBrokerage}%`
                    : "0.20%"}
                </td>
                <td>
                  {schemeDetails?.fOSegmentMinimumBrokerageInPaisa !== undefined && schemeDetails?.fOSegmentMinimumBrokerageInPaisa !== null
                    ? schemeDetails.fOSegmentMinimumBrokerageInPaisa
                    : "0"}
                </td>
                <td>
                  {schemeDetails?.fOSegmentOptionBrokerageInRs !== undefined && schemeDetails?.fOSegmentOptionBrokerageInRs !== null
                    ? schemeDetails.fOSegmentOptionBrokerageInRs
                    : "20"}
                </td>
              </tr>
            )}
            {checkedSegments.Commodities && (
              <tr>
                <td>MCX</td>
                <td>
                  {schemeDetails?.mCXNCDEXTradingBrokerage !== undefined && schemeDetails?.mCXNCDEXTradingBrokerage !== null
                    ? `${schemeDetails.mCXNCDEXTradingBrokerage}%`
                    : "0%"}
                </td>
                <td>
                  {schemeDetails?.mCXNCDEXDeliveryBrokerage !== undefined && schemeDetails?.mCXNCDEXDeliveryBrokerage !== null
                    ? `${schemeDetails.mCXNCDEXDeliveryBrokerage}%`
                    : "0.5%"}
                </td>
                <td>
                  {schemeDetails?.mCXNCDEXMinimumBrokerageInPaisa !== undefined && schemeDetails?.mCXNCDEXMinimumBrokerageInPaisa !== null
                    ? schemeDetails.mCXNCDEXMinimumBrokerageInPaisa
                    : "0.02"}
                </td>
                <td>
                  {schemeDetails?.mCXNCDEXOptionBrokerageInRs !== undefined && schemeDetails?.mCXNCDEXOptionBrokerageInRs !== null
                    ? schemeDetails.mCXNCDEXOptionBrokerageInRs
                    : "50"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {checkedSegments.Commodities && (
        <div className={styles.tableContainer}>
          <h2>Customer classification option:</h2>
          <div className={styles.radioGroup}>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                name="customerClassification"
                value="Others"
                checked={customerClassification === "Others"}
                onChange={handleCustomerClassificationChange}
              />
              <span>Others</span>
            </label>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                name="customerClassification"
                value="Farmer"
                checked={customerClassification === "Farmer"}
                onChange={handleCustomerClassificationChange}
              />
              <span>Farmer</span>
            </label>
          </div>
          {error && error.includes("customer classification") && (
            <div className={styles.errorMessage}>{error}</div>
          )}
        </div>
      )}

      <div className={styles.tableContainer}>
        <h2>View Tariff Sheet</h2>
        <a
          href={TariffSheet}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.tariffLink}
        >
          Download Tariff Sheet
        </a>
      </div>

      

      <div className={styles.buttonContainer}>
        <button
          className={styles.proceedButton}
          onClick={handleSubmit}
          disabled={isSubmitting || loading}
        >
          {isSubmitting ? "Submitting..." : "Proceed"}
        </button>
      </div>
    </>
  );
};

export default ExchangeSelection;