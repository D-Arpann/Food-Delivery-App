import { useEffect, useRef, useState } from 'react'
import { supabase } from '@repo/api'
import './LoginPopup.css'

export default function LoginPopup({ isOpen, onClose }) {
  const [step, setStep] = useState(1)
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const otpRefs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)]
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      setStep(1)
      setPhone('')
      setOtp(['', '', '', '', '', ''])
      setError('')
    }
  }, [isOpen])

  if (!isOpen) {
    return null
  }

  const goBack = () => {
    setError('')
    if (step > 1) {
      setStep((prev) => prev - 1)
    } else {
      onClose()
    }
  }

  const handlePhoneSubmit = async (e) => {
    e.preventDefault()
    if (phone.length < 6) return

    setLoading(true)
    setError('')

    try {
      const fullPhone = `+977${phone}`
      const { error: otpError } = await supabase.auth.signInWithOtp({
        phone: fullPhone,
      })

      if (otpError) {
        setError(otpError.message)
      } else {
        setStep(2)
      }
    } catch (err) {
      setError('Failed to send OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    if (value !== '' && index < 5) {
      otpRefs[index + 1].current?.focus()
    }
  }

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
      otpRefs[index - 1].current?.focus()
    }
  }

  const handleOtpSubmit = async (e) => {
    e.preventDefault()
    const otpCode = otp.join('')
    if (otpCode.length < 6) return

    setLoading(true)
    setError('')

    try {
      const fullPhone = `+977${phone}`
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        phone: fullPhone,
        token: otpCode,
        type: 'sms',
      })

      if (verifyError) {
        setError(verifyError.message)
      } else if (data?.session) {
        // Auth success — redirect to web dashboard
        window.location.href = 'http://localhost:5173'
      } else {
        // New user — go to signup step
        setStep(3)
      }
    } catch (err) {
      setError('Verification failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSignupSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const formData = new FormData(e.target)
      const fullName = formData.get('fullName')
      const email = formData.get('email')
      const dob = formData.get('dob')

      const { error: updateError } = await supabase.auth.updateUser({
        data: { full_name: fullName, email, date_of_birth: dob },
      })

      if (updateError) {
        setError(updateError.message)
      } else {
        // Signup complete — redirect to web dashboard
        window.location.href = 'http://localhost:5173'
      }
    } catch (err) {
      setError('Signup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Login popup">
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {step > 1 && (
          <button className="back-btn" onClick={goBack} aria-label="Go back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <span>Back</span>
          </button>
        )}

        <div className="auth-content">
          <div className="auth-header-brand">
            <img src="/logo.png" alt="Chito Mitho" className="auth-logo" />
          </div>

          {error && <p className="auth-error">{error}</p>}

          {step === 1 && (
            <div className="auth-step slide-in">
              <h1>Time to eat</h1>
              <p className="subtitle">Your number is the secret ingredient.</p>

              <form onSubmit={handlePhoneSubmit}>
                <div className="phone-input-wrapper">
                  <span className="country-code">+977</span>
                  <input
                    type="tel"
                    placeholder="1234567890"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    autoFocus
                  />
                </div>

                <button type="submit" className="auth-btn auth-btn-solid" disabled={loading}>
                  {loading ? 'Sending...' : 'Continue'}
                </button>

                <div className="auth-divider">
                  <span>OR</span>
                </div>

                <button type="button" className="auth-btn auth-btn-outline">
                  Other login method
                </button>
              </form>
            </div>
          )}

          {step === 2 && (
            <div className="auth-step slide-in">
              <h1>Check your texts</h1>
              <p className="subtitle">Pop in the code from your messages.</p>

              <form onSubmit={handleOtpSubmit}>
                <div className="otp-inputs">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={otpRefs[index]}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    />
                  ))}
                </div>

                <button type="submit" className="auth-btn auth-btn-patterned" disabled={loading}>
                  {loading ? 'Verifying...' : 'Verify'}
                </button>

                <p className="resend-text">
                  Didn't get the code? <strong>Resend</strong>
                </p>
              </form>
            </div>
          )}

          {step === 3 && (
            <div className="auth-step slide-in">
              <h1>First rodeo?</h1>
              <p className="subtitle">Welcome to the cool table.</p>

              <form onSubmit={handleSignupSubmit} className="signup-form">
                <div className="auth-field">
                  <label>Full name</label>
                  <input type="text" name="fullName" placeholder="User For Testing" required />
                </div>

                <div className="auth-field">
                  <label>Email</label>
                  <input type="email" name="email" placeholder="user@gmail.com" required />
                </div>

                <div className="auth-field">
                  <label>Date of birth</label>
                  <input type="text" name="dob" placeholder="1-11-2004" required />
                </div>

                <button type="submit" className="auth-btn auth-btn-patterned" disabled={loading}>
                  {loading ? 'Signing up...' : 'Sign up'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
