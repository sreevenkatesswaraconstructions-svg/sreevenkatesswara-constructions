import { prisma } from '../../../../../lib/prisma'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ success: false, message: 'Customer ID is required' })
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  return handleGetInvoices(id, res)
}

async function handleGetInvoices(customerId: string, res: NextApiResponse) {
  try {
    const customerExists = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true },
    })

    if (!customerExists) {
      return res.status(404).json({ success: false, message: 'Customer not found' })
    }

    const invoices = await prisma.$queryRawUnsafe<any[]>(
      'SELECT "id", "invoiceNumber", "status", "totalAmount", "dueDate", "createdAt" FROM "Invoice" WHERE "customerId" = $1 ORDER BY "createdAt" DESC',
      customerId,
    )

    return res.status(200).json(Array.isArray(invoices) ? invoices : [])
  } catch (error: any) {
    const message = String(error?.message || '')
    if (message.includes('does not exist') || message.includes('relation') || message.includes('table')) {
      return res.status(200).json([])
    }

    console.error('Error fetching customer invoices:', error)
    return res.status(500).json({ success: false, message: 'Failed to fetch invoices' })
  }
}
