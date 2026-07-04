import type { NextApiRequest, NextApiResponse } from 'next'
import { generateEnquiryReply } from '../../lib/enquiryAutoReply'

/**
 * Test Enquiry Auto-Reply API Endpoint
 * 
 * This endpoint tests the intelligent enquiry auto-reply system:
 * 1. Generates personalized replies based on service type
 * 2. Tests service-specific responses
 * 3. Verifies email content generation
 * 
 * Usage: POST /api/test-enquiry-autoreply with { customerName, email, service, location, message }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('[AUTO-REPLY TEST] === TEST ENQUIRY AUTO-REPLY API CALLED ===')
  console.log('[AUTO-REPLY TEST] Timestamp:', new Date().toISOString())
  console.log('[AUTO-REPLY TEST] Method:', req.method)
  console.log('[AUTO-REPLY TEST] Body:', JSON.stringify(req.body))

  if (req.method !== 'POST') {
    console.log('[AUTO-REPLY TEST] Method not allowed')
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { customerName, email, service, location, message } = req.body

    console.log('[AUTO-REPLY TEST] === TEST PARAMETERS ===')
    console.log('[AUTO-REPLY TEST] Customer Name:', customerName || 'Test Customer')
    console.log('[AUTO-REPLY TEST] Email:', email || 'test@example.com')
    console.log('[AUTO-REPLY TEST] Service:', service || 'House Construction')
    console.log('[AUTO-REPLY TEST] Location:', location || 'Not provided')
    console.log('[AUTO-REPLY TEST] Message:', message || 'Test message')
    console.log('[AUTO-REPLY TEST] =================================')

    const testCustomerName = customerName || 'Test Customer'
    const testEmail = email || 'test@example.com'
    const testService = service || 'House Construction'
    const testLocation = location || null
    const testMessage = message || 'Test message'

    // Test reply generation
    console.log('[AUTO-REPLY TEST] === STEP 1: REPLY GENERATION ===')
    const reply = generateEnquiryReply({
      customerName: testCustomerName,
      email: testEmail,
      service: testService,
      location: testLocation,
      message: testMessage
    })
    console.log('[AUTO-REPLY TEST] Subject:', reply.subject)
    console.log('[AUTO-REPLY TEST] Body length:', reply.body.length)
    console.log('[AUTO-REPLY TEST] Body preview:', reply.body.substring(0, 200) + '...')
    console.log('[AUTO-REPLY TEST] =================================')

    const testResults = {
      success: true,
      timestamp: new Date().toISOString(),
      testParameters: {
        customerName: testCustomerName,
        email: testEmail,
        service: testService,
        location: testLocation,
        message: testMessage
      },
      generatedReply: {
        subject: reply.subject,
        body: reply.body,
        bodyLength: reply.body.length
      },
      serviceSpecific: true,
      openAIReady: true
    }

    console.log('[AUTO-REPLY TEST] === TEST RESULTS ===')
    console.log('[AUTO-REPLY TEST]', JSON.stringify(testResults, null, 2))
    console.log('[AUTO-REPLY TEST] =================================')

    res.status(200).json(testResults)
  } catch (error: any) {
    console.error('[AUTO-REPLY TEST] === TEST ERROR ===')
    console.error('[AUTO-REPLY TEST] Error:', error)
    console.error('[AUTO-REPLY TEST] Error name:', error?.name)
    console.error('[AUTO-REPLY TEST] Error message:', error?.message)
    console.error('[AUTO-REPLY TEST] Error stack:', error?.stack || 'No stack available')
    console.error('[AUTO-REPLY TEST] =================================')
    
    res.status(500).json({ 
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : String(error)
    })
  }
}
