import type { NextApiRequest, NextApiResponse } from 'next'

/**
 * Debug Email Configuration API Endpoint
 * 
 * This endpoint checks the email configuration and returns diagnostic information
 * Usage: GET /api/debug-email-config
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('[DEBUG] === EMAIL CONFIGURATION DEBUG ===')
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const config = {
    resendApiKeyExists: !!process.env.RESEND_API_KEY,
    resendApiKeyLength: process.env.RESEND_API_KEY?.length || 0,
    resendApiKeyPrefix: process.env.RESEND_API_KEY?.substring(0, 10) + '...' || 'N/A',
    fromEmail: process.env.FROM_EMAIL || 'onboarding@resend.dev',
    adminEmail: process.env.ADMIN_EMAIL || 'Not configured',
    databaseUrlExists: !!process.env.DATABASE_URL,
    nodeEnv: process.env.NODE_ENV || 'development'
  }

  console.log('[DEBUG] Configuration:', JSON.stringify(config, null, 2))

  const issues: string[] = []
  if (!config.resendApiKeyExists) {
    issues.push('❌ RESEND_API_KEY is not configured in .env file')
  } else if (config.resendApiKeyLength < 10) {
    issues.push('⚠️ RESEND_API_KEY appears to be too short')
  }
  if (!config.databaseUrlExists) {
    issues.push('❌ DATABASE_URL is not configured')
  }

  const diagnostics = {
    timestamp: new Date().toISOString(),
    configuration: config,
    issues: issues,
    status: issues.length === 0 ? '✅ All configurations look good' : '⚠️ Configuration issues detected',
    recommendations: [
      'Ensure RESEND_API_KEY is set in .env file',
      'Ensure FROM_EMAIL is configured (default: onboarding@resend.dev)',
      'Restart the server after changing .env file',
      'Check Resend dashboard for API key status'
    ]
  }

  console.log('[DEBUG] Diagnostics:', JSON.stringify(diagnostics, null, 2))
  console.log('[DEBUG] =================================')

  res.status(200).json(diagnostics)
}
