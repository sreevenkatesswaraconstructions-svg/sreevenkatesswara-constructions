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

  // Log environment variables (sanitized)

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

    // Generate OTP
    const otp = generateOTP()

    // Store OTP with 10 minute expiry in database
    
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now
    
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
      
      
      // If no record was updated, insert a new one
      if (updateResult === 0) {
        const id = crypto.randomUUID()
        await prisma.$executeRaw`
          INSERT INTO "OTPVerification" ("id", "email", "otpCode", "otpExpiry", "name", "createdAt", "updatedAt")
          VALUES (${id}, ${email}, ${otp}, ${otpExpiry}, ${name}, ${new Date()}, ${new Date()})
        `
      } else {
      }
      
    } catch (dbError: any) {
      console.error('[ADMIN REGISTER] ❌ Database error storing OTP:', dbError)
      console.error('[ADMIN REGISTER] Error message:', dbError?.message)
      console.error('[ADMIN REGISTER] Error code:', dbError?.code)
      throw new Error('Failed to store OTP in database')
    }

    // Log OTP to console for development (in case email fails)

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
        console.error('[ADMIN REGISTER] ❌ Email sending failed:', JSON.stringify(emailResult.error))
        console.error('[ADMIN REGISTER] Error details:', JSON.stringify(emailResult.error, null, 2))
      }
    } catch (error: any) {
      emailError = error
      console.error('[ADMIN REGISTER] ❌ Email sending failed (but OTP is stored):', error)
      console.error('[ADMIN REGISTER] Error stack:', error?.stack || 'No stack available')
      // Continue even if email fails - OTP is stored and logged to console
    }

    const responseData = {
      success: true,
      message: emailSent ? 'OTP sent successfully' : 'OTP generated (email not configured)',
      email: email,
      emailSent: emailSent,
      emailError: emailError ? (emailError as any).message : null,
      // Include OTP in response only for development/testing
      devOTP: process.env.NODE_ENV === 'development' ? otp : null
    }

    
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
