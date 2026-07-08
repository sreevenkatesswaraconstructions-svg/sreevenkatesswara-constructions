import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../../../lib/prisma'

function getParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0]
  return value
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const projectId = getParam(req.query.id)
  const paymentId = getParam(req.query.paymentId)

  if (!projectId || !paymentId) {
    return res.status(400).json({ error: 'Invalid project or payment id' })
  }

  if (req.method === 'PUT') {
    try {
      const { paymentDate, amount, paymentMode, paymentType, referenceNumber, notes } = req.body || {}

      const parsedAmount = amount === undefined ? undefined : Number(amount)
      if (parsedAmount !== undefined && (!Number.isFinite(parsedAmount) || parsedAmount <= 0)) {
        return res.status(400).json({ error: 'Amount must be greater than zero' })
      }

      const validPaymentTypes = ['Advance', 'FirstInstallment', 'SecondInstallment', 'ThirdInstallment', 'FinalPayment', 'ExtraWork', 'Refund', 'Other']
      const normalizedPaymentType = paymentType && validPaymentTypes.includes(paymentType) ? (paymentType as any) : undefined

      const payment = await prisma.projectPayment.update({
        where: { id: paymentId },
        data: {
          ...(paymentDate !== undefined && { paymentDate: new Date(paymentDate) }),
          ...(parsedAmount !== undefined && { amount: parsedAmount }),
          ...(paymentMode !== undefined && { paymentMode: String(paymentMode) }),
          ...(normalizedPaymentType !== undefined && { paymentType: normalizedPaymentType }),
          ...(referenceNumber !== undefined && { referenceNumber: referenceNumber ? String(referenceNumber) : null }),
          ...(notes !== undefined && { notes: notes ? String(notes) : null }),
        },
      })

      return res.status(200).json(payment)
    } catch (error) {
      console.error('[PROJECT PAYMENTS API] Error updating payment:', error)
      return res.status(500).json({ error: 'Failed to update project payment' })
    }
  }

  if (req.method === 'DELETE') {
    try {
      await prisma.projectPayment.delete({ where: { id: paymentId } })
      return res.status(204).end()
    } catch (error) {
      console.error('[PROJECT PAYMENTS API] Error deleting payment:', error)
      return res.status(500).json({ error: 'Failed to delete project payment' })
    }
  }

  res.setHeader('Allow', ['PUT', 'DELETE'])
  return res.status(405).json({ error: 'Method not allowed' })
}
