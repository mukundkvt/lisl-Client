import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useKyc } from '../context/KycContext';
import styles from './StepperHeader.module.css';
import fullLogo from '../assets/icons/fullLogo.png';
import toast from 'react-hot-toast';

const KYC_ROUTES = [
  '/address',
  '/digilocker-success',
  '/digilocker-failed',
  '/bank-verification',
  '/profile',
  '/exchange',
  '/ipv',
  '/ipv-verify',
  '/ipv-mobile',
  '/signature',
  '/esign',
  '/esign-verify'
];

const StepperHeader = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { steps, isRejectedMode, handleLogout } = useKyc();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Only render on KYC step routes
  const isKycRoute = KYC_ROUTES.includes(location.pathname);
  if (!isKycRoute) {
    return null;
  }

  // Find current active step in visible steps
  const activeStepIndex = steps.findIndex(s => s.path === location.pathname);
  const currentStep = activeStepIndex !== -1 ? steps[activeStepIndex] : null;

  const handleStepClick = (step) => {
    if (step.isAccessible) {
      setMobileMenuOpen(false);
      navigate(step.path);
    } else {
      toast.error('Please complete the preceding steps first');
    }
  };

  return (
    <header className={styles.headerContainer}>
      <div className={styles.headerInner}>
        {/* Brand Logo */}
        <div className={styles.logoWrapper} onClick={() => navigate('/')}>
          <img src={fullLogo} alt="Lakshmishree" className={styles.logoImg} />
        </div>

        {/* Desktop Stepper Navigation */}
        <nav className={styles.desktopStepper} aria-label="KYC Progress">
          <div className={styles.stepperTrack}>
            {steps.map((step, index) => {
              const isLast = index === steps.length - 1;
              const isNeedsFix = isRejectedMode && !step.isCompleted && step.isCurrent;

              return (
                <div key={step.id} className={styles.stepItemWrapper}>
                  <button
                    type="button"
                    className={`${styles.stepNode} ${step.isCompleted ? styles.completed : ''} ${
                      step.isCurrent ? styles.current : ''
                    } ${step.isAccessible ? styles.accessible : styles.disabled} ${
                      isNeedsFix ? styles.rejectedNeedsFix : ''
                    }`}
                    onClick={() => handleStepClick(step)}
                    disabled={!step.isAccessible}
                    title={
                      step.isAccessible
                        ? `Go to ${step.title}`
                        : 'Complete preceding steps to unlock'
                    }
                  >
                    <span className={styles.stepCircle}>
                      {step.isCompleted ? (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        index + 1
                      )}
                    </span>
                    <span className={styles.stepLabel}>{step.title}</span>
                  </button>

                  {!isLast && (
                    <div
                      className={`${styles.stepLine} ${
                        step.isCompleted ? styles.completedLine : ''
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </nav>

        {/* Desktop Right Actions (Status & Logout) */}
        <div className={styles.rightActions}>
          {isRejectedMode && (
            <div className={styles.rejectionBadge} title="Re-verification required">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
              <span>Re-verification Mode</span>
            </div>
          )}

          <button
            type="button"
            className={styles.logoutBtn}
            onClick={handleLogout}
            title="Log out of your account"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Logout</span>
          </button>
        </div>

        {/* Mobile View Controls */}
        <div className={styles.mobileControls}>
          {currentStep && (
            <span className={styles.mobileStepBadge}>
              {isRejectedMode ? 'Fix' : 'Step'} {activeStepIndex + 1}/{steps.length}: {currentStep.title}
            </span>
          )}

          <button
            type="button"
            className={styles.hamburgerBtn}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span className={styles.hamburgerBar} />
            <span className={styles.hamburgerBar} />
            <span className={styles.hamburgerBar} />
          </button>
        </div>
      </div>

      {/* Mobile Slide-Out Drawer */}
      {mobileMenuOpen && (
        <div className={styles.drawerBackdrop} onClick={() => setMobileMenuOpen(false)}>
          <div className={styles.drawerPanel} onClick={(e) => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <h3 className={styles.drawerTitle}>
                {isRejectedMode ? 'Re-verification Steps' : 'KYC Steps'}
              </h3>
              <button
                type="button"
                className={styles.drawerCloseBtn}
                onClick={() => setMobileMenuOpen(false)}
              >
                &times;
              </button>
            </div>

            <div className={styles.drawerBody}>
              {steps.map((step, idx) => (
                <button
                  key={step.id}
                  type="button"
                  className={`${styles.drawerStepItem} ${
                    step.isCurrent ? styles.current : ''
                  } ${step.isCompleted ? styles.completed : ''} ${
                    step.isAccessible ? styles.accessible : styles.disabled
                  }`}
                  onClick={() => handleStepClick(step)}
                  disabled={!step.isAccessible}
                >
                  <span className={styles.stepCircle}>
                    {step.isCompleted ? (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      idx + 1
                    )}
                  </span>
                  <div className={styles.drawerStepInfo}>
                    <span className={styles.drawerStepTitle}>{step.title}</span>
                    <span className={styles.drawerStepDesc}>{step.description}</span>
                  </div>
                  <span
                    className={`${styles.drawerStepStatusBadge} ${
                      step.isCompleted
                        ? styles.completed
                        : step.isCurrent
                        ? styles.current
                        : styles.locked
                    }`}
                  >
                    {step.isCompleted
                      ? 'Done'
                      : step.isCurrent
                      ? 'Active'
                      : 'Locked'}
                  </span>
                </button>
              ))}
            </div>

            <div className={styles.drawerFooter}>
              <button
                type="button"
                className={styles.drawerLogoutBtn}
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default StepperHeader;
