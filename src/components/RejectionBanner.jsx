import React from 'react';
import { useKyc } from '../context/KycContext';
import styles from './RejectionBanner.module.css';

const SECTION_STEP_MAP = {
  address: 2,
  bank: 3,
  profile: 4,
  exchange: 5,
  ipv: 6,
  signature: 7,
  digitalSign: 8
};

const RejectionBanner = ({ section }) => {
  const { approvals, rejectedSteps, isRejectedMode, rejectedStepsDone } = useKyc();

  if (!isRejectedMode || !section) {
    return null;
  }

  const stepNumber = SECTION_STEP_MAP[section];
  const sectionApproval = approvals?.[section];
  const isRejected =
    sectionApproval?.status === 'rejected' ||
    (stepNumber && rejectedSteps.includes(stepNumber));

  // If not rejected or if this rejected step was already completed in the current re-submission session
  if (!isRejected) {
    return null;
  }

  const isDoneInSession = stepNumber && rejectedStepsDone.includes(stepNumber);
  if (isDoneInSession) {
    return null;
  }

  const reason =
    sectionApproval?.rejectionReason ||
    'Please review the required details for this step and make necessary updates before resubmitting.';

  return (
    <div className={styles.rejectionBanner} role="alert">
      <div className={styles.iconWrapper}>
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </div>
      <div className={styles.contentWrapper}>
        <div className={styles.bannerTitle}>
          <span>Action Required: Verification Rejected</span>
          <span className={styles.statusTag}>Needs Fix</span>
        </div>
        <div className={styles.reasonBox}>
          <span className={styles.reasonLabel}>Reason from Admin:</span>
          {reason}
        </div>
        <p className={styles.guidanceText}>
          Please correct the details below and proceed with submission to continue your KYC onboarding.
        </p>
      </div>
    </div>
  );
};

export default RejectionBanner;
