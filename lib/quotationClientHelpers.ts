const normalizeQuotationId = (value?: string | null) => {
  if (!value) return ''
  if (Array.isArray(value)) {
    const firstValid = value.find(v => typeof v === 'string' && v.trim())
    return firstValid ? firstValid.trim() : ''
  }
  const normalized = String(value).trim()
  if (normalized === 'undefined' || normalized === 'null') return ''
  return normalized
}

export const getQuotationSaveRequestDetails = (quotationId?: string | null, currentId?: string | null) => {
  const resolvedId = normalizeQuotationId(currentId) || normalizeQuotationId(quotationId)
  return {
    id: resolvedId,
    endpoint: resolvedId ? `/api/quotations/${resolvedId}` : '/api/quotations',
    method: resolvedId ? 'PUT' : 'POST',
  }
}
