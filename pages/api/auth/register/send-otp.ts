import type { NextApiRequest, NextApiResponse } from 'next'
import crypto from 'crypto'
import { generateOTP } from '../../../../lib/otp'
import { sendOTPEmail } from '../../../../lib/email'
import { prisma } from '../../../../lib/prisma'

/**
 * Send OTP API Endpoint
 * 
 * This endpoint generates and sends an OTP to the user's registered email address.
 * 
 * IMPORTANT: OTP is always sent to the SAME email address entered by the user during registration.
 * - Uses dynamic recipient email from request body (req.body.email)
 * - Does NOT use ADMIN_EMAIL or fixed email addresses
 * - Validates email format before sending
 * - Logs recipient email for debugging
 * - Falls back to toast notification if email sending fails (development mode)
 * 
 * Flow:
 * 1. User enters email and name in registration form
 * 2. Frontend sends POST request with { email, name }
 * 3. Backend generates 6-digit OTP
 * 4. Backend stores OTP with 10-minute expiry
 * 5. Backend sends OTP email to the user's email address
 * 6. Frontend shows success/error message
 * 7. In development, OTP is also shown in toast notification
 */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('[ADMIN REGISTER] === SEND OTP API CALLED ===')
  console.log('[ADMIN REGISTER] Timestamp:', new Date().toISOString())
  console.log('[ADMIN REGISTER] Method:', req.method)
  console.log('[ADMIN REGISTER] Body:', JSON.stringify(req.body))
  console.log('[ADMIN REGISTER] Headers:', JSON.stringify(req.headers))

  // Log environment variables (sanitized)
  console.log('[ADMIN REGISTER] === ENVIRONMENT VARIABLES CHECK ===')
  console.log('[ADMIN REGISTER] RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY)
  console.log('[ADMIN REGISTER] RESEND_API_KEY length:', process.env.RESEND_API_KEY?.length || 0)
  console.log('[ADMIN REGISTER] FROM_EMAIL:', process.env.FROM_EMAIL)
  console.log('[ADMIN REGISTER] NODE_ENV:', process.env.NODE_ENV)
  console.log('[ADMIN REGISTER] DATABASE_URL exists:', !!process.env.DATABASE_URL)
  console.log('[ADMIN REGISTER] =================================')

  if (req.method !== 'POST') {
    console.log('[ADMIN REGISTER] Method not allowed')
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { email, name } = req.body

    console.log('[ADMIN REGISTER] === REQUEST DATA ===')
    console.log('[ADMIN REGISTER] Email:', email)
    console.log('[ADMIN REGISTER] Name:', name)
    console.log('[ADMIN REGISTER] =================================')

    if (!email || !name) {
      console.log('[ADMIN REGISTER] Missing email or name')
      return res.status(400).json({ success: false, error: 'Email and name are required' })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.log('[ADMIN REGISTER] Invalid email format')
      return res.status(400).json({ success: false, error: 'Invalid email format' })
    }

    // Ensure we're not sending to admin email by mistake
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@sreevenkatesswaraconstructions.com'
    if (email === adminEmail) {
      console.log('[ADMIN REGISTER] Warning: Attempting to send OTP to admin email')
      // This is allowed but logged for security
    }

    // Generate OTP
    console.log('[ADMIN REGISTER] === OTP GENERATION ===')
    console.log('[ADMIN REGISTER] Calling generateOTP()...')
    const otp = generateOTP()
    console.log('[ADMIN REGISTER] Generated OTP:', otp)
    console.log('[ADMIN REGISTER] OTP length:', otp.length)
    console.log('[ADMIN REGISTER] =================================')

    // Store OTP with 10 minute expiry in database
    console.log('[ADMIN REGISTER] === OTP DATABASE STORAGE ===')
    console.log('[ADMIN REGISTER] Storing OTP for email:', email)
    console.log('[ADMIN REGISTER] Expiry: 10 minutes')
    
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now
    console.log('[ADMIN REGISTER] OTP expiry timestamp:', otpExpiry.toISOString())
    
    try {
      // Use raw SQL to upsert OTP verification record
      // First try to update existing record
      const updateResult = await prisma.$executeRaw`
        UPDATE "OTPVerification" 
        SET "otpCode" = ${otp}, 
            "otpExpiry" = ${otpExpiry}, 
            "name" = ${name},
            "updatedAt" = ${new Date()}
        WHERE "email" = ${email}
      `
      
      console.log('[ADMIN REGISTER] Update result:', updateResult)
      
      // If no record was updated, insert a new one
      if (updateResult === 0) {
        const id = crypto.randomUUID()
        await prisma.$executeRaw`
          INSERT INTO "OTPVerification" ("id", "email", "otpCode", "otpExpiry", "name", "createdAt", "updatedAt")
          VALUES (${id}, ${email}, ${otp}, ${otpExpiry}, ${name}, ${new Date()}, ${new Date()})
        `
        console.log('[ADMIN REGISTER] Inserted new OTP record')
      } else {
        console.log('[ADMIN REGISTER] Updated existing OTP record')
      }
      
      console.log('[ADMIN REGISTER] ✅ OTP stored in database successfully')
      console.log('[ADMIN REGISTER] Email:', email)
      console.log('[ADMIN REGISTER] OTP Code (stored):', otp)
      console.log('[ADMIN REGISTER] OTP Expiry:', otpExpiry.toISOString())
    } catch (dbError: any) {
      console.error('[ADMIN REGISTER] ❌ Database error storing OTP:', dbError)
      console.error('[ADMIN REGISTER] Error message:', dbError?.message)
      console.error('[ADMIN REGISTER] Error code:', dbError?.code)
      throw new Error('Failed to store OTP in database')
    }
    console.log('[ADMIN REGISTER] =================================')

    // Log OTP to console for development (in case email fails)
    console.log('[ADMIN REGISTER] =================================')
    console.log('[ADMIN REGISTER] DEV MODE - OTP for', email)
    console.log('[ADMIN REGISTER] OTP:', otp)
    console.log('[ADMIN REGISTER] =================================')

    // Try to send OTP via email
    console.log('[ADMIN REGISTER] === EMAIL SENDING ===')
    let emailSent = false
    let emailError = null
    try {
      console.log('[ADMIN REGISTER] Attempting to send email to:', email)
      console.log('[ADMIN REGISTER] Recipient email validation:', email)
      console.log('[ADMIN REGISTER] Calling sendOTPEmail() with params:', {
        to: email,
        name: name,
        otp: otp,
        expiryMinutes: 10
      })
      
      const emailResult = await sendOTPEmail({
        to: email,
        name: name,
        otp: otp,
        expiryMinutes: 10
      })
      
      console.log('[ADMIN REGISTER] Email API Response:', JSON.stringify(emailResult))
      
      if (emailResult.success) {
        emailSent = true
        console.log('[ADMIN REGISTER] ✅ Email sent successfully to:', email)
        console.log('[ADMIN REGISTER] Email data:', JSON.stringify(emailResult.data))
      } else {
        emailError = emailResult.error
        console.error('[ADMIN REGISTER] ❌ Email sending failed:', JSON.stringify(emailResult.error))
        console.error('[ADMIN REGISTER] Error details:', JSON.stringify(emailResult.error, null, 2))
      }
    } catch (error: any) {
      emailError = error
      console.error('[ADMIN REGISTER] ❌ Email sending failed (but OTP is stored):', error)
      console.error('[ADMIN REGISTER] Error stack:', error?.stack || 'No stack available')
      // Continue even if email fails - OTP is stored and logged to console
    }
    console.log('[ADMIN REGISTER] =================================')

    const responseData = {
      success: true,
      message: emailSent ? 'OTP sent successfully' : 'OTP generated (email not configured)',
      email: email,
      emailSent: emailSent,
      emailError: emailError ? (emailError as any).message : null,
      // Include OTP in response only for development/testing
      devOTP: process.env.NODE_ENV === 'development' ? otp : null
    }

    console.log('[ADMIN REGISTER] === API RESPONSE ===')
    console.log('[ADMIN REGISTER] Response data:', JSON.stringify(responseData))
    console.log('[ADMIN REGISTER] Toast trigger status:', emailSent ? 'SUCCESS' : 'FALLBACK')
    console.log('[ADMIN REGISTER] =================================')
    
    res.status(200).json(responseData)
  } catch (error: any) {
    console.error('[ADMIN REGISTER] === UNEXPECTED ERROR ===')
    console.error('[ADMIN REGISTER] Error in OTP endpoint:', error)
    console.error('[ADMIN REGISTER] Error name:', error?.name)
    console.error('[ADMIN REGISTER] Error message:', error?.message)
    console.error('[ADMIN REGISTER] Error stack:', error?.stack || 'No stack available')
    console.error('[ADMIN REGISTER] =================================')
    
    // Always return JSON, never HTML
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send OTP',
      details: error?.message || 'Unknown error'
    })
  }
}
