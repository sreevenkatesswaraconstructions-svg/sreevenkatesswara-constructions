import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query
  if (!id || typeof id !== 'string') return res.status(400).json({ success: false, message: 'Invoice id is required' })

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  const { paymentDate, amountPaid, method, referenceNumber, notes } = req.body || {}
  if (!paymentDate || typeof amountPaid !== 'number' || Number.isNaN(amountPaid)) {
    return res.status(400).json({ success: false, message: 'paymentDate and numeric amountPaid are required' })
  }

  try {
    const invoice = await prisma.invoice.findUnique({ where: { id } })
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' })

    // Create a timeline entry to represent this payment (uses existing model)
    const paymentRecord = await prisma.customerTimeline.create({
      data: {
        customerId: invoice.customerId || '',
        eventType: 'Payment',
        title: `Payment received - ₹${Number(amountPaid).toLocaleString('en-IN')}`,
        description: JSON.stringify({ invoiceId: id, amount: amountPaid, method, referenceNumber, notes, paymentDate }),
        source: 'MANUAL',
        createdBy: 'Admin',
      },
    })

    // Calculate total paid for this invoice by summing timeline entries that reference this invoice
    const timelineEntries = await prisma.customerTimeline.findMany({ where: { customerId: invoice.customerId || '', eventType: 'Payment' } })
    let invoiceTotalPaid = 0
    for (const t of timelineEntries) {
      try {
        const data = JSON.parse(t.description || '{}')
        if (data && data.invoiceId === id) invoiceTotalPaid += Number(data.amount || 0)
      } catch (e) {
        // ignore parse errors
      }
    }

    // Determine new invoice status
    let newStatus = invoice.status || 'Draft'
    if (invoiceTotalPaid >= Number(invoice.totalAmount || 0)) newStatus = 'Paid'
    else if (invoiceTotalPaid > 0 && invoiceTotalPaid < Number(invoice.totalAmount || 0)) newStatus = 'Partially Paid'

    // Update invoice status
    await prisma.invoice.update({ where: { id }, data: { status: newStatus } })

    return res.status(200).json({ success: true, data: paymentRecord })
  } catch (error) {
    console.error('[RECORD PAYMENT API] Error:', error)
    return res.status(500).json({ success: false, message: 'Failed to record payment' })
  }
}
