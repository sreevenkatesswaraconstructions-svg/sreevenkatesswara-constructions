import { prisma } from './prisma'

export const DEFAULT_QUOTATION_TERMS = [
  '1.This quotation is valid for 30 days from the date of issue.',
  '2.The project will commence after confirmation of the work order and receipt of the agreed advance payment.',
  '3.Material specifications and brands mentioned in this quotation will be maintained unless the client requests an alternative.',
  '4.Any additional work, design modifications or scope changes requested after quotation approval will be treated as extra work and billed separately.',
  '5.Project completion timelines may vary due to weather conditions, site accessibility, approval delays or unforeseen circumstances beyond our control.',
  '6.Government approvals, statutory fees, electricity, water connection charges and third-party approvals are excluded unless specifically mentioned.',
  '7.Payments shall be released according to the agreed milestone schedule mentioned in this quotation.',
  '8.We are committed to delivering quality workmanship, transparent pricing and professional project execution throughout the construction process.',
]

export type QuotationPayload = Record<string, any>

const normalizeStatus = (status?: string | null) => {
  const raw = String(status ?? 'Saved').trim().toUpperCase()
  if (['SAVED', 'SAVE', 'SAVING', 'DRAFT', 'D', 'DRAFTED'].includes(raw)) return 'Saved'
  if (['SENT', 'SEND', 'SENT_EMAIL', 'SUBMITTED'].includes(raw)) return 'Sent'
  return 'Saved'
}

const parseNumber = (value: any, fallback = 0) => {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

const deriveQuotationDisplayFields = (record: any = {}) => {
  const subtotal = parseNumber(record?.subtotal, 0)
  const discountAmount = record?.discountAmount !== undefined && record?.discountAmount !== null
    ? parseNumber(record.discountAmount, parseNumber(record?.discount, 0))
    : parseNumber(record?.discount, 0)
  const gstAmount = record?.gstAmount !== undefined && record?.gstAmount !== null
    ? parseNumber(record.gstAmount, parseNumber(record?.gstTotal, 0))
    : parseNumber(record?.gstTotal, 0)
  const subtotalAfterDiscount = record?.subtotalAfterDiscount !== undefined && record?.subtotalAfterDiscount !== null
    ? parseNumber(record.subtotalAfterDiscount, subtotal - discountAmount)
    : subtotal - discountAmount
  const discountPercent = record?.discountPercent !== undefined && record?.discountPercent !== null
    ? parseNumber(record.discountPercent, 0)
    : (subtotal > 0 ? (discountAmount / subtotal) * 100 : 0)
  const gstPercent = record?.gstPercent !== undefined && record?.gstPercent !== null
    ? parseNumber(record.gstPercent, 0)
    : (subtotalAfterDiscount > 0 ? (gstAmount / subtotalAfterDiscount) * 100 : 0)

  return {
    discountPercent,
    gstPercent,
    discountAmount,
    gstAmount,
    subtotalAfterDiscount,
    grandTotal: parseNumber(record?.grandTotal, subtotalAfterDiscount + gstAmount),
  }
}

const parseInteger = (value: any) => {
  const num = Number(value)
  return Number.isFinite(num) ? Math.trunc(num) : null
}

const serializeField = (value: any) => {
  if (value === undefined || value === null) return null
  if (typeof value === 'string') return value
  return JSON.stringify(value)
}

const parseJsonField = (value: any, fallback: any = null) => {
  if (value === undefined || value === null || value === '') return fallback
  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return fallback
    }
  }
  return value
}

export const getQuotationSaveRequestDetails = (quotationId?: string | null, currentId?: string | null) => {
  const resolvedId = String(quotationId || currentId || '').trim()
  return {
    id: resolvedId,
    endpoint: resolvedId ? `/api/quotations/${resolvedId}` : '/api/quotations',
    method: resolvedId ? 'PUT' : 'POST',
  }
}

export const calculateQuotationTotals = (boqRows: Array<Record<string, any>> = [], discountPercent = 0, gstPercent = 0) => {
  const resolvedDiscountPercent = Number(discountPercent || 0)
  const resolvedGstPercent = Number(gstPercent || 0)
  const subtotal = boqRows.reduce((sum, row: any) => sum + Number(row?.amount || 0), 0)
  const discount = subtotal * (resolvedDiscountPercent / 100)
  const subtotalAfterDiscount = subtotal - discount
  const gstTotal = subtotalAfterDiscount * (resolvedGstPercent / 100)
  return {
    subtotal,
    discountPercent: resolvedDiscountPercent,
    discount,
    subtotalAfterDiscount,
    gstPercent: resolvedGstPercent,
    gstTotal,
    grandTotal: subtotalAfterDiscount + gstTotal,
  }
}

export const serializeQuotationPayload = async (input: QuotationPayload = {}, options: { quotationNumber?: string } = {}) => {
  const rawStatus = normalizeStatus(input?.status)
  const subtotalInput = parseNumber(input?.subtotal, 0)
  const discountPercentInput = input?.discountPercent !== undefined && input?.discountPercent !== null
    ? parseNumber(input?.discountPercent, 0)
    : (subtotalInput > 0 ? (parseNumber(input?.discount, 0) / subtotalInput) * 100 : parseNumber(input?.discount, 0))
  const gstPercentInput = input?.gstPercent !== undefined && input?.gstPercent !== null
    ? parseNumber(input?.gstPercent, 0)
    : parseNumber(input?.gst, 0)
  const totals = calculateQuotationTotals(Array.isArray(input?.boq) ? input.boq : [], discountPercentInput, gstPercentInput)
  const discountAmountInput = input?.discountAmount !== undefined && input?.discountAmount !== null
    ? parseNumber(input.discountAmount, parseNumber(input?.discount, totals.discount))
    : parseNumber(input?.discount, totals.discount)
  const subtotalAfterDiscountInput = input?.subtotalAfterDiscount !== undefined && input?.subtotalAfterDiscount !== null
    ? parseNumber(input.subtotalAfterDiscount, totals.subtotalAfterDiscount)
    : totals.subtotalAfterDiscount
  const gstAmountInput = input?.gstAmount !== undefined && input?.gstAmount !== null
    ? parseNumber(input.gstAmount, totals.gstTotal)
    : totals.gstTotal
  const grandTotalInput = input?.grandTotal !== undefined && input?.grandTotal !== null
    ? parseNumber(input.grandTotal, subtotalAfterDiscountInput + gstAmountInput)
    : subtotalAfterDiscountInput + gstAmountInput

  const payload = {
    quotationNumber: (input?.quotationNumber || options.quotationNumber || '').toString().trim(),
    customerId: input?.customerId ? String(input.customerId) : null,
    customerName: String(input?.customerName ?? '').trim(),
    customerPhone: String(input?.customerPhone ?? '').trim(),
    customerEmail: String(input?.customerEmail ?? '').trim(),
    siteAddress: String(input?.siteAddress ?? '').trim(),
    city: String(input?.city ?? '').trim() || null,
    state: String(input?.state ?? '').trim() || null,
    pincode: String(input?.pincode ?? '').trim() || null,
    referenceBy: String(input?.referenceBy ?? '').trim() || null,
    projectName: String(input?.projectName ?? '').trim(),
    projectType: String(input?.projectType ?? '').trim(),
    quotationDate: input?.quotationDate ? new Date(input.quotationDate) : null,
    projectLocation: String(input?.projectLocation ?? '').trim() || null,
    plotArea: String(input?.plotArea ?? '').trim() || null,
    builtUpArea: String(input?.builtUpArea ?? '').trim() || null,
    floors: parseInteger(input?.floors),
    estimatedDuration: String(input?.estimatedDuration ?? '').trim() || null,
    status: rawStatus,
    services: serializeField(input?.services),
    boq: serializeField(input?.boq),
    paymentSchedule: serializeField(input?.paymentSchedule),
    terms: serializeField(input?.terms),
    notes: String(input?.notes ?? '').trim(),
    attachments: serializeField(input?.attachments),
    subtotal: parseNumber(input?.subtotal, totals.subtotal),
    gstTotal: parseNumber(input?.gstTotal, gstAmountInput),
    discount: parseNumber(input?.discount, discountAmountInput),
    grandTotal: parseNumber(input?.grandTotal, grandTotalInput),
    isDraft: false,
  }

  return payload
}

export const validateQuotationPayload = (payload: QuotationPayload, options: { allowIncompleteDraft?: boolean } = {}) => {
  const errors: string[] = []
  const isDraft = options.allowIncompleteDraft ?? false

  if (!isDraft) {
    if (!String(payload?.customerName ?? '').trim()) errors.push('Customer name is required')
    if (!String(payload?.customerPhone ?? '').trim()) errors.push('Customer phone is required')
    if (!String(payload?.projectName ?? '').trim()) errors.push('Project name is required')

    const boq = Array.isArray(payload?.boq) ? payload.boq : []
    const hasBoq = boq.some((row: any) => row && (String(row?.description ?? '').trim() || Number(row?.quantity || 0) || Number(row?.rate || 0)))
    if (!hasBoq) errors.push('At least one BOQ item is required')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export const generateQuotationNumber = async (year = new Date().getFullYear()) => {
  const prefix = `SVC-${year}-`
  const latest = await prisma.quotation.findFirst({
    where: { quotationNumber: { startsWith: prefix } },
    orderBy: { createdAt: 'desc' },
    select: { quotationNumber: true },
  })

  const match = latest?.quotationNumber?.match(/(\d+)$/)
  const nextNumber = match ? Number(match[1]) + 1 : 1
  return `${prefix}${String(nextNumber).padStart(4, '0')}`
}

export const normalizeQuotationRecord = (record: any) => {
  if (!record) return null
  const displayFields = deriveQuotationDisplayFields(record)
  return {
    ...record,
    ...displayFields,
    status: normalizeStatus(record.status),
    services: parseJsonField(record.services, []),
    boq: parseJsonField(record.boq, []),
    paymentSchedule: parseJsonField(record.paymentSchedule, []),
    terms: parseJsonField(record.terms, []),
    attachments: parseJsonField(record.attachments, []),
  }
}
