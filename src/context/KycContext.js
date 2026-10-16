import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export const KYC_STEPS = [
  {
    id: 'address',
    title: 'Address',
    path: '/address',
    dbStep: 2,
    section: 'address',
    description: 'Aadhaar / Address Proof'
  },
  {
    id: 'bank',
    title: 'Bank',
    path: '/bank-verification',
    dbStep: 3,
    section: 'bank',
    description: 'Bank Account & Proof'
  },
  {
    id: 'profile',
    title: 'Profile',
    path: '/profile',
    dbStep: 4,
    section: 'profile',
    description: 'Personal & Nominee Info'
  },
  {
    id: 'exchange',
    title: 'Exchange',
    path: '/exchange',
    dbStep: 5,
    section: 'exchange',
    description: 'Trading Segments'
  },
  {
    id: 'ipv',
    title: 'IPV',
    path: '/ipv',
    dbStep: 6,
    section: 'ipv',
    description: 'Video Verification'
  },
  {
    id: 'signature',
    title: 'Signature',
    path: '/signature',
    dbStep: 7,
    section: 'signature',
    description: 'Signature Upload'
  },
  {
    id: 'esign',
    title: 'Esign',
    path: '/esign',
    dbStep: 8,
    section: 'digitalSign',
    description: 'Digital Signature'
  }
];

const KycContext = createContext(null);

export const KycProvider = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [kycData, setKycData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchKycDetails = useCallback(async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setKycData(null);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/get_user_details`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setKycData(result.data);
        }
      } else if (response.status === 401) {
        localStorage.removeItem('authToken');
        setKycData(null);
      }
    } catch (err) {
      console.error('Error fetching KYC user details:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKycDetails();
  }, [fetchKycDetails, location.pathname]);

  const userStatus = kycData?.userStatus || 'pending';
  const rejectedSteps = Array.isArray(kycData?.rejectedSteps) ? kycData.rejectedSteps : [];
  const rejectedStepsDone = Array.isArray(kycData?.rejectedStepsDone) ? kycData.rejectedStepsDone : [];
  const approvals = kycData?.approvals || {};
  const maxStepCompleted = Number(kycData?.max_step_completed) || 0;

  // Rejection mode is active if status is "rejected" or there are rejected steps (unless already esigned or approved)
  const isRejectedMode =
    (userStatus === 'rejected' || rejectedSteps.length > 0) &&
    userStatus !== 'esigned' &&
    userStatus !== 'approved';

  // Determine which steps to show in the stepper
  let visibleSteps = [];
  if (isRejectedMode) {
    // Show only steps in rejectedSteps + Esign (step 8)
    const effectiveRejected = rejectedSteps.includes(8) ? rejectedSteps : [...rejectedSteps, 8];
    visibleSteps = KYC_STEPS.filter(s => effectiveRejected.includes(s.dbStep));
  } else {
    visibleSteps = [...KYC_STEPS];
  }

  // Calculate completion and accessibility for each visible step
  const stepsWithStatus = visibleSteps.map((step, index) => {
    let isCompleted = false;
    let isAccessible = false;

    if (isRejectedMode) {
      // In rejection mode: completed if dbStep is in rejectedStepsDone
      isCompleted = rejectedStepsDone.includes(step.dbStep);

      // Current step is accessible
      const isCurrent = location.pathname === step.path;

      // Completed steps are always accessible to edit/view
      if (isCompleted || isCurrent) {
        isAccessible = true;
      } else {
        // Can access if all preceding rejected steps are completed
        const prevSteps = visibleSteps.slice(0, index);
        const allPrevCompleted = prevSteps.every(p => rejectedStepsDone.includes(p.dbStep));
        if (allPrevCompleted) {
          isAccessible = true;
        }
      }
    } else {
      // Standard flow:
      // Address: completed if maxStepCompleted >= 3
      // Bank: completed if maxStepCompleted >= 4
      // Profile: completed if maxStepCompleted >= 5
      // Exchange: completed if maxStepCompleted >= 6
      // IPV: completed if maxStepCompleted >= 7
      // Signature: completed if maxStepCompleted >= 8
      // Esign: completed if maxStepCompleted >= 9
      if (step.dbStep === 2) isCompleted = maxStepCompleted >= 3;
      else if (step.dbStep === 3) isCompleted = maxStepCompleted >= 4;
      else if (step.dbStep === 4) isCompleted = maxStepCompleted >= 5;
      else if (step.dbStep === 5) isCompleted = maxStepCompleted >= 6;
      else if (step.dbStep === 6) isCompleted = maxStepCompleted >= 7;
      else if (step.dbStep === 7) isCompleted = maxStepCompleted >= 8;
      else if (step.dbStep === 8) isCompleted = maxStepCompleted >= 9;

      const isCurrent = location.pathname === step.path;

      // Accessible if completed, currently on it, or if it is the current target step based on maxStepCompleted
      if (isCompleted || isCurrent) {
        isAccessible = true;
      } else {
        // Check if user has completed up to this step's predecessor
        const reqMin = step.dbStep === 2 ? 1 : step.dbStep;
        if (maxStepCompleted >= reqMin) {
          isAccessible = true;
        }
      }
    }

    const isCurrent = location.pathname === step.path;

    return {
      ...step,
      isCompleted,
      isCurrent,
      isAccessible
    };
  });

  // Find first uncompleted rejected step
  const pendingRejectedSteps = visibleSteps.filter(s => !rejectedStepsDone.includes(s.dbStep));
  const firstPendingRejectedStep = pendingRejectedSteps.length > 0 ? pendingRejectedSteps[0] : visibleSteps[0];

  // Route Guard: If in rejection mode, protect against staying on /thank-you or non-rejected pages
  useEffect(() => {
    if (loading || !kycData || !isRejectedMode) return;
    if (userStatus === 'esigned' || userStatus === 'approved') return;

    const isVisiblePath = visibleSteps.some(s => s.path === location.pathname);
    const isPublicAuthRoute = ['/', '/pan', '/get-started'].includes(location.pathname);

    // If on /thank-you or on an unrejected KYC step, redirect to the first pending rejected step
    if (location.pathname === '/thank-you' || (!isVisiblePath && !isPublicAuthRoute)) {
      if (firstPendingRejectedStep && location.pathname !== firstPendingRejectedStep.path) {
        navigate(firstPendingRejectedStep.path, { replace: true });
      }
    }
  }, [loading, kycData, isRejectedMode, visibleSteps, firstPendingRejectedStep, location.pathname, navigate]);

  // Helper to get next step path
  const getNextStepPath = useCallback(
    (currentPath) => {
      const currIdx = visibleSteps.findIndex(s => s.path === currentPath);
      if (currIdx !== -1 && currIdx < visibleSteps.length - 1) {
        return visibleSteps[currIdx + 1].path;
      }
      return '/thank-you';
    },
    [visibleSteps]
  );

  const navigateToNextStep = useCallback(
    (currentPath) => {
      const nextPath = getNextStepPath(currentPath);
      navigate(nextPath);
    },
    [getNextStepPath, navigate]
  );

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userMobile');
    localStorage.removeItem('userName');
    setKycData(null);
    toast.success('Logged out successfully');
    navigate('/');
  };

  return (
    <KycContext.Provider
      value={{
        kycData,
        loading,
        userStatus,
        rejectedSteps,
        rejectedStepsDone,
        approvals,
        maxStepCompleted,
        isRejectedMode,
        steps: stepsWithStatus,
        firstPendingRejectedStep,
        getNextStepPath,
        navigateToNextStep,
        refreshKycStatus: fetchKycDetails,
        handleLogout
      }}
    >
      {children}
    </KycContext.Provider>
  );
};

export const useKyc = () => {
  const context = useContext(KycContext);
  if (!context) {
    throw new Error('useKyc must be used within a KycProvider');
  }
  return context;
};
