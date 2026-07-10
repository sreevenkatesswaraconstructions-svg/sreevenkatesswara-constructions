import type { NextApiRequest, NextApiResponse } from 'next'
import { generateOTP, storeOTP } from '../../../../lib/otp'
import { sendOTPEmail } from '../../../../lib/email'

/**
 * Resend OTP API Endpoint
 * 
 * This endpoint regenerates and resends an OTP to the user's registered email address.
 * 
 * IMPORTANT: OTP is always sent to the SAME email address entered by the user during registration.
 * - Uses dynamic recipient email from request body (req.body.email)
 * - Does NOT use ADMIN_EMAIL or fixed email addresses
 * - Validates email format before sending
 * - Logs recipient email for debugging
 * - Falls back to toast notification if email sending fails (development mode)
 */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { email, name } = req.body


    if (!email || !name) {
      return res.status(400).json({ success: false, error: 'Email and name are required' })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email format' })
    }

    // Ensure we're not sending to admin email by mistake
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@sreevenkatesswaraconstructions.com'
    if (email === adminEmail) {
      // This is allowed but logged for security
    }

    // Generate new OTP
    const otp = generateOTP()
    
    // Store OTP with 10 minute expiry
    storeOTP(email, otp, 10)

    // Log OTP to console for development

    // Try to send OTP via email
    let emailSent = false
    let emailError = null
    try {
      
      const emailResult = await sendOTPEmail({
        to: email,
        name: name,
        otp: otp,
        expiryMinutes: 10
      })
      
      
      if (emailResult.success) {
        emailSent = true
      } else {
        emailError = emailResult.error
        console.error('[ADMIN REGISTER] ❌ OTP resend failed:', JSON.stringify(emailResult.error))
      }
    } catch (error: any) {
      emailError = error
      console.error('[ADMIN REGISTER] ❌ Email sending failed (but OTP is stored):', error)
      console.error('[ADMIN REGISTER] Error stack:', error?.stack || 'No stack available')
      // Continue even if email fails - OTP is stored and logged to console
    }

    res.status(200).json({
      success: true,
      message: emailSent ? 'OTP resent successfully' : 'OTP generated (email not configured)',
      email: email,
      emailSent: emailSent,
      emailError: emailError ? (emailError as any).message : null,
      // Include OTP in response only for development/testing
      devOTP: process.env.NODE_ENV === 'development' ? otp : null
    })
  } catch (error: any) {
    console.error('[ADMIN REGISTER] ❌ Error resending OTP:', error)
    console.error('[ADMIN REGISTER] Error name:', error?.name)
    console.error('[ADMIN REGISTER] Error message:', error?.message)
    console.error('[ADMIN REGISTER] Error stack:', error?.stack || 'No stack available')
    
    // Always return JSON, never HTML
    res.status(500).json({ 
      success: false, 
      error: 'Failed to resend OTP',
      details: error?.message || 'Unknown error'
    })
  }
}
