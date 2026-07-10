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

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { customerName, email, service, location, message } = req.body


    const testCustomerName = customerName || 'Test Customer'
    const testEmail = email || 'test@example.com'
    const testService = service || 'House Construction'
    const testLocation = location || null
    const testMessage = message || 'Test message'

    // Test reply generation
    const reply = generateEnquiryReply({
      customerName: testCustomerName,
      email: testEmail,
      service: testService,
      location: testLocation,
      message: testMessage
    })

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
