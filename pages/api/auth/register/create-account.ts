import type { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcryptjs'
import { prisma } from '../../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('[ADMIN REGISTER] === CREATE ACCOUNT API CALLED ===')
  console.log('[ADMIN REGISTER] Timestamp:', new Date().toISOString())
  console.log('[ADMIN REGISTER] Method:', req.method)
  console.log('[ADMIN REGISTER] Body:', JSON.stringify(req.body))

  if (req.method !== 'POST') {
    console.log('[ADMIN REGISTER] Method not allowed')
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { email, name, password, phone, otp } = req.body

    console.log('[ADMIN REGISTER] Email:', email)
    console.log('[ADMIN REGISTER] Name:', name)
    console.log('[ADMIN REGISTER] Phone:', phone)
    console.log('[ADMIN REGISTER] OTP:', otp)
    console.log('[ADMIN REGISTER] Password length:', password?.length || 0)

    if (!email || !name || !password || !otp) {
      console.log('[ADMIN REGISTER] Missing required fields')
      return res.status(400).json({ success: false, error: 'Email, name, password, and OTP are required' })
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    if (!passwordRegex.test(password)) {
      console.log('[ADMIN REGISTER] Password validation failed')
      return res.status(400).json({ 
        success: false,
        error: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character' 
      })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.log('[ADMIN REGISTER] Invalid email format')
      return res.status(400).json({ success: false, error: 'Invalid email format' })
    }

    // Check if user already exists
    console.log('[ADMIN REGISTER] Checking if user already exists...')
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })
    console.log('[ADMIN REGISTER] Existing user:', existingUser ? 'YES' : 'NO')

    if (existingUser) {
      console.log('[ADMIN REGISTER] User already exists with this email')
      return res.status(400).json({ success: false, error: 'User with this email already exists' })
    }

    // Verify OTP from database
    console.log('[ADMIN REGISTER] === OTP VERIFICATION FROM DATABASE ===')
    console.log('[ADMIN REGISTER] Fetching OTP record for email:', email)
    
    let otpRecord: any
    try {
      // Use raw SQL to fetch OTP verification record
      const records = await prisma.$queryRaw`
        SELECT * FROM "OTPVerification" 
        WHERE "email" = ${email}
        LIMIT 1
      `
      otpRecord = Array.isArray(records) && records.length > 0 ? records[0] : null
      console.log('[ADMIN REGISTER] OTP Record found:', otpRecord ? 'YES' : 'NO')
      if (otpRecord) {
        console.log('[ADMIN REGISTER] OTP Record ID:', otpRecord.id)
        console.log('[ADMIN REGISTER] OTP Record Email:', otpRecord.email)
        console.log('[ADMIN REGISTER] OTP Code (from DB):', otpRecord.otpCode)
        console.log('[ADMIN REGISTER] OTP Expiry (from DB):', otpRecord.otpExpiry)
      }
    } catch (dbError: any) {
      console.error('[ADMIN REGISTER] ❌ Database error fetching OTP:', dbError)
      console.error('[ADMIN REGISTER] Error message:', dbError?.message)
      return res.status(500).json({ success: false, error: 'Failed to verify OTP' })
    }
    
    if (!otpRecord) {
      console.log('[ADMIN REGISTER] ❌ No OTP record found for email')
      return res.status(400).json({ success: false, error: 'No OTP found for this email. Please request a new OTP.' })
    }
    
    // Check if OTP has expired
    const now = new Date()
    const otpExpiry = new Date(otpRecord.otpExpiry)
    console.log('[ADMIN REGISTER] Current time:', now.toISOString())
    console.log('[ADMIN REGISTER] OTP expiry time:', otpExpiry.toISOString())
    console.log('[ADMIN REGISTER] OTP expired:', now > otpExpiry)
    
    if (now > otpExpiry) {
      console.log('[ADMIN REGISTER] ❌ OTP has expired')
      // Clean up expired OTP record
      try {
        await prisma.$executeRaw`DELETE FROM "OTPVerification" WHERE "email" = ${email}`
        console.log('[ADMIN REGISTER] Cleaned up expired OTP record')
      } catch (cleanupError: any) {
        console.error('[ADMIN REGISTER] Error cleaning up expired OTP:', cleanupError?.message)
      }
      return res.status(400).json({ success: false, error: 'OTP has expired. Please request a new OTP.' })
    }
    
    // Verify OTP code matches
    console.log('[ADMIN REGISTER] Comparing OTP codes...')
    console.log('[ADMIN REGISTER] Provided OTP:', otp)
    console.log('[ADMIN REGISTER] Stored OTP:', otpRecord.otpCode)
    
    if (otpRecord.otpCode !== otp) {
      console.log('[ADMIN REGISTER] ❌ OTP mismatch')
      return res.status(400).json({ success: false, error: 'Invalid OTP. Please check and try again.' })
    }
    
    console.log('[ADMIN REGISTER] ✅ OTP verified successfully')
    
    // Clear OTP from database after successful verification
    console.log('[ADMIN REGISTER] Clearing OTP from database...')
    try {
      await prisma.$executeRaw`DELETE FROM "OTPVerification" WHERE "email" = ${email}`
      console.log('[ADMIN REGISTER] ✅ OTP cleared from database')
    } catch (cleanupError: any) {
      console.error('[ADMIN REGISTER] ⚠️  Error clearing OTP from database:', cleanupError?.message)
      // Continue with account creation even if cleanup fails
    }
    console.log('[ADMIN REGISTER] =================================')

    // Hash password
    console.log('[ADMIN REGISTER] Hashing password...')
    const hashedPassword = await bcrypt.hash(password, 12)
    console.log('[ADMIN REGISTER] Password hashed successfully')

    // Create user with SUPER_ADMIN role (first user gets admin access)
    console.log('[ADMIN REGISTER] Counting existing users...')
    const userCount = await prisma.user.count()
    console.log('[ADMIN REGISTER] Current user count:', userCount)
    const role = userCount === 0 ? 'SUPER_ADMIN' : 'ADMIN'
    console.log('[ADMIN REGISTER] Assigned role:', role)

    console.log('[ADMIN REGISTER] Creating user in database...')
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
    console.log('[ADMIN REGISTER] ✅ User created successfully')
    console.log('[ADMIN REGISTER] User ID:', user.id)
    console.log('[ADMIN REGISTER] User email:', user.email)

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
