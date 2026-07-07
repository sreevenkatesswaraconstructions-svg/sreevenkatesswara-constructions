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
      const updated = await prisma.quotation.update({ where: { id }, data: payload })
      return res.status(200).json(response(true, normalizeQuotationRecord(updated), 'Quotation updated'))
    } catch (err: any) {
      console.error('PUT /api/quotations/:id', err)
      return res.status(500).json(response(false, null, 'Failed to update quotation'))
    }
  }

  if (req.method === 'DELETE') {
    try {
      const quotationId = Array.isArray(id) ? id[0] : id
      if (!quotationId) return res.status(400).json(response(false, null, 'Invalid quotation id'))

      const existing = await prisma.quotation.findUnique({ where: { id: quotationId } })
      if (!existing) {
        return res.status(404).json(response(false, null, 'Not found'))
      }

      await prisma.$transaction(async (tx) => {
        await tx.quotationHistory.deleteMany({ where: { quotationId } })
        await tx.quotationItem.deleteMany({ where: { quotationId } })
        await tx.quotationMaterial.deleteMany({ where: { quotationId } })
        await tx.quotationTerm.deleteMany({ where: { quotationId } })
        await tx.quotationAttachment.deleteMany({ where: { quotationId } })
        await tx.quotationPaymentStage.deleteMany({ where: { quotationId } })
        await tx.quotationWarranty.deleteMany({ where: { quotationId } })
        await tx.quotation.delete({ where: { id: quotationId } })
      })

      return res.status(200).json(response(true, null, 'Quotation deleted successfully.'))
    } catch (err: any) {
      console.error('DELETE /api/quotations/:id', err)
      return res.status(500).json(response(false, null, err.message || 'Failed to delete quotation'))
    }
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
  return res.status(405).json(response(false, null, 'Method not allowed'))
}
