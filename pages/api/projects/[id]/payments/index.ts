import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../../../lib/prisma'

function getParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0]
  return value
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const projectId = getParam(req.query.id)

  if (!projectId) {
    return res.status(400).json({ error: 'Invalid project id' })
  }

  if (req.method === 'GET') {
    try {
      const project = await prisma.project.findUnique({ where: { id: projectId } })

      if (!project) {
        return res.status(404).json({ error: 'Project not found' })
      }

      const payments = await prisma.projectPayment.findMany({
        where: { projectId },
        orderBy: { paymentDate: 'desc' },
      })

      return res.status(200).json(payments)
    } catch (error) {
      console.error('[PROJECT PAYMENTS API] Error fetching payments:', error)
      return res.status(500).json({ error: 'Failed to fetch project payments' })
    }
  }

  if (req.method === 'POST') {
    try {
      const { paymentDate, amount, paymentMode, paymentType, referenceNumber, notes } = req.body || {}

      if (!paymentDate || !amount || !paymentMode) {
        return res.status(400).json({ error: 'Payment date, amount, and payment mode are required' })
      }

      const parsedAmount = Number(amount)
      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({ error: 'Amount must be greater than zero' })
      }

      const project = await prisma.project.findUnique({ where: { id: projectId } })
      if (!project) {
        return res.status(404).json({ error: 'Project not found' })
      }

      const validPaymentTypes = ['Advance', 'FirstInstallment', 'SecondInstallment', 'ThirdInstallment', 'FinalPayment', 'ExtraWork', 'Refund', 'Other']
      const normalizedPaymentType = paymentType && validPaymentTypes.includes(paymentType) ? paymentType : 'Other'

      const payment = await prisma.projectPayment.create({
        data: {
          projectId,
          paymentDate: new Date(paymentDate),
          amount: parsedAmount,
          paymentMode: String(paymentMode),
          paymentType: normalizedPaymentType as any,
          referenceNumber: referenceNumber ? String(referenceNumber) : null,
          notes: notes ? String(notes) : null,
        },
      })

      return res.status(201).json(payment)
    } catch (error) {
      console.error('[PROJECT PAYMENTS API] Error creating payment:', error)
      return res.status(500).json({ error: 'Failed to create project payment' })
    }
  }

  res.setHeader('Allow', ['GET', 'POST'])
  return res.status(405).json({ error: 'Method not allowed' })
}
