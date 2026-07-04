import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import AdminLayout from '../../components/admin/AdminLayout'
import { getServerSession } from 'next-auth'
import { authOptions } from '../api/auth/[...nextauth]'
import Toast from '../../components/admin/Toast'
import { Shield, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'
import { signOut } from 'next-auth/react'

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [toast, setToast] = useState(null)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [capsLock, setCapsLock] = useState(false)
  const [strength, setStrength] = useState({ label: 'Weak', score: 0 })
  const router = useRouter()

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/

  useEffect(() => {
    const s = evaluateStrength(newPassword)
    setStrength(s)
  }, [newPassword])

  const evaluateStrength = (pw) => {
    if (!pw) return { label: 'Weak', score: 0 }
    let score = 0
    if (pw.length >= 8) score += 1
    if (pw.length >= 12) score += 1
    if (/[A-Z]/.test(pw)) score += 1
    if (/[a-z]/.test(pw)) score += 1
    if (/[0-9]/.test(pw)) score += 1
    if (/[@$!%*?&]/.test(pw)) score += 1

    if (score >= 5) return { label: 'Strong', score: 100 }
    if (score >= 3) return { label: 'Medium', score: 60 }
    return { label: 'Weak', score: 25 }
  }

  const handleCaps = (e) => {
    try {
      const isOn = e.getModifierState && e.getModifierState('CapsLock')
      setCapsLock(!!isOn)
    } catch (err) {
      setCapsLock(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage(null)
    setLoading(true)

    try {
      if (!currentPassword || !newPassword || !confirmPassword) {
        throw new Error('All fields are required')
      }

      if (newPassword !== confirmPassword) {
        throw new Error('New passwords do not match')
      }

      if (!passwordRegex.test(newPassword)) {
        throw new Error('Password does not meet required strength')
      }

      if (currentPassword === newPassword) {
        throw new Error('New password cannot be the same as current password')
      }

      const res = await fetch('/api/admin/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || data?.error || 'Failed')

      // success: show toast then sign out
      setToast({ type: 'success', message: 'Password changed successfully.' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')

      setTimeout(() => {
        // force sign out and redirect to login with message
        signOut({ callbackUrl: '/svci-admin-secure-login?msg=Please+login+using+your+new+password' })
      }, 900)
    } catch (err) {
      const text = err?.message || 'Failed to change password'
      setToast({ type: 'error', message: text })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-6 h-6 text-emerald-600" />
          <h1 className="text-2xl font-semibold">Change Password</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          {toast && (
            <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Current Password</label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                onKeyDown={handleCaps}
                onKeyUp={handleCaps}
                className="w-full border px-3 py-2 rounded bg-gray-50 dark:bg-gray-700"
                required
              />
              <div className="absolute right-3 top-3 flex items-center gap-2">
                {capsLock && <AlertCircle className="w-4 h-4 text-yellow-500" title="Caps Lock is on" />}
                <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="opacity-80 hover:opacity-100">
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">New Password</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                onKeyDown={handleCaps}
                onKeyUp={handleCaps}
                className="w-full border px-3 py-2 rounded bg-gray-50 dark:bg-gray-700"
                required
              />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-3 opacity-80 hover:opacity-100">
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">At least 8 chars, include uppercase, lowercase, number and special char.</p>

            <div className="mt-3">
              <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded overflow-hidden">
                <div className={`h-2 rounded ${strength.label === 'Strong' ? 'bg-emerald-500' : strength.label === 'Medium' ? 'bg-yellow-400' : 'bg-red-400'}`} style={{ width: `${strength.score}%` }} />
              </div>
              <p className="text-xs mt-2">Strength: <span className="font-medium">{strength.label}</span></p>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Confirm New Password</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={handleCaps}
                onKeyUp={handleCaps}
                className="w-full border px-3 py-2 rounded bg-gray-50 dark:bg-gray-700"
                required
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-3 opacity-80 hover:opacity-100">
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Change Password'}
            </button>
            <button type="button" onClick={() => router.push('/admin/dashboard')} className="px-4 py-2 rounded border">Cancel</button>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}

export async function getServerSideProps(context) {
  const session = await getServerSession(context.req, context.res, authOptions)

  if (!session || !session.user) {
    return {
      redirect: {
        destination: '/svci-admin-secure-login',
        permanent: false,
      },
    }
  }

  // Only allow ADMIN or SUPER_ADMIN
  const role = session.user.role
  if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
    return {
      redirect: {
        destination: '/svci-admin-secure-login',
        permanent: false,
      },
    }
  }

  return { props: {} }
}
