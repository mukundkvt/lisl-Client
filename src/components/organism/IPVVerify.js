import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './IPVVerify.module.css'
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa'
import { useKyc } from '../../context/KycContext'

const IPVVerify = () => {
  const { getNextStepPath, refreshKycStatus } = useKyc()
  const [status, setStatus] = useState('loading') // loading, success, error, mobile_done
  const [message, setMessage] = useState('Verifying your identity...')
  const [countdown, setCountdown] = useState(null)
  const [redirectPath, setRedirectPath] = useState(null)
  const navigate = useNavigate()

  const isMobileFlow = localStorage.getItem('ipv_from_mobile') === 'true'

  useEffect(() => {
    const verifyIPV = async () => {
      const token = localStorage.getItem('authToken')

      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/api/get_ipv_details`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        )

        const data = await response.json()

        if (response.ok && data.data?.verificationStatus) {
          if (isMobileFlow) {
            // Mobile user — clear the flag, show completion screen, don't navigate
            localStorage.removeItem('ipv_from_mobile')
            setStatus('mobile_done')
          } else {
            // Desktop user — redirect to next step
            refreshKycStatus();
            setStatus('success')
            setMessage('Identity verification successful!')
            setRedirectPath(getNextStepPath('/ipv') || '/signature')
            setCountdown(3)
          }
        } else {
          setStatus('error')
          setMessage(data.message || 'Identity verification failed. Please try again.')
          setRedirectPath('/ipv')
          setCountdown(3)
        }

      } catch (error) {
        console.error('Error verifying IPV:', error)
        setStatus('error')
        setMessage('An error occurred during verification. Please try again.')
        setRedirectPath('/ipv')
        setCountdown(3)
      }
    }

    verifyIPV()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let timer
    if (countdown !== null && countdown > 0) {
      timer = setTimeout(() => {
        if (countdown === 1) {
          navigate(redirectPath)
        } else {
          setCountdown(countdown - 1)
        }
      }, 1000)
    }
    return () => { if (timer) clearTimeout(timer) }
  }, [countdown, redirectPath, navigate])

  // ─── Mobile completion screen ────────────────────────────────────────────────
  if (status === 'mobile_done') {
    return (
      <div className={styles.mobileDoneContainer}>
        <div className={styles.mobileDoneCard}>
          {/* Animated tick ring */}
          <div className={styles.tickRing}>
            <svg viewBox="0 0 80 80" className={styles.tickSvg}>
              <circle
                cx="40" cy="40" r="36"
                fill="none"
                stroke="#22c55e"
                strokeWidth="5"
                className={styles.tickCircle}
              />
              <path
                d="M24 40 l12 12 l20 -22"
                fill="none"
                stroke="#22c55e"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={styles.tickPath}
              />
            </svg>
          </div>

          <h2 className={styles.doneTitle}>IPV Completed! 🎉</h2>
          <p className={styles.doneSubtitle}>Your In-Person Verification is successful.</p>

          <div className={styles.doneInfoBox}>
            <span className={styles.doneInfoIcon}>💻</span>
            <p className={styles.doneInfoText}>
              Please continue your KYC journey on the original device.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ─── Standard loading / success / error ─────────────────────────────────────
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {status === 'loading' && (
          <>
            <div className={styles.loader}></div>
            <div className={styles.message}>{message}</div>
          </>
        )}

        {status === 'success' && (
          <>
            <div className={`${styles.icon} ${styles.successIcon}`}>
              <FaCheckCircle />
            </div>
            <div className={`${styles.message} ${styles.success}`}>
              {message}
              {countdown !== null && (
                <div className={styles.countdown}>
                  Redirecting in {countdown} seconds...
                </div>
              )}
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className={`${styles.icon} ${styles.errorIcon}`}>
              <FaTimesCircle />
            </div>
            <div className={`${styles.message} ${styles.error}`}>
              {message}
              {countdown !== null && (
                <div className={styles.countdown}>
                  Redirecting in {countdown} seconds...
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default IPVVerify