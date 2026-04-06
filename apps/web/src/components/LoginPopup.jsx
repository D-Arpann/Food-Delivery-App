import { useEffect, useState } from 'react'
import {
  completeSignupProfile,
  sendPhoneOtp,
  verifyOtpAndSyncProfile,
} from '@repo/api'
import {
  AUTH_OTP_LENGTH,
  NEPAL_COUNTRY_CODE,
  hasMinDigits,
  onlyDigits,
  toNepalE164Phone,
} from '@repo/utils'
import { Button, Input } from '@repo/ui'
import './LoginPopup.css'

const phoneInputStyle = {
  background: '#f4e5d8',
  border: '3px solid #F8964F',
  borderRadius: '16px',
  minHeight: '66px',
  padding: '0 22px',
}

const phoneInputTextStyle = {
  fontSize: '1.5rem',
  fontWeight: 700,
  color: '#1E1E1E',
}

const phonePrefixStyle = {
  fontSize: '1.5rem',
  fontWeight: 700,
  color: '#5E5E5E',
}

const signupInputStyle = {
  background: '#f4e5d8',
  border: '3px solid #F8964F',
  borderRadius: '16px',
  minHeight: '62px',
  padding: '0 18px',
}

const signupInputTextStyle = {
  fontSize: '1.24rem',
  fontWeight: 700,
  color: '#1E1E1E',
}

const ctaButtonStyle = {
  width: '100%',
  minHeight: '62px',
  borderRadius: '16px',
  fontSize: '1.35rem',
  fontWeight: 800,
  backgroundColor: '#F8964F',
  borderColor: '#F8964F',
  color: '#FFFFFF',
  boxShadow: 'none',
}

const outlineButtonStyle = {
  width: '100%',
  minHeight: '62px',
  borderRadius: '16px',
  fontSize: '1.25rem',
  fontWeight: 700,
}

export default function LoginPopup({ isOpen, onClose, supabase, onAuthenticated }) {
  const [step, setStep] = useState(1)
  const [phone, setPhone] = useState('')
  const [otpDigits, setOtpDigits] = useState(Array(AUTH_OTP_LENGTH).fill(''))
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [dob, setDob] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      setStep(1)
      setPhone('')
      setOtpDigits(Array(AUTH_OTP_LENGTH).fill(''))
      setFullName('')
      setEmail('')
      setDob('')
      setError('')
    }
  }, [isOpen])

  if (!isOpen) {
    return null
  }

  const handleTopBack = () => {
    setError('')
    if (step === 1) {
      onClose()
      return
    }
    setStep((prev) => prev - 1)
  }

  const handleOtpChange = (index, value) => {
    const digit = onlyDigits(value).slice(-1)
    const nextDigits = [...otpDigits]
    nextDigits[index] = digit
    setOtpDigits(nextDigits)

    if (digit && index < AUTH_OTP_LENGTH - 1) {
      const nextInput = document.getElementById(`otp-${index + 1}`)
      nextInput?.focus()
    }
  }

  const handleOtpKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !otpDigits[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`)
      prevInput?.focus()
    }
  }

  const handleOtpPaste = (event) => {
    const pasted = onlyDigits(event.clipboardData.getData('text')).slice(
      0,
      AUTH_OTP_LENGTH,
    )

    if (!pasted) {
      return
    }

    event.preventDefault()

    const nextDigits = Array(AUTH_OTP_LENGTH).fill('')
    pasted.split('').forEach((digit, index) => {
      nextDigits[index] = digit
    })
    setOtpDigits(nextDigits)
  }

  const handlePhoneSubmit = async (event) => {
    event.preventDefault()

    if (!hasMinDigits(phone, 6)) {
      setError('Please enter a valid phone number.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const fullPhone = toNepalE164Phone(phone)
      const { error: otpError } = await sendPhoneOtp(supabase, fullPhone)

      if (otpError) {
        setError(otpError.message)
      } else {
        setStep(2)
      }
    } catch (_err) {
      setError('Failed to send OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpSubmit = async (event) => {
    event.preventDefault()

    const otpCode = otpDigits.join('')
    if (otpCode.length < AUTH_OTP_LENGTH) {
      setError('Please enter the 4-digit code.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const fullPhone = toNepalE164Phone(phone)
      const { data, error: verifyError } = await verifyOtpAndSyncProfile(supabase, {
        phone: fullPhone,
        token: otpCode,
      })

      if (verifyError) {
        setError(verifyError.message)
      } else if (data?.session && data?.needsSignup) {
        setStep(3)
      } else if (data?.session) {
        onAuthenticated?.(data.session)
        onClose()
      } else {
        setError('Could not verify the code. Please try again.')
      }
    } catch (_err) {
      setError('Verification failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSignupSubmit = async (event) => {
    event.preventDefault()

    setLoading(true)
    setError('')

    try {
      const fullPhone = toNepalE164Phone(phone)
      const { error: signupError } = await completeSignupProfile(supabase, {
        phone: fullPhone,
        full_name: fullName,
        email,
        date_of_birth: dob,
      })

      if (signupError) {
        setError(signupError.message)
      } else {
        const { data } = await supabase.auth.getSession()
        if (data?.session) {
          onAuthenticated?.(data.session)
        }
        onClose()
      }
    } catch (_err) {
      setError('Signup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setLoading(true)
    setError('')

    try {
      const fullPhone = toNepalE164Phone(phone)
      const { error: resendError } = await sendPhoneOtp(supabase, fullPhone)
      if (resendError) {
        setError(resendError.message)
      }
    } catch (_err) {
      setError('Failed to resend OTP.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="auth-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Login popup"
    >
      <div className="auth-modal" onClick={(event) => event.stopPropagation()}>
        <button className="auth-nav-back" onClick={handleTopBack} aria-label="Go back">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>

        <div className="auth-content">
          {error && <p className="auth-error">{error}</p>}

          {step === 1 && (
            <div className="auth-step slide-in">
              <h1>Time to eat</h1>
              <p className="subtitle">Your number is the secret ingredient.</p>

              <form onSubmit={handlePhoneSubmit}>
                <Input
                  placeholder="1234567890"
                  value={phone}
                  onChangeText={setPhone}
                  inputMode="tel"
                  prefix={NEPAL_COUNTRY_CODE}
                  prefixStyle={phonePrefixStyle}
                  inputStyle={phoneInputTextStyle}
                  autoFocus
                  style={phoneInputStyle}
                />

                <Button
                  type="submit"
                  title={loading ? 'Sending...' : 'Continue'}
                  loading={loading}
                  style={ctaButtonStyle}
                />

                <div className="auth-divider">
                  <span>OR</span>
                </div>

                <Button
                  type="button"
                  title="Other login method"
                  variant="outline"
                  style={outlineButtonStyle}
                />
              </form>
            </div>
          )}

          {step === 2 && (
            <div className="auth-step slide-in">
              <h1>Check your texts</h1>
              <p className="subtitle">Pop in the code from your messages.</p>

              <form onSubmit={handleOtpSubmit}>
                <div className="otp-inputs" onPaste={handleOtpPaste}>
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      autoFocus={index === 0}
                      onChange={(event) => handleOtpChange(index, event.target.value)}
                      onKeyDown={(event) => handleOtpKeyDown(index, event)}
                    />
                  ))}
                </div>

                <Button
                  type="submit"
                  title={loading ? 'Verifying...' : 'Verify'}
                  disabled={loading}
                  style={ctaButtonStyle}
                />

                <p className="resend-text">
                  Didn&apos;t get the code? <strong onClick={handleResend}>Resend</strong>
                </p>
              </form>
            </div>
          )}

          {step === 3 && (
            <div className="auth-step slide-in">
              <h1>First rodeo?</h1>
              <p className="subtitle">Welcome to the cool table.</p>

              <form onSubmit={handleSignupSubmit} className="signup-form">
                <Input
                  label="Full name"
                  placeholder="User For Testing"
                  value={fullName}
                  onChangeText={setFullName}
                  inputStyle={signupInputTextStyle}
                  required
                  style={signupInputStyle}
                />

                <Input
                  label="Email"
                  type="email"
                  placeholder="user@gmail.com"
                  value={email}
                  onChangeText={setEmail}
                  inputStyle={signupInputTextStyle}
                  required
                  style={signupInputStyle}
                />

                <Input
                  label="Date of birth"
                  type="date"
                  value={dob}
                  onChangeText={setDob}
                  inputStyle={signupInputTextStyle}
                  className="signup-date-field"
                  required
                  style={signupInputStyle}
                />

                <Button
                  className="signup-submit"
                  type="submit"
                  title={loading ? 'Signing up...' : 'Sign up'}
                  loading={loading}
                  style={ctaButtonStyle}
                />

                <p className="signup-disclaimer">
                  By signing up you are agreeing to the terms of service.
                </p>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
