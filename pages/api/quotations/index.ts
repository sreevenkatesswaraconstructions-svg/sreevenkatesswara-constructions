import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '../../../lib/prisma'
import { DEFAULT_QUOTATION_TERMS, DEFAULT_QUOTATION_NOTES, generateQuotationNumber, normalizeQuotationRecord, serializeQuotationPayload, validateQuotationPayload } from '../../../lib/quotations'

const response = (success: boolean, data: any = null, message: string = '') => ({ success, data, message })

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session || !session.user) return res.status(401).json(response(false, null, 'Unauthorized'))

  if (req.method === 'GET') {
    try {
      const { search = '', status, page = '1', pageSize = '10', dateFrom, dateTo } = req.query as any
      const take = parseInt(pageSize, 10) || 10
      const skip = (parseInt(page, 10) - 1) * take

      const where: any = {}
      if (search) {
        where.OR = [
          { quotationNumber: { contains: search, mode: 'insensitive' } },
          { customerName: { contains: search, mode: 'insensitive' } },
          { customerEmail: { contains: search, mode: 'insensitive' } },
        ]
      }
      if (status) where.status = status
      if (dateFrom || dateTo) {
        where.createdAt = {}
        if (dateFrom) where.createdAt.gte = new Date(dateFrom)
        if (dateTo) where.createdAt.lte = new Date(dateTo)
      }

      const [items, total] = await Promise.all([
        prisma.quotation.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
        prisma.quotation.count({ where }),
      ])

      return res.status(200).json(response(true, { items: items.map(normalizeQuotationRecord), total }))
    } catch (err: any) {
      console.error('GET /api/quotations error', err)
      return res.status(500).json(response(false, null, 'Failed to fetch quotations'))
    }
  }

  if (req.method === 'POST') {
    try {
      const body = req.body || {}
      if (body.terms === undefined) body.terms = DEFAULT_QUOTATION_TERMS
      if (body.notes === undefined) body.notes = DEFAULT_QUOTATION_NOTES
      if (!body.status) body.status = 'Saved'
      const validation = validateQuotationPayload(body, { allowIncompleteDraft: ['DRAFT', 'SAVED'].includes(String(body.status ?? '').trim().toUpperCase()) })
      if (!validation.isValid) {
        return res.status(400).json(response(false, null, validation.errors.join(', ')))
      }

      const quotationNumber = String(body.quotationNumber || '').trim() || (await generateQuotationNumber())
      const payload = await serializeQuotationPayload(body, { quotationNumber })
      const created = await prisma.$transaction(async (tx) => {
        const quotation = await tx.quotation.create({ data: payload })

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

      return res.status(201).json(response(true, normalizeQuotationRecord(created), 'Quotation created'))
    } catch (err: any) {
      console.error('POST /api/quotations error', err)
      return res.status(500).json(response(false, null, 'Failed to create quotation'))
    }
  }

  res.setHeader('Allow', ['GET', 'POST'])
  return res.status(405).json(response(false, null, 'Method not allowed'))
}
