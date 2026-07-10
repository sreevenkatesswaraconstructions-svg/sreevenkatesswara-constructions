import type { NextApiRequest, NextApiResponse } from 'next'
import { verifyOTP } from '../../../../lib/otp'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { email, otp } = req.body


    if (!email || !otp) {
      return res.status(400).json({ success: false, error: 'Email and OTP are required' })
    }

    // Verify OTP
    const isValid = verifyOTP(email, otp)

    if (!isValid) {
      return res.status(400).json({ success: false, error: 'Invalid or expired OTP' })
    }

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
