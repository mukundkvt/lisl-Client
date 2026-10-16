import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Profile.module.css";
import ProfileIcon from "../../assets/icons/KYCiconsSign.svg";
import clock from "../../assets/icons/ClockTimer.svg";
import RejectionBanner from "../RejectionBanner";
import { useKyc } from "../../context/KycContext";
import PanUploadSection from "./PanUploadSection";

const Profile = () => {
  const navigate = useNavigate();
  const { navigateToNextStep, refreshKycStatus, kycData } = useKyc();
  const [countdown, setCountdown] = useState(30);
  const [activeNomineeTab, setActiveNomineeTab] = useState(0);
  const [errors, setErrors] = useState({
    fatherName: "",
    motherName: "",
    networth: "",
    qualification: "",
    maritalStatus: "",
    nominee: "",
    income: "",
    occupation: "",
    tradingExperience: "",
    panFile: "",
  });
  const getCurrentFinancialYearEnd = () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1; // JavaScript months are 0-based

    // If current date is after March 31st, use next year's March 31st
    // Otherwise use current year's March 31st
    const year = currentMonth > 3 ? currentYear : currentYear - 1;

    return {
      day: "31",
      month: "03",
      year: year.toString(),
    };
  };
  const [formState, setFormState] = useState({
    selectedIncome: "",
    occupation: "",
    selectedTradingExperience: "",
    selectedDisSlipBook: "",
    selectedMaritalStatus: "",
    selectedQualification: "",
    selectedNominee: "",
    numberOfNominees: "1",
    investmentSource: "own-funds",
    runningAccountStatement: "quarterly",
    fatherName: "",
    motherName: "",
    networth: {
      amount: "",
      date: getCurrentFinancialYearEnd(),
    },
  });
  const [nomineeDetails, setNomineeDetails] = useState([
    {
      name: "",
      gender: "",
      relation: "",
      dob: { day: "", month: "", year: "" },
      sharePercentage: "100",
      guardian: {
        name: "",
        relation: "",
        identityType: "",
        identityNumber: "",
        mobile: "",
        email: "",
        address: {
          addressLine1: "",
          addressLine2: "",
          addressLine3: "",
          city: "",
          state: "",
          country: "",
          pincode: "",
        },
      },
      identityType: "",
      identityNumber: "",
      mobile: "",
      email: "",
      address: {
        addressLine1: "",
        addressLine2: "",
        addressLine3: "",
        city: "",
        state: "",
        country: "",
        pincode: "",
      },
    },
  ]);

  const [states] = useState([
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
  ]);

  const [districts, setDistricts] = useState({});
  const [clientAddress, setClientAddress] = useState(null);
  const [panFile, setPanFile] = useState(null);
  const [panSource, setPanSource] = useState(null);
  const [userPan, setUserPan] = useState("");
  const [userName, setUserName] = useState("");
  const [userKycType, setUserKycType] = useState(null);
  const [isPanLoading, setIsPanLoading] = useState(true);

  useEffect(() => {
    const fetchUserDetailsAndPan = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setIsPanLoading(false);
        return;
      }
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
        if (response.ok && data.success && data.data) {
          const userPanFile = data.data.PAN_file;
          if (userPanFile && String(userPanFile).trim() !== "") {
            setPanFile(userPanFile);
          } else {
            setPanFile(null);
          }
          if (data.data.pan_source) {
            setPanSource(data.data.pan_source);
          }
          if (data.data.PAN) {
            setUserPan(data.data.PAN);
          }
          if (data.data.name) {
            const rawName = data.data.name;
            const strName =
              typeof rawName === "string"
                ? rawName
                : rawName?.fullName ||
                  [rawName?.firstName, rawName?.middleName, rawName?.lastName]
                    .filter(Boolean)
                    .join(" ") ||
                  "";
            setUserName(strName);
          }
          if (data.data.kycType) {
            setUserKycType(data.data.kycType);
          }
        }
      } catch (err) {
        console.error("Error fetching user details for PAN check:", err);
      } finally {
        setIsPanLoading(false);
      }
    };
    fetchUserDetailsAndPan();
  }, []);

  useEffect(() => {
    if (kycData) {
      if (kycData.PAN_file && String(kycData.PAN_file).trim() !== "") {
        setPanFile(kycData.PAN_file);
      }
      if (kycData.pan_source) {
        setPanSource(kycData.pan_source);
      }
      if (kycData.PAN) {
        setUserPan(kycData.PAN);
      }
      if (kycData.name) {
        const rawName = kycData.name;
        const strName =
          typeof rawName === "string"
            ? rawName
            : rawName?.fullName ||
              [rawName?.firstName, rawName?.middleName, rawName?.lastName]
                .filter(Boolean)
                .join(" ") ||
              "";
        setUserName(strName);
      }
      if (kycData.kycType) {
        setUserKycType(kycData.kycType);
      }
      setIsPanLoading(false);
    }
  }, [kycData]);

  // If PAN came via DigiLocker, hide the upload section completely.
  // If manual upload (via profile page) or missing, show on profile page always.
  const isDigilocker =
    panSource === "digilocker" ||
    kycData?.pan_source === "digilocker" ||
    ((kycData?.kycType === "Digilocker" || userKycType === "Digilocker") &&
      panSource !== "manual" &&
      Boolean(panFile));

  const showPanUploadSection = !isDigilocker;

  useEffect(() => {
    const fetchClientAddress = async () => {
      const token = localStorage.getItem("authToken");
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/api/get_address`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await response.json();
        if (response.ok && data.success) {
          setClientAddress(data.data.address);
        }
      } catch (error) {
        console.error("Error fetching client address:", error);
      }
    };
    fetchClientAddress();
  }, []);

  const validateForm = () => {
    let isValid = true;
    const newErrors = {};

    // Validate father's first name
    if (!formState.fatherName.trim()) {
      newErrors.fatherName = "Father's name is required";
      isValid = false;
    }

    // Validate mother's first name
    if (!formState.motherName.trim()) {
      newErrors.motherName = "Mother's name is required";
      isValid = false;
    }

    // Validate networth
    if (!formState.networth?.amount || !String(formState.networth.amount).trim()) {
      newErrors.networth = "Networth amount is required";
      isValid = false;
    }

    // Validate qualification
    if (!formState.selectedQualification) {
      newErrors.qualification = "Qualification is required";
      isValid = false;
    }

    // Validate marital status
    if (!formState.selectedMaritalStatus) {
      newErrors.maritalStatus = "Marital status is required";
      isValid = false;
    }

    // Validate nominee
    if (!formState.selectedNominee) {
      newErrors.nominee = "Please select nominee preference";
      isValid = false;
    }

    // Validate nominee details if 'yes' is selected
    if (formState.selectedNominee === "yes") {
      const nomineeValidation = nomineeDetails.every((nominee) => {
        const baseValidation =
          nominee.name &&
          nominee.relation &&
          nominee.gender &&
          nominee.dob.day &&
          nominee.dob.month &&
          nominee.dob.year &&
          nominee.email &&
          nominee.mobile &&
          /^\d{10}$/.test(nominee.mobile) &&
          nominee.address.addressLine1 &&
          nominee.address.state &&
          nominee.address.city &&
          nominee.address.pincode;

        // If nominee is a minor, validate guardian fields
        const age = calculateAge(nominee.dob);
        if (age !== null && age < 18) {
          return (
            baseValidation &&
            nominee.guardian.name &&
            nominee.guardian.relation &&
            nominee.guardian.identityType &&
            nominee.guardian.identityNumber &&
            nominee.guardian.mobile &&
            /^\d{10}$/.test(nominee.guardian.mobile) &&
            nominee.guardian.email &&
            nominee.guardian.address.addressLine1 &&
            nominee.guardian.address.state &&
            nominee.guardian.address.city &&
            nominee.guardian.address.pincode
          );
        }

        return baseValidation;
      });
      if (!nomineeValidation) {
        newErrors.nomineeDetails = "All nominee details are required";
        isValid = false;
      }
    }

    // Validate income
    if (!formState.selectedIncome) {
      newErrors.income = "Annual income is required";
      isValid = false;
    }

    // Validate occupation
    if (!formState.occupation) {
      newErrors.occupation = "Occupation is required";
      isValid = false;
    }

    // Validate trading experience
    if (!formState.selectedTradingExperience) {
      newErrors.tradingExperience = "Trading experience is required";
      isValid = false;
    }

    // Validate PAN file upload if manual upload / profile page upload is required
    if (showPanUploadSection && (!panFile || String(panFile).trim() === "")) {
      newErrors.panFile = "PAN document is required. Please upload your PAN card copy.";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      const token = localStorage.getItem("authToken");
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/api/submit_profile`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              ...formState,
              networth: {
                amount: formState.networth.amount,
                date: {
                  day: formState.networth.date.day || "31",
                  month: formState.networth.date.month || "03",
                  year:
                    formState.networth.date.year ||
                    getCurrentFinancialYearEnd().year,
                },
              },
              nomineeDetails:
                formState.selectedNominee === "yes"
                  ? nomineeDetails.map((nominee) => {
                      const age = calculateAge(nominee.dob);
                      if (age !== null && age >= 18) {
                        const { guardian, ...rest } = nominee;
                        return rest;
                      }
                      return nominee;
                    })
                  : [],
            }),
          },
        );

        if (response.ok) {
          refreshKycStatus();
          navigateToNextStep("/profile");
        } else {
          const data = await response.json();
          throw new Error(data.message || "Failed to submit profile");
        }
      } catch (error) {
        console.error("Error submitting profile:", error);
        setErrors((prev) => ({
          ...prev,
          submit:
            error.message || "Failed to submit profile. Please try again.",
        }));
      }
    }
  };

  const calculateAge = (dob) => {
    if (!dob.day || !dob.month || !dob.year) return null;
    const birthDate = new Date(dob.year, dob.month - 1, dob.day);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  const validateSharePercentage = () => {
    const totalShare = nomineeDetails.reduce((sum, nominee) => {
      return sum + (parseFloat(nominee.sharePercentage) || 0);
    }, 0);
    return totalShare <= 100;
  };

  const handleNomineeChange = (index, field, value) => {
    const newNominees = [...nomineeDetails];

    // Mobile number validation
    if (field === "mobile" || field === "guardian.mobile") {
      if (value !== "" && (!/^\d+$/.test(value) || value.length > 10)) {
        return;
      }
    }

    // Aadhaar special rule
    if (field === "identityNumber") {
      const newNominees = [...nomineeDetails];

      if (newNominees[index].identityType === "Aadhaar") {
        // only last 4 digits allowed
        if (/^\d{0,4}$/.test(value)) {
          newNominees[index].identityNumber = value;
          setNomineeDetails(newNominees);
        }
      } else {
        newNominees[index].identityNumber = value;
        setNomineeDetails(newNominees);
      }
      return;
    }

    // Auto-rebalance share percentage
    if (field === "sharePercentage") {
      const totalNominees = newNominees.length;

      // Ensure value is a valid number between 0 and 100
      let newValue = parseFloat(value) || 0;
      newValue = Math.max(0, Math.min(100, newValue)); // Clamp between 0-100

      newNominees[index].sharePercentage = newValue.toString();

      // Calculate remaining share to distribute among other nominees
      const remainingShare = 100 - newValue;
      const otherNomineesCount = totalNominees - 1;

      if (otherNomineesCount > 0) {
        // Distribute remaining share equally among others
        const sharePerOther = remainingShare / otherNomineesCount;

        newNominees.forEach((nominee, i) => {
          if (i !== index) {
            // Round to 2 decimal places for precision
            nominee.sharePercentage = sharePerOther.toFixed(2);
          }
        });

        // Handle rounding issues - adjust the last nominee to ensure total = 100
        const totalCalculated = newNominees.reduce(
          (sum, nominee) => sum + parseFloat(nominee.sharePercentage),
          0,
        );

        const difference = 100 - totalCalculated;
        if (Math.abs(difference) > 0.01) {
          // Find the last nominee that's not the current one
          for (let i = totalNominees - 1; i >= 0; i--) {
            if (i !== index) {
              const currentShare = parseFloat(newNominees[i].sharePercentage);
              newNominees[i].sharePercentage = (
                currentShare + difference
              ).toFixed(2);
              break;
            }
          }
        }
      }

      setNomineeDetails(newNominees);
      return;
    }

    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      newNominees[index][parent][child] = value;
    } else {
      newNominees[index][field] = value;
    }

    setNomineeDetails(newNominees);
  };

  const fetchDistricts = async (stateValue) => {
    if (!stateValue) return [];
    if (districts[stateValue]) return districts[stateValue];
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/get_districts/${stateValue}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await res.json();
      if (res.ok) {
        setDistricts((prev) => ({
          ...prev,
          [stateValue]: data,
        }));
        return data;
      }
      return [];
    } catch (err) {
      console.error("Failed to fetch districts");
      return [];
    }
  };

  const handleNomineeStateChange = async (index, stateValue) => {
    const newNominees = [...nomineeDetails];
    newNominees[index].address.state = stateValue;
    newNominees[index].address.city = "";
    newNominees[index].address.country = "India";

    setNomineeDetails(newNominees);
    await fetchDistricts(stateValue);
  };

  const handleGuardianStateChange = async (index, stateValue) => {
    const newNominees = [...nomineeDetails];
    if (typeof newNominees[index].guardian.address !== "object") {
      newNominees[index].guardian.address = {};
    }
    newNominees[index].guardian.address.state = stateValue;
    newNominees[index].guardian.address.city = "";
    newNominees[index].guardian.address.country = "India";

    setNomineeDetails(newNominees);
    await fetchDistricts(stateValue);
  };

  const handleCopyClientAddress = async (index, type, isChecked) => {
    console.log("handleCopyClientAddress called", {
      index,
      type,
      isChecked,
      clientAddress,
    });
    if (!clientAddress) return;

    // Find matching state from states array to handle case sensitivity
    const matchingState = clientAddress.state
      ? states.find(
          (s) => s.toLowerCase() === clientAddress.state.toLowerCase()
        ) || clientAddress.state
      : "";

    let availableDistricts = [];
    if (isChecked && matchingState) {
      availableDistricts = await fetchDistricts(matchingState);
    }

    const clientCity = clientAddress.city || "";
    const matchingCity =
      availableDistricts.find(
        (d) => d.toLowerCase() === clientCity.toLowerCase()
      ) || clientCity;

    const newNominees = [...nomineeDetails];

    const addressToCopy = isChecked
      ? {
          addressLine1: clientAddress.addressLine1 || "",
          addressLine2: clientAddress.addressLine2 || "",
          addressLine3: clientAddress.addressLine3 || "",
          city: matchingCity,
          state: matchingState,
          country: clientAddress.country || "India",
          pincode: clientAddress.pincode || "",
        }
      : {
          addressLine1: "",
          addressLine2: "",
          addressLine3: "",
          city: "",
          state: "",
          country: "",
          pincode: "",
        };

    if (type === "nominee") {
      newNominees[index].address = addressToCopy;
    } else if (type === "guardian") {
      if (!newNominees[index].guardian) {
        newNominees[index].guardian = { address: {} };
      }
      if (typeof newNominees[index].guardian.address !== "object") {
        newNominees[index].guardian.address = {};
      }
      newNominees[index].guardian.address = addressToCopy;
    }

    setNomineeDetails(newNominees);
  };

  const handleNumberOfNomineesChange = (event) => {
    const count = parseInt(event.target.value);
    setFormState((prev) => ({ ...prev, numberOfNominees: count }));
    setActiveNomineeTab(0); // Reset to first tab

    // Calculate share percentages
    let sharePercentages;
    if (count === 1) {
      sharePercentages = ["100"];
    } else if (count === 2) {
      sharePercentages = ["50", "50"];
    } else if (count === 3) {
      sharePercentages = ["33", "33", "34"];
    }

    if (count > nomineeDetails.length) {
      // Add new nominees with calculated share percentages
      setNomineeDetails((prev) => [
        ...prev.map((nominee, index) => ({
          ...nominee,
          sharePercentage: sharePercentages[index] || "0",
        })),
        ...Array(count - prev.length)
          .fill(null)
          .map((_, index) => ({
            name: "",
            gender: "",
            relation: "",
            dob: { day: "", month: "", year: "" },
            sharePercentage: sharePercentages[prev.length + index] || "0",
            guardian: {
              name: "",
              relation: "",
              identityType: "",
              identityNumber: "",
              mobile: "",
              email: "",
              address: {
                addressLine1: "",
                addressLine2: "",
                addressLine3: "",
                city: "",
                state: "",
                country: "",
                pincode: "",
              },
            },
            identityType: "",
            identityNumber: "",
            mobile: "",
            email: "",
            address: {
              addressLine1: "",
              addressLine2: "",
              addressLine3: "",
              city: "",
              state: "",
              country: "",
              pincode: "",
            },
          })),
      ]);
    } else {
      // Remove excess nominees and redistribute shares
      setNomineeDetails((prev) =>
        prev.slice(0, count).map((nominee, index) => ({
          ...nominee,
          sharePercentage: sharePercentages[index] || "0",
        })),
      );
    }
  };

  const handleInputChange = (field, value) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // const handleMotherNameChange = (field, value) => {
  //   setFormState((prev) => ({
  //     ...prev,
  //     motherName: {
  //       ...prev.motherName,
  //       [field]: value,
  //     },
  //   }));
  // };

  // const handleFatherNameChange = (field, value) => {
  //   setFormState((prev) => ({
  //     ...prev,
  //     fatherName: {
  //       ...prev.fatherName,
  //       [field]: value,
  //     },
  //   }));
  // };

  const handleNetworthChange = (field, value) => {
    if (field === "amount") {
      // Only allow numbers
      if (value === "" || /^\d+$/.test(value)) {
        setFormState((prev) => ({
          ...prev,
          networth: {
            ...prev.networth,
            amount: value,
          },
        }));
      }
    } else {
      const [dateField, dateValue] = field.split(".");
      // Validate input based on field type
      let isValid = false;
      let newValue = value;

      switch (dateValue) {
        case "day":
          isValid =
            /^\d{0,2}$/.test(value) &&
            (value === "" || (parseInt(value) >= 1 && parseInt(value) <= 31));
          break;
        case "month":
          isValid =
            /^\d{0,2}$/.test(value) &&
            (value === "" || (parseInt(value) >= 1 && parseInt(value) <= 12));
          break;
        case "year":
          isValid =
            /^\d{0,4}$/.test(value) &&
            (value === "" || parseInt(value) <= new Date().getFullYear());
          break;
        default:
          isValid = false;
      }

      if (isValid) {
        setFormState((prev) => ({
          ...prev,
          networth: {
            ...prev.networth,
            date: {
              ...prev.networth.date,
              [dateValue]: value,
            },
          },
        }));
      }
    }
  };

  useEffect(() => {
    if (formState.selectedNominee === "yes") {
      const count = parseInt(formState.numberOfNominees);
      let sharePercentages;
      setActiveNomineeTab(0); // Reset to first tab when nominee selection changes

      if (count === 1) {
        sharePercentages = ["100"];
      } else if (count === 2) {
        sharePercentages = ["50", "50"];
      } else if (count === 3) {
        sharePercentages = ["33", "33", "34"];
      }

      // Initialize nominee details array with the correct number of entries
      const newNomineeDetails = Array(count)
        .fill(null)
        .map((_, index) => ({
          name: "",
          gender: "",
          relation: "",
          dob: { day: "", month: "", year: "" },
          sharePercentage: sharePercentages[index] || "0",
          guardian: {
            name: "",
            relation: "",
            identityType: "",
            identityNumber: "",
            mobile: "",
            email: "",
            address: {
              addressLine1: "",
              addressLine2: "",
              addressLine3: "",
              city: "",
              state: "",
              country: "",
              pincode: "",
            },
          },
          identityType: "",
          identityNumber: "",
          mobile: "",
          email: "",
          address: {
            addressLine1: "",
            addressLine2: "",
            addressLine3: "",
            city: "",
            state: "",
            country: "",
            pincode: "",
          },
        }));

      // Preserve existing nominee details when available
      if (nomineeDetails.length > 0) {
        for (let i = 0; i < newNomineeDetails.length; i++) {
          if (i < nomineeDetails.length && nomineeDetails[i]) {
            newNomineeDetails[i] = {
              ...newNomineeDetails[i],
              ...nomineeDetails[i],
              sharePercentage: sharePercentages[i] || "0",
            };
          }
        }
      }

      setNomineeDetails(newNomineeDetails);
    } else if (formState.selectedNominee === "no") {
      // Always initialize with a default empty nominee even when 'no' is selected
      // This ensures we have a nominee structure ready if user changes to 'yes'
      setNomineeDetails([
        {
          name: "",
          gender: "",
          relation: "",
          dob: { day: "", month: "", year: "" },
          sharePercentage: "100",
          guardian: {
            name: "",
            relation: "",
            identityType: "",
            identityNumber: "",
            mobile: "",
            email: "",
            address: {
              addressLine1: "",
              addressLine2: "",
              addressLine3: "",
              city: "",
              state: "",
              country: "",
              pincode: "",
            },
          },
          identityType: "",
          identityNumber: "",
          mobile: "",
          email: "",
          address: {
            addressLine1: "",
            addressLine2: "",
            addressLine3: "",
            city: "",
            state: "",
            country: "",
            pincode: "",
          },
        },
      ]);
    }
  }, [formState.selectedNominee, formState.numberOfNominees]);

  useEffect(() => {
    const fetchProfileData = async () => {
      const token = localStorage.getItem("authToken");
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/api/get_profile`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        const data = await response.json();
        if (response.ok && data.success) {
          const profileData = data.data;
          const hasNominees =
            profileData.nominees && profileData.nominees.length > 0;
          const nomineeValue = hasNominees ? "yes" : "no";
          const nomineesCount = hasNominees
            ? profileData.nominees.length.toString()
            : "1";

          setFormState((prevState) => ({
            ...prevState,
            selectedIncome: profileData.annualIncome || "",
            occupation: profileData.occupation || "",
            selectedTradingExperience: profileData.tradingExperience || "",
            selectedDisSlipBook: profileData.disSlipBookRequired || false,
            selectedMaritalStatus: profileData.maritalStatus || "",
            selectedQualification: profileData.qualification || "",
            selectedNominee: nomineeValue,
            numberOfNominees: nomineesCount,
            investmentSource: profileData.investmentSource || "own-funds",
            runningAccountStatement:
              profileData.runningAccountStatement?.frequency || "quarterly",
            fatherName:
              typeof profileData.fatherName === "object" &&
              profileData.fatherName !== null
                ? profileData.fatherName.fullName || ""
                : profileData.fatherName || "",

            motherName:
              typeof profileData.motherName === "object" &&
              profileData.motherName !== null
                ? profileData.motherName.fullName || ""
                : profileData.motherName || "",

            networth: profileData.networth || {
              amount: "",
              date: getCurrentFinancialYearEnd(),
            },
          }));

          if (hasNominees) {
            const sanitizedNominees = profileData.nominees.map((nominee) => ({
              ...nominee,
              address:
                typeof nominee.address === "object" && nominee.address !== null
                  ? nominee.address
                  : {
                      addressLine1: "",
                      addressLine2: "",
                      addressLine3: "",
                      city: "",
                      state: "",
                      country: "",
                      pincode: "",
                    },
              guardian: {
                name: nominee.guardian?.name || "",
                relation: nominee.guardian?.relation || "",
                identityType: nominee.guardian?.identityType || "",
                identityNumber: nominee.guardian?.identityNumber || "",
                mobile: nominee.guardian?.mobile || "",
                email: nominee.guardian?.email || "",
                address:
                  typeof nominee.guardian?.address === "object" &&
                  nominee.guardian?.address !== null
                    ? nominee.guardian.address
                    : {
                        addressLine1: "",
                        addressLine2: "",
                        addressLine3: "",
                        city: "",
                        state: "",
                        country: "",
                        pincode: "",
                      },
              },
            }));

            // Pre-fetch districts for all nominees and guardians
            const statesToFetch = new Set();
            sanitizedNominees.forEach((nominee) => {
              if (nominee.address?.state) {
                statesToFetch.add(nominee.address.state);
              }
              if (nominee.guardian?.address?.state) {
                statesToFetch.add(nominee.guardian.address.state);
              }
            });

            for (const state of statesToFetch) {
              await fetchDistricts(state);
            }

            setNomineeDetails(sanitizedNominees);
          } else {
            // Initialize with default empty nominee when no nominees from API
            const defaultNominee = {
              name: "",
              gender: "",
              relation: "",
              dob: { day: "", month: "", year: "" },
              sharePercentage: "100",
              guardian: {
                name: "",
                relation: "",
                identityType: "",
                identityNumber: "",
                mobile: "",
                email: "",
                address: {
                  addressLine1: "",
                  addressLine2: "",
                  addressLine3: "",
                  city: "",
                  state: "",
                  country: "",
                  pincode: "",
                },
              },
            };
            setNomineeDetails([defaultNominee]);
          }
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
      }
    };

    fetchProfileData();
  }, []);

  const incomeRanges = [
    { id: "below1lakh", label: "Below 1 lakh" },
    { id: "oneToFiveLakhs", label: "1-5 lakhs" },
    { id: "fiveToTenLakhs", label: "5-10 lakhs" },
    { id: "tenToTwentyFiveLakhs", label: "10-25 lakhs" },
    { id: "aboveTwentyFiveLakhs", label: "> 25 lakhs" },
  ];

  const qualifications = [
    { id: "diploma", label: "Diploma" },
    { id: "bachelor", label: "Bachelor / Graduate" },
    { id: "master", label: "Master" },
    { id: "phd", label: "PhD" },
  ];

  const nominees = [
    { id: "yes", label: "Yes" },
    { id: "no", label: "No" },
  ];

  const maritalStatusOptions = [
    { id: "married", label: "Married" },
    { id: "unmarried", label: "Unmarried" },
  ];

  const occupations = [
    { id: "privateSector", label: "Private Sector" },
    { id: "publicSector", label: "Public Sector" },
    { id: "business", label: "Business" },
    { id: "professional", label: "Professional" },
    { id: "agriculturist", label: "Agriculturist" },
    { id: "retired", label: "Retired" },
    { id: "houseWife", label: "House Wife" },
    { id: "student", label: "Student" },
    { id: "governmentService", label: "Government Service" },
    // { id: "others", label: "Others" },
  ];

  const tradingExperience = [
    { id: "1-5-years", label: "1-5 Years" },
    { id: "greater-than-5-years", label: "> 5 Years" },
    { id: "nil", label: "Nil" },
  ];

  const relations = [
    "Spouse",
    "Son",
    "Daughter",
    "Father",
    "Mother",
    "Brother",
    "Sister",
    "Grand Son",
    "Grand Daughter",
    "Grand Father",
    "Grand Mother",
  ];

  const handleCheckboxChange = (event) => {
    const { id, name } = event.target;
    setFormState((prevState) => ({
      ...prevState,
      [name]: id,
    }));
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev === 0 ? 30 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={styles.MainContainer}>
      <div className={styles.MainWrapper}>
        <RejectionBanner section="profile" />
        <div className={styles.topDiv}>
          <img
            src={ProfileIcon}
            alt="Profile Icon"
            className={styles.topIcon}
          />
          <div className={styles.topText}>
            Profile & Declaration For Account
          </div>
          <div className={styles.topClockDiv}>
            <img src={clock} alt="Clock Icon" className={styles.clockIcon} />
            <div className={styles.clockText}>
              This takes less than {countdown} seconds.
            </div>
          </div>
        </div>

        <p className={styles.PageText}>Please Select Applicable Options</p>

        <div className={styles.FormContainer}>
          <div className={styles.parentRow}>
            {/* Father Name */}
            <div className={styles.parentField}>
              <div className={styles.FormText}>
                Father's Name{" "}
                <span className={styles.mandatoryAsterisk}>*</span>
              </div>
              <input
                type="text"
                placeholder="Enter Father's Full Name"
                value={formState.fatherName}
                onChange={(e) =>
                  handleInputChange("fatherName", e.target.value)
                }
                className={styles.nomineeDetailsInput}
              />
              {errors.fatherName && (
                <div className={styles.errorText}>{errors.fatherName}</div>
              )}
            </div>

            {/* Mother Name */}
            <div className={styles.parentField}>
              <div className={styles.FormText}>
                Mother's Name{" "}
                <span className={styles.mandatoryAsterisk}>*</span>
              </div>
              <input
                type="text"
                placeholder="Enter Mother's Full Name"
                value={formState.motherName}
                onChange={(e) =>
                  handleInputChange("motherName", e.target.value)
                }
                className={styles.nomineeDetailsInput}
              />
              {errors.motherName && (
                <div className={styles.errorText}>{errors.motherName}</div>
              )}
            </div>
          </div>

          <div className={styles.networthSection}>
            <div className={styles.FormText}>
              Networth as on{" "}
              <span className={styles.mandatoryAsterisk}>*</span>
            </div>
            <div className={styles.networthFields}>
              <input
                type="text"
                inputMode="numeric"
                pattern="\d*"
                placeholder="Networth"
                value={formState.networth.amount}
                onChange={(e) => handleNetworthChange("amount", e.target.value)}
                className={`${styles.nomineeDetailsInput} ${styles.hideNumberSpinner}`}
              />
              <div className={styles.dateFields}>
                <input
                  type="text"
                  placeholder="DD"
                  maxLength="2"
                  value={formState.networth.date.day}
                  onChange={(e) =>
                    handleNetworthChange("date.day", e.target.value)
                  }
                  className={styles.nomineeDetailsInput}
                />
                <input
                  type="text"
                  placeholder="MM"
                  maxLength="2"
                  value={formState.networth.date.month}
                  onChange={(e) =>
                    handleNetworthChange("date.month", e.target.value)
                  }
                  className={styles.nomineeDetailsInput}
                />
                <input
                  type="text"
                  placeholder="YYYY"
                  maxLength="4"
                  value={formState.networth.date.year}
                  onChange={(e) =>
                    handleNetworthChange("date.year", e.target.value)
                  }
                  className={styles.nomineeDetailsInput}
                />
              </div>
            </div>
            {errors.networth && (
              <div className={styles.errorText}>{errors.networth}</div>
            )}
          </div>

          {/* Qualification */}
          <div>
            <Section
              label={
                <>
                  Qualification{" "}
                  <span className={styles.mandatoryAsterisk}>*</span>
                </>
              }
              options={qualifications}
              name="selectedQualification"
              formState={formState}
              handleCheckboxChange={handleCheckboxChange}
            />
            {errors.qualification && (
              <div className={styles.errorText}>{errors.qualification}</div>
            )}
          </div>

          {/* Marital Status */}
          <div>
            <Section
              label={
                <>
                  Marital Status{" "}
                  <span className={styles.mandatoryAsterisk}>*</span>
                </>
              }
              options={maritalStatusOptions}
              name="selectedMaritalStatus"
              formState={formState}
              handleCheckboxChange={handleCheckboxChange}
            />
            {errors.maritalStatus && (
              <div className={styles.errorText}>{errors.maritalStatus}</div>
            )}
          </div>

          {/* Nominee */}
          <div>
            <Section
              label={
                <>
                  Do you wish to nominate?{" "}
                  <span className={styles.mandatoryAsterisk}>*</span>
                </>
              }
              options={nominees}
              name="selectedNominee"
              formState={formState}
              handleCheckboxChange={handleCheckboxChange}
            />
            {errors.nominee && (
              <div className={styles.errorText}>{errors.nominee}</div>
            )}
          </div>

          {formState.selectedNominee === "yes" && (
            <div className={styles.nomineeSection}>
              <div className={styles.nomineeHeader}>
                <div className={styles.FormText}>Number of Nominees</div>
                <select
                  className={styles.customDropdown}
                  value={formState.numberOfNominees}
                  onChange={handleNumberOfNomineesChange}
                >
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                </select>
              </div>

              {/* Nominee Tabs */}
              <div className={styles.nomineeTabs}>
                {nomineeDetails.map((_, index) => (
                  <button
                    key={index}
                    className={`${styles.nomineeTab} ${
                      activeNomineeTab === index ? styles.active : ""
                    }`}
                    onClick={() => setActiveNomineeTab(index)}
                  >
                    Nominee {index + 1}
                  </button>
                ))}
              </div>

              {/* Nominee Details - Tab Content */}
              <div className={styles.nomineeTabContent}>
                {nomineeDetails[activeNomineeTab] && (
                  <div className={styles.nomineeCard}>
                    <div className={styles.nomineeCardBody}>
                      <div className={styles.nomineeRow}>
                        <div className={styles.nomineeField}>
                          <label>
                            Name{" "}
                            <span className={styles.mandatoryAsterisk}>*</span>
                          </label>

                          <input
                            type="text"
                            value={nomineeDetails[activeNomineeTab].name}
                            onChange={(e) =>
                              handleNomineeChange(
                                activeNomineeTab,
                                "name",
                                e.target.value,
                              )
                            }
                            className={styles.nomineeInput}
                            placeholder="Full Name"
                          />
                        </div>
                      </div>

                      <div className={styles.nomineeRow}>
                        <div className={styles.nomineeField}>
                          <label>
                            Relation{" "}
                            <span className={styles.mandatoryAsterisk}>*</span>
                          </label>
                          <select
                            className={styles.nomineeSelect}
                            value={nomineeDetails[activeNomineeTab].relation}
                            onChange={(e) =>
                              handleNomineeChange(
                                activeNomineeTab,
                                "relation",
                                e.target.value,
                              )
                            }
                          >
                            <option value="">Select Relation</option>
                            {relations.map((relation) => (
                              <option key={relation} value={relation}>
                                {relation}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className={styles.nomineeField}>
                          <label>
                            Gender{" "}
                            <span className={styles.mandatoryAsterisk}>*</span>
                          </label>
                          <select
                            className={styles.nomineeSelect}
                            value={nomineeDetails[activeNomineeTab].gender}
                            onChange={(e) =>
                              handleNomineeChange(
                                activeNomineeTab,
                                "gender",
                                e.target.value,
                              )
                            }
                          >
                            <option value="">Select</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                      </div>

                      <div className={styles.nomineeRow}>
                        <div
                          className={styles.nomineeField}
                          style={{ width: "50%" }}
                        >
                          <label>
                            Date of Birth{" "}
                            <span className={styles.mandatoryAsterisk}>*</span>
                            {calculateAge(
                              nomineeDetails[activeNomineeTab].dob,
                            ) !== null &&
                              calculateAge(
                                nomineeDetails[activeNomineeTab].dob,
                              ) < 18 && (
                                <span className={styles.minorBadge}>
                                  Minor – Guardian required
                                </span>
                              )}
                          </label>
                          <div className={styles.dobGroup}>
                            <input
                              type="text"
                              placeholder="DD"
                              maxLength="2"
                              value={nomineeDetails[activeNomineeTab].dob.day}
                              onChange={(e) => {
                                const value = e.target.value;
                                // Only allow numbers
                                if (value === "" || /^\d+$/.test(value)) {
                                  handleNomineeChange(
                                    activeNomineeTab,
                                    "dob.day",
                                    value,
                                  );
                                  // Auto-focus to month field when day is filled
                                  if (value.length === 2) {
                                    const monthInput =
                                      e.target.nextElementSibling;
                                    if (monthInput) monthInput.focus();
                                  }
                                }
                              }}
                              onKeyDown={(e) => {
                                // Handle backspace when day field is empty
                                if (
                                  e.key === "Backspace" &&
                                  e.target.value === ""
                                ) {
                                  // Focus stays on day field as it's the first field
                                }
                              }}
                              className={styles.dobInput}
                            />
                            <input
                              type="text"
                              placeholder="MM"
                              maxLength="2"
                              value={nomineeDetails[activeNomineeTab].dob.month}
                              onChange={(e) => {
                                const value = e.target.value;
                                // Only allow numbers
                                if (value === "" || /^\d+$/.test(value)) {
                                  handleNomineeChange(
                                    activeNomineeTab,
                                    "dob.month",
                                    value,
                                  );
                                  // Auto-focus to year field when month is filled
                                  if (value.length === 2) {
                                    const yearInput =
                                      e.target.nextElementSibling;
                                    if (yearInput) yearInput.focus();
                                  }
                                }
                              }}
                              onKeyDown={(e) => {
                                // Handle backspace when month field is empty
                                if (
                                  e.key === "Backspace" &&
                                  e.target.value === ""
                                ) {
                                  const dayInput =
                                    e.target.previousElementSibling;
                                  if (dayInput) dayInput.focus();
                                }
                              }}
                              className={styles.dobInput}
                            />
                            <input
                              type="text"
                              placeholder="YYYY"
                              maxLength="4"
                              value={nomineeDetails[activeNomineeTab].dob.year}
                              onChange={(e) => {
                                const value = e.target.value;
                                // Only allow numbers
                                if (value === "" || /^\d+$/.test(value)) {
                                  handleNomineeChange(
                                    activeNomineeTab,
                                    "dob.year",
                                    value,
                                  );
                                }
                              }}
                              onKeyDown={(e) => {
                                // Handle backspace when year field is empty
                                if (
                                  e.key === "Backspace" &&
                                  e.target.value === ""
                                ) {
                                  const monthInput =
                                    e.target.previousElementSibling;
                                  if (monthInput) monthInput.focus();
                                }
                              }}
                              className={styles.dobInput}
                            />
                          </div>
                        </div>

                        <div
                          className={styles.nomineeField}
                          style={{ width: "50%" }}
                        >
                          <label>Share %</label>
                          <div className={styles.shareField}>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={
                                nomineeDetails[activeNomineeTab].sharePercentage
                              }
                              onChange={(e) =>
                                handleNomineeChange(
                                  activeNomineeTab,
                                  "sharePercentage",
                                  e.target.value,
                                )
                              }
                              className={styles.shareSlider}
                            />
                            <span className={styles.shareValue}>
                              {nomineeDetails[activeNomineeTab].sharePercentage}
                              %
                            </span>
                          </div>
                        </div>
                      </div>
                      {calculateAge(nomineeDetails[activeNomineeTab].dob) <
                        18 &&
                        calculateAge(nomineeDetails[activeNomineeTab].dob) !==
                          null && (
                          <div className={styles.guardianSection}>
                            <h4 className={styles.guardianSectionTitle}>
                              Guardian Details (Mandatory)
                            </h4>

                            {/* Guardian Name and Relation */}
                            <div className={styles.nomineeRow}>
                              <div className={styles.nomineeField}>
                                <label>
                                  Name{" "}
                                  <span className={styles.mandatoryAsterisk}>
                                    *
                                  </span>
                                </label>
                                <input
                                  type="text"
                                  value={
                                    nomineeDetails[activeNomineeTab].guardian
                                      .name
                                  }
                                  onChange={(e) =>
                                    handleNomineeChange(
                                      activeNomineeTab,
                                      "guardian.name",
                                      e.target.value,
                                    )
                                  }
                                  className={styles.nomineeInput}
                                  placeholder="Guardian's Full Name"
                                />
                              </div>

                              <div className={styles.nomineeField}>
                                <label>
                                  Relation{" "}
                                  <span className={styles.mandatoryAsterisk}>
                                    *
                                  </span>
                                </label>
                                <select
                                  className={styles.nomineeSelect}
                                  value={
                                    nomineeDetails[activeNomineeTab].guardian
                                      .relation
                                  }
                                  onChange={(e) =>
                                    handleNomineeChange(
                                      activeNomineeTab,
                                      "guardian.relation",
                                      e.target.value,
                                    )
                                  }
                                >
                                  <option value="">Select Relation</option>
                                  {relations.map((relation) => (
                                    <option key={relation} value={relation}>
                                      {relation}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {/* Guardian Identity Type and Number */}
                            <div className={styles.nomineeRow}>
                              <div className={styles.nomineeField}>
                                <label>
                                  Identity Type{" "}
                                  <span className={styles.mandatoryAsterisk}>
                                    *
                                  </span>
                                </label>
                                <select
                                  value={
                                    nomineeDetails[activeNomineeTab].guardian
                                      .identityType
                                  }
                                  onChange={(e) =>
                                    handleNomineeChange(
                                      activeNomineeTab,
                                      "guardian.identityType",
                                      e.target.value,
                                    )
                                  }
                                  className={styles.nomineeSelect}
                                >
                                  <option value="">Select</option>
                                  <option value="PAN">PAN</option>
                                  <option value="Aadhaar">Aadhaar</option>
                                  <option value="Driving License">
                                    Driving License
                                  </option>
                                  <option value="Passport">Passport</option>
                                </select>
                              </div>

                              <div className={styles.nomineeField}>
                                <label>
                                  {nomineeDetails[activeNomineeTab].guardian
                                    .identityType === "Aadhaar"
                                    ? "Aadhaar (Last 4 Digits)"
                                    : "Identity Number"}{" "}
                                  <span className={styles.mandatoryAsterisk}>
                                    *
                                  </span>
                                </label>
                                <input
                                  type="text"
                                  value={
                                    nomineeDetails[activeNomineeTab].guardian
                                      .identityNumber
                                  }
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    // Aadhaar special rule
                                    if (
                                      nomineeDetails[activeNomineeTab].guardian
                                        .identityType === "Aadhaar"
                                    ) {
                                      if (/^\d{0,4}$/.test(value)) {
                                        handleNomineeChange(
                                          activeNomineeTab,
                                          "guardian.identityNumber",
                                          value,
                                        );
                                      }
                                    } else {
                                      handleNomineeChange(
                                        activeNomineeTab,
                                        "guardian.identityNumber",
                                        value,
                                      );
                                    }
                                  }}
                                  maxLength={
                                    nomineeDetails[activeNomineeTab].guardian
                                      .identityType === "Aadhaar"
                                      ? 4
                                      : undefined
                                  }
                                  placeholder={
                                    nomineeDetails[activeNomineeTab].guardian
                                      .identityType === "Aadhaar"
                                      ? "XXXX"
                                      : "Enter ID Number"
                                  }
                                  className={styles.nomineeInput}
                                />
                              </div>
                            </div>

                            {/* Guardian Mobile and Email */}
                            <div className={styles.nomineeRow}>
                              <div className={styles.nomineeField}>
                                <label>
                                  Mobile{" "}
                                  <span className={styles.mandatoryAsterisk}>
                                    *
                                  </span>
                                </label>
                                <input
                                  type="text"
                                  value={
                                    nomineeDetails[activeNomineeTab].guardian
                                      .mobile
                                  }
                                  onChange={(e) =>
                                    handleNomineeChange(
                                      activeNomineeTab,
                                      "guardian.mobile",
                                      e.target.value,
                                    )
                                  }
                                  maxLength="10"
                                  className={styles.nomineeInput}
                                  placeholder="Mobile Number"
                                />
                              </div>

                              <div className={styles.nomineeField}>
                                <label>
                                  Email{" "}
                                  <span className={styles.mandatoryAsterisk}>
                                    *
                                  </span>
                                </label>
                                <input
                                  type="email"
                                  value={
                                    nomineeDetails[activeNomineeTab].guardian
                                      .email
                                  }
                                  onChange={(e) =>
                                    handleNomineeChange(
                                      activeNomineeTab,
                                      "guardian.email",
                                      e.target.value,
                                    )
                                  }
                                  className={styles.nomineeInput}
                                  placeholder="Email Address"
                                />
                              </div>
                            </div>

                            {/* Guardian Address Line 1 */}
                            <div className={styles.nomineeRow}>
                              <div className={styles.nomineeField}>
                                <label className={styles.addressLabel}>
                                  Address Line 1{" "}
                                  <span className={styles.mandatoryAsterisk}>*</span>
                                  <span className={styles.addressMeta}>
                                    <input
                                      type="checkbox"
                                      onChange={(e) =>
                                        handleCopyClientAddress(
                                          activeNomineeTab,
                                          "guardian",
                                          e.target.checked
                                        )
                                      }
                                      className={styles.addressCheckbox}
                                    />
                                    <span className={styles.addressCheckboxText}>
                                      Based on client address
                                    </span>
                                  </span>
                                </label>
                                <input
                                  type="text"
                                  value={
                                    nomineeDetails[activeNomineeTab].guardian
                                      .address.addressLine1
                                  }
                                  onChange={(e) =>
                                    handleNomineeChange(
                                      activeNomineeTab,
                                      "guardian.address.addressLine1",
                                      e.target.value,
                                    )
                                  }
                                  className={styles.nomineeInput}
                                  placeholder="Address Line 1"
                                />
                              </div>
                            </div>

                            {/* Guardian Address Line 2 */}
                            <div className={styles.nomineeRow}>
                              <div className={styles.nomineeField}>
                                <label>Address Line 2 (Optional)</label>
                                <input
                                  type="text"
                                  value={
                                    nomineeDetails[activeNomineeTab].guardian
                                      .address.addressLine2
                                  }
                                  onChange={(e) =>
                                    handleNomineeChange(
                                      activeNomineeTab,
                                      "guardian.address.addressLine2",
                                      e.target.value,
                                    )
                                  }
                                  className={styles.nomineeInput}
                                  placeholder="Address Line 2"
                                />
                              </div>
                            </div>

                            {/* Guardian Address Line 3 */}
                            <div className={styles.nomineeRow}>
                              <div className={styles.nomineeField}>
                                <label>Address Line 3 (Optional)</label>
                                <input
                                  type="text"
                                  value={
                                    nomineeDetails[activeNomineeTab].guardian
                                      .address.addressLine3
                                  }
                                  onChange={(e) =>
                                    handleNomineeChange(
                                      activeNomineeTab,
                                      "guardian.address.addressLine3",
                                      e.target.value,
                                    )
                                  }
                                  className={styles.nomineeInput}
                                  placeholder="Address Line 3"
                                />
                              </div>
                            </div>

                            {/* Guardian State and City */}
                            <div className={styles.nomineeRow}>
                              <div className={styles.nomineeField}>
                                <label>
                                  State{" "}
                                  <span className={styles.mandatoryAsterisk}>
                                    *
                                  </span>
                                </label>
                                <select
                                  value={
                                    nomineeDetails[activeNomineeTab].guardian
                                      .address.state
                                  }
                                  onChange={(e) =>
                                    handleGuardianStateChange(
                                      activeNomineeTab,
                                      e.target.value,
                                    )
                                  }
                                  className={styles.nomineeSelect}
                                >
                                  <option value="">Select State</option>
                                  {states.map((state) => (
                                    <option key={state} value={state}>
                                      {state}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className={styles.nomineeField}>
                                <label>
                                  District / City{" "}
                                  <span className={styles.mandatoryAsterisk}>
                                    *
                                  </span>
                                </label>
                                <select
                                  value={
                                    nomineeDetails[activeNomineeTab].guardian
                                      .address.city
                                  }
                                  onChange={(e) =>
                                    handleNomineeChange(
                                      activeNomineeTab,
                                      "guardian.address.city",
                                      e.target.value,
                                    )
                                  }
                                  className={styles.nomineeSelect}
                                  disabled={
                                    !nomineeDetails[activeNomineeTab].guardian
                                      .address.state
                                  }
                                >
                                  <option value="">Select District</option>
                                  {(
                                    districts[
                                      nomineeDetails[activeNomineeTab].guardian
                                        .address.state
                                    ] || []
                                  ).map((district) => (
                                    <option key={district} value={district}>
                                      {district}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {/* Guardian Pincode */}
                            <div className={styles.nomineeRow}>
                              <div className={styles.nomineeField}>
                                <label>
                                  Pincode{" "}
                                  <span className={styles.mandatoryAsterisk}>
                                    *
                                  </span>
                                </label>
                                <input
                                  type="text"
                                  value={
                                    nomineeDetails[activeNomineeTab].guardian
                                      .address.pincode
                                  }
                                  onChange={(e) =>
                                    handleNomineeChange(
                                      activeNomineeTab,
                                      "guardian.address.pincode",
                                      e.target.value,
                                    )
                                  }
                                  className={styles.nomineeInput}
                                  placeholder="Pincode"
                                  maxLength="6"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                      <div className={styles.nomineeRow}>
                        <div className={styles.nomineeField}>
                          <label>
                            Identity Type{" "}
                            <span className={styles.mandatoryAsterisk}>*</span>
                          </label>
                          <select
                            value={
                              nomineeDetails[activeNomineeTab].identityType
                            }
                            onChange={(e) =>
                              handleNomineeChange(
                                activeNomineeTab,
                                "identityType",
                                e.target.value,
                              )
                            }
                            className={styles.nomineeSelect}
                          >
                            <option value="">Select</option>
                            <option value="PAN">PAN</option>
                            <option value="Aadhaar">Aadhaar</option>
                            <option value="Driving License">
                              Driving License
                            </option>
                            <option value="Passport">Passport</option>
                          </select>
                        </div>

                        <div className={styles.nomineeField}>
                          <label>
                            {nomineeDetails[activeNomineeTab].identityType ===
                            "Aadhaar"
                              ? "Aadhaar (Last 4 Digits)"
                              : "Identity Number"}{" "}
                            <span className={styles.mandatoryAsterisk}>*</span>
                          </label>
                          <input
                            type="text"
                            value={
                              nomineeDetails[activeNomineeTab].identityNumber
                            }
                            onChange={(e) =>
                              handleNomineeChange(
                                activeNomineeTab,
                                "identityNumber",
                                e.target.value,
                              )
                            }
                            maxLength={
                              nomineeDetails[activeNomineeTab].identityType ===
                              "Aadhaar"
                                ? 4
                                : undefined
                            }
                            placeholder={
                              nomineeDetails[activeNomineeTab].identityType ===
                              "Aadhaar"
                                ? "XXXX"
                                : "Enter ID Number"
                            }
                            className={styles.nomineeInput}
                          />
                        </div>
                      </div>

                      <div className={styles.nomineeRow}>
                        <div className={styles.nomineeField}>
                          <label>
                            Mobile{" "}
                            <span className={styles.mandatoryAsterisk}>*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="Mobile"
                            value={nomineeDetails[activeNomineeTab].mobile}
                            onChange={(e) =>
                              handleNomineeChange(
                                activeNomineeTab,
                                "mobile",
                                e.target.value,
                              )
                            }
                            maxLength="10"
                            className={styles.nomineeInput}
                          />
                        </div>

                        <div className={styles.nomineeField}>
                          <label>
                            Email <span className={styles.mandatoryAsterisk}>*</span>
                          </label>
                          <input
                            type="email"
                            placeholder="Email"
                            value={nomineeDetails[activeNomineeTab].email}
                            onChange={(e) =>
                              handleNomineeChange(
                                activeNomineeTab,
                                "email",
                                e.target.value,
                              )
                            }
                            className={styles.nomineeInput}
                          />
                        </div>
                      </div>

                      <div className={styles.nomineeRow}>
                        <div className={styles.nomineeField}>
                          <label className={styles.addressLabel}>
                            Address Line 1{" "}
                            <span className={styles.mandatoryAsterisk}>*</span>
                            <span className={styles.addressMeta}>
                              <input
                                type="checkbox"
                                onChange={(e) =>
                                  handleCopyClientAddress(
                                    activeNomineeTab,
                                    "nominee",
                                    e.target.checked
                                  )
                                }
                                className={styles.addressCheckbox}
                              />
                              <span className={styles.addressCheckboxText}>
                                Based on client address
                              </span>
                            </span>
                          </label>

                          <input
                            type="text"
                            placeholder="Address Line 1"
                            value={
                              nomineeDetails[activeNomineeTab].address
                                .addressLine1
                            }
                            onChange={(e) =>
                              handleNomineeChange(
                                activeNomineeTab,
                                "address.addressLine1",
                                e.target.value,
                              )
                            }
                            className={styles.nomineeInput}
                          />
                        </div>
                      </div>

                      <div className={styles.nomineeRow}>
                        <div className={styles.nomineeField}>
                          <label>Address Line 2 (Optional)</label>
                          <input
                            type="text"
                            placeholder="Address Line 2"
                            value={
                              nomineeDetails[activeNomineeTab].address
                                .addressLine2
                            }
                            onChange={(e) =>
                              handleNomineeChange(
                                activeNomineeTab,
                                "address.addressLine2",
                                e.target.value,
                              )
                            }
                            className={styles.nomineeInput}
                          />
                        </div>
                      </div>

                      <div className={styles.nomineeRow}>
                        <div className={styles.nomineeField}>
                          <label>
                            State{" "}
                            <span className={styles.mandatoryAsterisk}>*</span>
                          </label>
                          <select
                            value={
                              nomineeDetails[activeNomineeTab].address.state
                            }
                            onChange={(e) =>
                              handleNomineeStateChange(
                                activeNomineeTab,
                                e.target.value,
                              )
                            }
                            className={styles.nomineeSelect}
                          >
                            <option value="">Select State</option>
                            {states.map((state) => (
                              <option key={state} value={state}>
                                {state}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className={styles.nomineeField}>
                          <label>
                            District / City{" "}
                            <span className={styles.mandatoryAsterisk}>*</span>
                          </label>
                          <select
                            value={
                              nomineeDetails[activeNomineeTab].address.city
                            }
                            onChange={(e) =>
                              handleNomineeChange(
                                activeNomineeTab,
                                "address.city",
                                e.target.value,
                              )
                            }
                            className={styles.nomineeSelect}
                            disabled={
                              !nomineeDetails[activeNomineeTab].address.state
                            }
                          >
                            <option value="">Select District</option>
                            {(
                              districts[
                                nomineeDetails[activeNomineeTab].address.state
                              ] || []
                            ).map((district) => (
                              <option key={district} value={district}>
                                {district}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className={styles.nomineeRow}>
                        <div className={styles.nomineeField}>
                          <label>
                            Pincode{" "}
                            <span className={styles.mandatoryAsterisk}>*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="Pincode"
                            value={
                              nomineeDetails[activeNomineeTab].address.pincode
                            }
                            onChange={(e) =>
                              handleNomineeChange(
                                activeNomineeTab,
                                "address.pincode",
                                e.target.value,
                              )
                            }
                            className={styles.nomineeInput}
                            maxLength="6"
                          />
                        </div>
                      </div>
                      {errors.nomineeDetails && (
                        <div className={styles.errorText}>
                          {errors.nomineeDetails}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Income */}
          <div>
            <Section
              label={
                <>
                  Annual Income{" "}
                  <span className={styles.mandatoryAsterisk}>*</span>
                </>
              }
              options={incomeRanges}
              name="selectedIncome"
              formState={formState}
              handleCheckboxChange={handleCheckboxChange}
            />
            {errors.income && (
              <div className={styles.errorText}>{errors.income}</div>
            )}
          </div>

          {/* Occupation */}
          <div>
            <Section
              label={
                <>
                  Occupation <span className={styles.mandatoryAsterisk}>*</span>
                </>
              }
              options={occupations}
              name="occupation"
              formState={formState}
              handleCheckboxChange={handleCheckboxChange}
            />
            {errors.occupation && (
              <div className={styles.errorText}>{errors.occupation}</div>
            )}
          </div>

          {/* Trading Experience */}
          <div>
            <Section
              label={
                <>
                  Trading Experience{" "}
                  <span className={styles.mandatoryAsterisk}>*</span>
                </>
              }
              options={tradingExperience}
              name="selectedTradingExperience"
              formState={formState}
              handleCheckboxChange={handleCheckboxChange}
            />
            {errors.tradingExperience && (
              <div className={styles.errorText}>{errors.tradingExperience}</div>
            )}
          </div>

          <div className={styles.dropdownSection}>
            <div className={styles.dropdownRow}>
              <div className={styles.FormText}>
                Do you require DIS slip book ?
              </div>
              <select
                value={formState.selectedDisSlipBook}
                onChange={(e) =>
                  handleInputChange("selectedDisSlipBook", e.target.value)
                }
                className={styles.customDropdown}
              >
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </div>
          </div>

          <div className={styles.dropdownSection}>
            <div className={styles.dropdownRow}>
              <div className={styles.FormText}>
                Do you intent to invest in stock market with
              </div>
              <select
                value={formState.investmentSource}
                onChange={(e) =>
                  handleInputChange("investmentSource", e.target.value)
                }
                className={styles.customDropdown}
              >
                <option value="own-funds">Own Funds</option>
              </select>
            </div>
          </div>

          <div className={styles.dropdownSection}>
            <div className={styles.dropdownRow}>
              <div className={styles.FormText}>Running Account Statement</div>
              <select
                value={formState.runningAccountStatement}
                onChange={(e) =>
                  handleInputChange("runningAccountStatement", e.target.value)
                }
                className={styles.customDropdown}
              >
                <option value="quarterly">Once in a quarter</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>

          {showPanUploadSection && (
            <PanUploadSection
              panFile={panFile}
              panNumber={userPan}
              panName={userName}
              onUploadSuccess={(key) => {
                setPanFile(key);
                if (key) {
                  setPanSource("manual");
                }
                setErrors((prev) => ({ ...prev, panFile: "" }));
                if (refreshKycStatus) refreshKycStatus();
              }}
              error={errors.panFile}
            />
          )}

          <div className={styles.mandatorySection}>
            <div className={styles.MandatoryHeading}>
              Mandatory Declarations
            </div>

            <div className={styles.mandatoryCard}>
              <div className={styles.MandatoryContainer}>
                <div className={styles.MandatoryText}>
                  I am an Indian Citizen
                </div>
                <div className={styles.MandatoryTick}></div>
              </div>

              <div className={styles.MandatoryContainer}>
                <div className={styles.MandatoryText}>
                  I am a Tax Resident of India
                </div>
                <div className={styles.MandatoryTick}></div>
              </div>

              <div className={styles.MandatoryContainer}>
                <div className={styles.MandatoryText}>
                  I am Not Politically Exposed or Related
                </div>
                <div className={styles.MandatoryTick}></div>
              </div>

              <div className={styles.MandatoryContainer}>
                <div className={styles.MandatoryText}>
                  I am Allowed to Invest in Indian Market
                </div>
                <div className={styles.MandatoryTick}></div>
              </div>
            </div>
          </div>
        </div>

        <button
          className={styles.verifyButton}
          onClick={handleSubmit}
          disabled={
            formState.selectedNominee === "yes" && !validateSharePercentage()
          }
        >
          Proceed
        </button>
      </div>
    </div>
  );
};

const Section = ({ label, options, name, formState, handleCheckboxChange }) => (
  <div className={styles.dropdownSection}>
    <div className={styles.dropdownRow}>
      <div className={styles.FormText}>{label}</div>
      <select
        className={styles.customDropdown}
        value={formState[name] || ""}
        onChange={(e) =>
          handleCheckboxChange({ target: { id: e.target.value, name } })
        }
      >
        <option value="">Select an option</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  </div>
);

export default Profile;
