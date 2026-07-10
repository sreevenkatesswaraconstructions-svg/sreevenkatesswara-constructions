import type { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcryptjs'
import { prisma } from '../../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { email, name, password, phone, otp } = req.body


    if (!email || !name || !password || !otp) {
      return res.status(400).json({ success: false, error: 'Email, name, password, and OTP are required' })
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ 
        success: false,
        error: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character' 
      })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email format' })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return res.status(400).json({ success: false, error: 'User with this email already exists' })
    }

    // Verify OTP from database
    
    let otpRecord: any
    try {
      // Use raw SQL to fetch OTP verification record
      const records = await prisma.$queryRaw`
        SELECT * FROM "OTPVerification" 
        WHERE "email" = ${email}
        LIMIT 1
      `
      otpRecord = Array.isArray(records) && records.length > 0 ? records[0] : null
      if (otpRecord) {
      }
    } catch (dbError: any) {
      console.error('[ADMIN REGISTER] ❌ Database error fetching OTP:', dbError)
      console.error('[ADMIN REGISTER] Error message:', dbError?.message)
      return res.status(500).json({ success: false, error: 'Failed to verify OTP' })
    }
    
    if (!otpRecord) {
      return res.status(400).json({ success: false, error: 'No OTP found for this email. Please request a new OTP.' })
    }
    
    // Check if OTP has expired
    const now = new Date()
    const otpExpiry = new Date(otpRecord.otpExpiry)
    
    if (now > otpExpiry) {
      // Clean up expired OTP record
      try {
        await prisma.$executeRaw`DELETE FROM "OTPVerification" WHERE "email" = ${email}`
      } catch (cleanupError: any) {
        console.error('[ADMIN REGISTER] Error cleaning up expired OTP:', cleanupError?.message)
      }
      return res.status(400).json({ success: false, error: 'OTP has expired. Please request a new OTP.' })
    }
    
    // Verify OTP code matches
    
    if (otpRecord.otpCode !== otp) {
      return res.status(400).json({ success: false, error: 'Invalid OTP. Please check and try again.' })
    }
    
    
    // Clear OTP from database after successful verification
    try {
      await prisma.$executeRaw`DELETE FROM "OTPVerification" WHERE "email" = ${email}`
    } catch (cleanupError: any) {
      console.error('[ADMIN REGISTER] ⚠️  Error clearing OTP from database:', cleanupError?.message)
      // Continue with account creation even if cleanup fails
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user with SUPER_ADMIN role (first user gets admin access)
    const userCount = await prisma.user.count()
    const role = userCount === 0 ? 'SUPER_ADMIN' : 'ADMIN'

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        phone: phone || null,
        role,
        emailVerified: true
      }
    })

    res.status(201).json({ 
      success: true,
      message: 'Account created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    })
  } catch (error: any) {
    console.error('[ADMIN REGISTER] ❌ Error creating account:', error)
    console.error('[ADMIN REGISTER] Error name:', error?.name)
    console.error('[ADMIN REGISTER] Error message:', error?.message)
    console.error('[ADMIN REGISTER] Error stack:', error?.stack || 'No stack available')
    console.error('[ADMIN REGISTER] Error code:', error?.code)
    
    // Always return JSON, never HTML
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create account',
      details: error?.message || 'Unknown error'
    })
  }
}
