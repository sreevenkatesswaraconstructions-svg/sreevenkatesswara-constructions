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
  console.log('[ADMIN REGISTER] === TEST OTP FLOW API CALLED ===')
  console.log('[ADMIN REGISTER] Timestamp:', new Date().toISOString())
  console.log('[ADMIN REGISTER] Method:', req.method)
  console.log('[ADMIN REGISTER] Body:', JSON.stringify(req.body))

  if (req.method !== 'POST') {
    console.log('[ADMIN REGISTER] Method not allowed')
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { email, name } = req.body

    console.log('[ADMIN REGISTER] === TEST PARAMETERS ===')
    console.log('[ADMIN REGISTER] Email:', email || 'test@example.com')
    console.log('[ADMIN REGISTER] Name:', name || 'Test User')
    console.log('[ADMIN REGISTER] =================================')

    const testEmail = email || 'test@example.com'
    const testName = name || 'Test User'

    // Step 1: Test OTP Generation
    console.log('[ADMIN REGISTER] === STEP 1: OTP GENERATION ===')
    const otp = generateOTP()
    console.log('[ADMIN REGISTER] Generated OTP:', otp)
    console.log('[ADMIN REGISTER] =================================')

    // Step 2: Test OTP Storage
    console.log('[ADMIN REGISTER] === STEP 2: OTP STORAGE ===')
    storeOTP(testEmail, otp, 10)
    console.log('[ADMIN REGISTER] OTP stored for:', testEmail)
    console.log('[ADMIN REGISTER] =================================')

    // Step 3: Test Email Sending
    console.log('[ADMIN REGISTER] === STEP 3: EMAIL SENDING ===')
    const emailResult = await sendOTPEmail({
      to: testEmail,
      name: testName,
      otp: otp,
      expiryMinutes: 10
    })
    console.log('[ADMIN REGISTER] Email result:', JSON.stringify(emailResult))
    console.log('[ADMIN REGISTER] =================================')

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

    console.log('[ADMIN REGISTER] === TEST RESULTS ===')
    console.log('[ADMIN REGISTER]', JSON.stringify(testResults, null, 2))
    console.log('[ADMIN REGISTER] =================================')

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
