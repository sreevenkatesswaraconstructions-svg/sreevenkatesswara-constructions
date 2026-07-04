import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import { User, Mail, Lock, Phone, Shield, ArrowRight, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminRegister() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: ''
  })
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [countdown, setCountdown] = useState(0)

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const validateStep1 = () => {
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      toast.error('Please fill all required fields')
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return false
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    if (!passwordRegex.test(formData.password)) {
      toast.error('Password must be at least 8 characters with uppercase, lowercase, number, and special character')
      return false
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast.error('Invalid email format')
      return false
    }
    return true
  }

  const sendOTP = async () => {
    console.log('=== FRONTEND SEND OTP ===');
    console.log('sendOTP called', formData)
    console.log('Form data:', JSON.stringify(formData, null, 2))

    if (!validateStep1()) return

    setLoading(true)
    try {
      console.log('Sending OTP request to /api/auth/register/send-otp')
      const payload = { email: formData.email, name: formData.name }
      console.log('Payload:', payload)

      const response = await fetch('/api/auth/register/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)
      const data = await response.json()
      console.log('=== FRONTEND API RESPONSE ===');
      console.log('Response data:', data)
      console.log('Success:', data.success)
      console.log('emailSent:', data.emailSent)
      console.log('devOTP:', data.devOTP)
      console.log('emailError:', data.emailError)
      console.log('=================================');

      if (response.ok && data.success) {
        console.log('✅ API request successful');
        setOtpSent(true)
        setStep(2)
        setCountdown(600) // 10 minutes

        console.log('=== TOAST NOTIFICATION TRIGGER ===');
        if (data.emailSent) {
          console.log('Triggering success toast: OTP sent to email');
          toast.success('OTP sent to your email')
        } else {
          console.log('Triggering error toast: Email not configured');
          toast.error('Email not configured - using development mode')
        }

        // Always show OTP for testing
        if (data.devOTP) {
          console.log('Triggering OTP toast with code:', data.devOTP);
          toast.success(`Your OTP: ${data.devOTP}`, { duration: 10000 })
        }

        // Log email error if present
        if (data.emailError) {
          console.error('Email error from API:', data.emailError)
        }
        console.log('=================================');
      } else {
        console.error('❌ API request failed');
        console.error('Error message:', data.error);
        toast.error(data.error || 'Failed to send OTP')
      }
    } catch (error) {
      console.error('=== FRONTEND CATCH ERROR ===');
      console.error('Error sending OTP:', error)
      console.error('Error stack:', error.stack)
      toast.error('Failed to send OTP')
    }
    setLoading(false)
    console.log('=== FRONTEND SEND OTP COMPLETE ===');
  }

  const resendOTP = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/register/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, name: formData.name })
      })

      const data = await response.json()
      console.log('Resend OTP response:', data)

      if (response.ok && data.success) {
        setCountdown(600)

        if (data.emailSent) {
          toast.success('OTP resent to your email')
        } else {
          toast.error('Email not configured - using development mode')
        }

        // Always show OTP for testing
        if (data.devOTP) {
          toast.success(`Your OTP: ${data.devOTP}`, { duration: 10000 })
        }

        // Log email error if present
        if (data.emailError) {
          console.error('Email error:', data.emailError)
        }
      } else {
        toast.error(data.error || 'Failed to resend OTP')
      }
    } catch (error) {
      toast.error('Failed to resend OTP')
    }
    setLoading(false)
  }

  const verifyAndCreateAccount = async () => {
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/auth/register/create-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          otp
        })
      })

      const data = await response.json()
      console.log('Create account response:', data)

      if (response.ok && data.success) {
        toast.success('Account created successfully!')
        setTimeout(() => {
          router.push('/svci-admin-secure-login')
        }, 1500)
      } else {
        toast.error(data.error || 'Failed to create account')
      }
    } catch (error) {
      toast.error('Failed to create account')
    }
    setLoading(false)
  }

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [countdown])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-600 rounded-full mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Registration</h1>
          <p className="text-gray-600 mt-2">Sree Venkatesswara Constructions & Interiors</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            <div className={`flex items-center ${step >= 1 ? 'text-emerald-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-emerald-600 text-white' : 'bg-gray-200'}`}>
                {step > 1 ? <CheckCircle className="w-5 h-5" /> : '1'}
              </div>
              <span className="ml-2 text-sm font-medium">Details</span>
            </div>
            <div className="flex-1 h-1 mx-4 bg-gray-200 rounded">
              <div className={`h-full bg-emerald-600 rounded transition-all ${step >= 2 ? 'w-full' : 'w-0'}`} />
            </div>
            <div className={`flex items-center ${step >= 2 ? 'text-emerald-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-emerald-600 text-white' : 'bg-gray-200'}`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium">Verify</span>
            </div>
          </div>

          {step === 1 ? (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Enter your phone number"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Create a strong password"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Min 8 chars with uppercase, lowercase, number & special character
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Confirm your password"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={sendOTP}
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending OTP...' : 'Continue to Verification'}
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="space-y-5">
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <p className="text-sm text-emerald-800">
                    We've sent a 6-digit verification code to <strong>{formData.email}</strong>
                  </p>
                  <p className="text-xs text-emerald-600 mt-2">
                    💡 Check your email and also look for a toast notification with your OTP
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter OTP *
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-center text-2xl tracking-widest font-mono"
                  />
                </div>

                {countdown > 0 ? (
                  <p className="text-sm text-gray-600 text-center">
                    OTP expires in <span className="font-semibold text-emerald-600">{formatTime(countdown)}</span>
                  </p>
                ) : (
                  <button
                    onClick={resendOTP}
                    disabled={loading}
                    className="w-full text-emerald-600 hover:text-emerald-700 font-medium text-sm disabled:opacity-50"
                  >
                    Resend OTP
                  </button>
                )}

                <button
                  onClick={verifyAndCreateAccount}
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating Account...' : 'Verify & Create Account'}
                  <CheckCircle className="w-5 h-5" />
                </button>

                <button
                  onClick={() => setStep(1)}
                  className="w-full text-gray-600 hover:text-gray-700 font-medium text-sm"
                >
                  ← Back to Details
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <button
              onClick={() => router.push('/svci-admin-secure-login')}
              className="text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Login here
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
