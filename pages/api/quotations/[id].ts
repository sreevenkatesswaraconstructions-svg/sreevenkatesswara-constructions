import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '../../../lib/prisma'
import { generateQuotationNumber, normalizeQuotationRecord, serializeQuotationPayload, validateQuotationPayload } from '../../../lib/quotations'

const response = (success: boolean, data: any = null, message: string = '') => ({ success, data, message })

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session || !session.user) return res.status(401).json(response(false, null, 'Unauthorized'))

  const { id } = req.query as any

  if (req.method === 'GET') {
    try {
      const item = await prisma.quotation.findUnique({ where: { id } })
      if (!item) return res.status(404).json(response(false, null, 'Not found'))
      return res.status(200).json(response(true, normalizeQuotationRecord(item)))
    } catch (err: any) {
      console.error('GET /api/quotations/:id', err)
      return res.status(500).json(response(false, null, 'Failed to fetch quotation'))
    }
  }

  if (req.method === 'PUT') {
    try {
      const existing = await prisma.quotation.findUnique({ where: { id } })
      if (!existing) return res.status(404).json(response(false, null, 'Not found'))

      const body = req.body || {}
      if (!body.status) body.status = 'Saved'
      const validation = validateQuotationPayload(body, { allowIncompleteDraft: ['DRAFT', 'SAVED'].includes(String(body.status ?? '').trim().toUpperCase()) })
      if (!validation.isValid) {
        return res.status(400).json(response(false, null, validation.errors.join(', ')))
      }

      const quotationNumber = String(existing.quotationNumber || '').trim() || (await generateQuotationNumber())
      const payload = await serializeQuotationPayload(body, { quotationNumber })
      const updated = await prisma.$transaction(async (tx) => {
        const quotation = await tx.quotation.update({ where: { id }, data: payload })

        if (payload.status && payload.status.toString().toUpperCase() === 'SENT') {
          try {
            await tx.quotationHistory.create({
              data: {
                quotationId: quotation.id,
                action: 'SENT',
                adminName: session.user?.name || session.user?.email || '',
                meta: JSON.stringify({ sentAt: new Date().toISOString() }),
              }
            })
          } catch (historyErr) {
            console.warn('Quotation history entry could not be created:', historyErr)
          }
        }

        return quotation
      })
      return res.status(200).json(response(true, normalizeQuotationRecord(updated), 'Quotation updated'))
    } catch (err: any) {
      console.error('PUT /api/quotations/:id', err)
      return res.status(500).json(response(false, null, 'Failed to update quotation'))
    }
  }

  if (req.method === 'DELETE') {
    try {
      // Use raw SQL to disable foreign key constraints for this deletion
      await prisma.$executeRawUnsafe('PRAGMA foreign_keys = OFF')
      
      // Delete all child records first to avoid constraint violations
      await prisma.quotationHistory.deleteMany({ where: { quotationId: id } })
      await prisma.quotationItem.deleteMany({ where: { quotationId: id } })
      await prisma.quotationMaterial.deleteMany({ where: { quotationId: id } })
      await prisma.quotationTerm.deleteMany({ where: { quotationId: id } })
      await prisma.quotationAttachment.deleteMany({ where: { quotationId: id } })
      await prisma.quotationPaymentStage.deleteMany({ where: { quotationId: id } })
      await prisma.quotationWarranty.deleteMany({ where: { quotationId: id } })
      
      // Finally delete the parent quotation
      await prisma.quotation.delete({ where: { id } })
      
      // Re-enable foreign key constraints
      await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON')
      
      return res.status(200).json(response(true, null, 'Deleted'))
    } catch (err: any) {
      console.error('DELETE /api/quotations/:id', err)
      // Try to re-enable foreign keys even on error
      await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON').catch(() => {})
      return res.status(500).json(response(false, null, `Failed to delete quotation: ${err.message}`))
    }
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
  return res.status(405).json(response(false, null, 'Method not allowed'))
}
