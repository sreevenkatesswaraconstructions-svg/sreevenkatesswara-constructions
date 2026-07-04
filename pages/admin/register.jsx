import { useState } from 'react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import { Mail, Lock, User, Phone, ArrowRight, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminRegister() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 1: Email & Name
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  // Step 2: OTP
  const [otp, setOtp] = useState('')

  // Step 3: Password
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleSendOTP = async (e) => {
    console.log('=== ADMIN REGISTER FRONTEND SEND OTP ===');
    e.preventDefault()
    setError('')
    setLoading(true)
    console.log('Email:', email)
    console.log('Name:', name)

    try {
      const response = await fetch('/api/auth/register/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name })
      })

      console.log('Response status:', response.status)
      const data = await response.json()
      console.log('Response data:', data)
      console.log('Success:', data.success)
      console.log('emailSent:', data.emailSent)
      console.log('devOTP:', data.devOTP)
      console.log('emailError:', data.emailError)

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to send OTP')
      }

      console.log('✅ API request successful');
      console.log('Triggering toast: OTP sent to email');
      toast.success('OTP sent to your email')
      
      // In development, show OTP in toast for easier testing
      if (data.devOTP) {
        console.log('Triggering dev OTP toast:', data.devOTP);
        toast.success(`Development OTP: ${data.devOTP}`, { duration: 10000 })
      }
      
      setStep(2)
    } catch (error) {
      console.error('❌ Error sending OTP:', error)
      setError(error.message)
      toast.error('Failed to send OTP')
    } finally {
      setLoading(false)
    }
    console.log('=== ADMIN REGISTER SEND OTP COMPLETE ===');
  }

  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/register/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      })

      const data = await response.json()
      console.log('Verify OTP response:', data)

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Invalid OTP')
      }

      toast.success('OTP verified')
      setStep(3)
    } catch (error) {
      setError(error.message)
      toast.error('Invalid OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAccount = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      toast.error('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      toast.error('Password too short')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/register/create-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, password, phone, otp })
      })

      const data = await response.json()
      console.log('Create account response:', data)

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create account')
      }

      toast.success('Account created successfully!')
      setTimeout(() => {
        router.push('/admin/login')
      }, 1500)
    } catch (error) {
      setError(error.message)
      toast.error('Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Create Admin Account
            </h1>
            <p className="text-gray-600">
              Sree Venkatesswara Constructions & Interiors
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step >= s
                      ? 'bg-teal-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step > s ? <CheckCircle className="w-4 h-4" /> : s}
                </div>
                {s < 3 && (
                  <div
                    className={`w-12 h-1 ${
                      step > s ? 'bg-teal-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </motion.div>
          )}

          {/* Step 1: Email & Name */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <form onSubmit={handleSendOTP} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition"
                      placeholder="john@example.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number (Optional)
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-teal-600 to-teal-700 text-white py-3 rounded-lg font-semibold hover:from-teal-700 hover:to-teal-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      Send OTP
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          )}

          {/* Step 2: Verify OTP */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <form onSubmit={handleVerifyOTP} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter OTP
                  </label>
                  <p className="text-sm text-gray-500 mb-3">
                    Enter the 6-digit code sent to {email}
                  </p>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition text-center text-2xl tracking-widest font-mono"
                    placeholder="000000"
                    maxLength={6}
                    required
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-teal-600 to-teal-700 text-white py-3 rounded-lg font-semibold hover:from-teal-700 hover:to-teal-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        Verify OTP
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Step 3: Set Password */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <form onSubmit={handleCreateAccount} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-teal-600 to-teal-700 text-white py-3 rounded-lg font-semibold hover:from-teal-700 hover:to-teal-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        Create Account
                        <CheckCircle className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/admin/login')}
              className="text-teal-600 hover:text-teal-700 text-sm font-medium"
            >
              Already have an account? Sign In
            </button>
          </div>
        </div>

        <p className="text-center text-gray-400 text-sm mt-6">
          © 2026 Sree Venkatesswara Constructions & Interiors
        </p>
      </motion.div>
    </div>
  )
}

export const getServerSideProps = async (context) => {
  return {
    props: {},
  }
}
