import type { NextApiRequest, NextApiResponse } from 'next'
import { verifyOTP } from '../../../../lib/otp'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('[ADMIN REGISTER] === VERIFY OTP API CALLED ===')
  console.log('[ADMIN REGISTER] Timestamp:', new Date().toISOString())
  console.log('[ADMIN REGISTER] Method:', req.method)
  console.log('[ADMIN REGISTER] Body:', JSON.stringify(req.body))

  if (req.method !== 'POST') {
    console.log('[ADMIN REGISTER] Method not allowed')
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { email, otp } = req.body

    console.log('[ADMIN REGISTER] Email:', email)
    console.log('[ADMIN REGISTER] OTP:', otp)

    if (!email || !otp) {
      console.log('[ADMIN REGISTER] Missing email or OTP')
      return res.status(400).json({ success: false, error: 'Email and OTP are required' })
    }

    // Verify OTP
    console.log('[ADMIN REGISTER] Verifying OTP...')
    const isValid = verifyOTP(email, otp)
    console.log('[ADMIN REGISTER] OTP valid:', isValid)

    if (!isValid) {
      console.log('[ADMIN REGISTER] Invalid or expired OTP')
      return res.status(400).json({ success: false, error: 'Invalid or expired OTP' })
    }

    console.log('[ADMIN REGISTER] ✅ OTP verified successfully')
    res.status(200).json({ 
      success: true,
      message: 'OTP verified successfully',
      email: email
    })
  } catch (error: any) {
    console.error('[ADMIN REGISTER] ❌ Error verifying OTP:', error)
    console.error('[ADMIN REGISTER] Error name:', error?.name)
    console.error('[ADMIN REGISTER] Error message:', error?.message)
    console.error('[ADMIN REGISTER] Error stack:', error?.stack || 'No stack available')
    
    // Always return JSON, never HTML
    res.status(500).json({ 
      success: false, 
      error: 'Failed to verify OTP',
      details: error?.message || 'Unknown error'
    })
  }
}
