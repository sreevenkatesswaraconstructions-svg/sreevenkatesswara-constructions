import type { NextApiRequest, NextApiResponse } from 'next'
import { generateOTP, storeOTP } from '../../lib/otp'
import { sendOTPEmail } from '../../lib/email'

/**
 * Test OTP Flow API Endpoint
 * 
 * This endpoint tests the complete OTP flow:
 * 1. OTP generation
 * 2. OTP storage
 * 3. Email sending
 * 
 * Usage: POST /api/test-otp-flow with { email, name }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { email, name } = req.body


    const testEmail = email || 'test@example.com'
    const testName = name || 'Test User'

    // Step 1: Test OTP Generation
    const otp = generateOTP()

    // Step 2: Test OTP Storage
    storeOTP(testEmail, otp, 10)

    // Step 3: Test Email Sending
    const emailResult = await sendOTPEmail({
      to: testEmail,
      name: testName,
      otp: otp,
      expiryMinutes: 10
    })

    const testResults = {
      success: true,
      timestamp: new Date().toISOString(),
      steps: {
        otpGeneration: {
          success: true,
          otp: otp,
          otpLength: otp.length
        },
        otpStorage: {
          success: true,
          email: testEmail
        },
        emailSending: {
          success: emailResult.success,
          emailSent: emailResult.success,
          error: emailResult.error ? (emailResult.error as any).message : null,
          data: emailResult.data
        }
      },
      overallSuccess: emailResult.success,
      devOTP: otp
    }


    res.status(200).json(testResults)
  } catch (error: any) {
    console.error('[ADMIN REGISTER] === TEST ERROR ===')
    console.error('[ADMIN REGISTER] Error:', error)
    console.error('[ADMIN REGISTER] Error name:', error?.name)
    console.error('[ADMIN REGISTER] Error message:', error?.message)
    console.error('[ADMIN REGISTER] Error stack:', error?.stack || 'No stack available')
    console.error('[ADMIN REGISTER] =================================')
    
    res.status(500).json({ 
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : String(error)
    })
  }
}
