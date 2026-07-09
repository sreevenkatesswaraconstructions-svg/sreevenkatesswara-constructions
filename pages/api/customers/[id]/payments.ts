import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ success: false, message: 'Customer ID is required' })
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  try {
    const invoices = await prisma.invoice.findMany({ where: { customerId: id } })
    const totalInvoices = invoices.length
    const totalInvoiceAmount = invoices.reduce((s, inv) => s + Number(inv.totalAmount || 0), 0)

    const timelinePayments = await prisma.customerTimeline.findMany({ where: { customerId: id, eventType: 'Payment' }, orderBy: { createdAt: 'desc' } })
    let totalPaid = 0
    let lastPaymentDate = null
    for (const t of timelinePayments) {
      try {
        const data = JSON.parse(t.description || '{}')
        const amount = Number(data.amount || 0)
        totalPaid += amount
        if (!lastPaymentDate) lastPaymentDate = t.createdAt
      } catch (e) {
        // ignore
      }
    }

    const outstandingBalance = Math.max(0, totalInvoiceAmount - totalPaid)

    const summary = {
      totalPaid,
      outstandingBalance,
      totalInvoices,
      lastPaymentDate,
    }

    return res.status(200).json({ success: true, data: summary })
  } catch (error) {
    console.error('[CUSTOMER PAYMENTS API] Error:', error)
    return res.status(500).json({ success: false, message: 'Failed to compute payment summary' })
  }
}
