import type { NextApiRequest, NextApiResponse } from 'next'
import { generateOTP } from '../../../lib/otp'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('=== TEST OTP API CALLED ===')

  try {
    const otp = generateOTP()
    console.log('Generated OTP:', otp)

    res.status(200).json({
      message: 'OTP generated successfully',
      otp: otp,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error generating OTP:', error)
    res.status(500).json({ error: 'Failed to generate OTP' })
  }
}
