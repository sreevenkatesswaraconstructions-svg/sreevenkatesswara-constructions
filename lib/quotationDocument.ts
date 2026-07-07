type QuotationData = Record<string, any>

type BuildQuotationHtmlOptions = {
  printWhenReady?: boolean
  baseUrl?: string
  servicesList?: Array<Record<string, any>>
}

const escapeHtml = (value: any) => {
  if (value === undefined || value === null) return ''
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

const decodeHtmlEntities = (value: any) => {
  if (value === undefined || value === null) return ''
  let text = String(value)
  const decodeStep = (input: string) => input
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#x26;/gi, '&')
    .replace(/&#38;/g, '&')

  let prev
  do {
    prev = text
    text = decodeStep(text)
  } while (text !== prev)

  return text
}

export const formatCurrency = (value: any) => {
  const number = Number(value || 0)
  if (Number.isNaN(number)) return '₹0.00'
  return `₹${number.toFixed(2)}`
}

export const formatDate = (value?: any) => {
  const date = value ? new Date(value) : new Date()
  if (Number.isNaN(date.valueOf())) return ''
  return date.toLocaleDateString('en-GB')
}

export const resolveUrl = (url: any, baseUrl = '') => {
  if (!url) return ''
  const raw = String(url).trim()
  if (!raw) return ''
  if (/^https?:\/\//i.test(raw) || /^data:/i.test(raw)) return raw
  if (/^\/\//.test(raw)) return `https:${raw}`
  try {
    return new URL(raw, baseUrl || 'http://localhost').href
  } catch {
    return raw
  }
}

const joinContactLines = (...values: Array<any>) => {
  return values
    .map(value => String(value || '').trim())
    .filter(Boolean)
    .join(' | ')
}

const getServiceNames = (quotation: QuotationData = {}, servicesList: Array<Record<string, any>> = []) => {
  const rawServices = Array.isArray(quotation.services) ? quotation.services : []
  if (!rawServices.length) return []

  const names = rawServices
    .map((item: any) => {
      if (typeof item === 'string') {
        const trimmed = item.trim()
        if (trimmed.toLowerCase().startsWith('others:')) {
          const customValue = trimmed.slice(7).trim()
          return customValue ? `Others: ${customValue}` : ''
        }
        const matched = servicesList.find(
          service => service.id === item || service.serviceId === item || service.slug === item
        )
        return matched ? matched.serviceName || matched.title || matched.name || item : item
      }
      if (item && typeof item === 'object') {
        return item.serviceName || item.name || item.title || item.slug || item.id || ''
      }
      return ''
    })
    .filter(Boolean)

  if (names.length) return names

  return []
}

const getLogoValue = (settings: Record<string, any> = {}) => {
  const candidates = [settings.logo, settings.company_logo, settings.companyLogo, settings.logoUrl]
  return candidates.find((value: any) => typeof value === 'string' && value.trim()) || ''
}

const getPreviewLogoUrl = (settings: Record<string, any> = {}, baseUrl = '') => {
  const resolvedUrl = resolveUrl(getLogoValue(settings), baseUrl || '')
  console.log('[Quotation Preview] Company Logo URL:', resolvedUrl || '(none)')
  if (resolvedUrl && /cloudinary/i.test(resolvedUrl)) {
    console.log('[Quotation Preview] Cloudinary URL detected for logo')
  }
  return resolvedUrl
}

export const buildQuotationHtml = (
  quotation: QuotationData = {},
  settings: Record<string, any> = {},
  options: BuildQuotationHtmlOptions = {}
) => {
  const primaryColor = String(settings.primary_color || settings.primaryColor || '#0f766e')
  const secondaryColor = String(settings.secondary_color || settings.secondaryColor || '#166534')
  const logoUrl = getPreviewLogoUrl(settings, options.baseUrl || '') || '/images/logo.jpeg'
  const companyName = decodeHtmlEntities(settings.company_name || settings.companyName || '')
  const companyTagline = decodeHtmlEntities(settings.company_tagline || settings.companyTagline || 'Constructions & Interiors')
  const companyAddress = escapeHtml(
    [settings.address, settings.city, settings.state, settings.pincode]
      .filter(Boolean)
      .join(', ')
  )
  const companyContact = escapeHtml(joinContactLines(settings.phone, settings.alternate_phone, settings.email))
  const companyWebsite = escapeHtml(settings.website || settings.website_url || '')
  const gstNumber = escapeHtml(settings.gst_number || settings.gstNumber || '')

  const quotationNumber = escapeHtml(quotation.quotationNumber || quotation.quotation_number || `SVC-${new Date().getFullYear()}-0000`)
  const quotationDate = escapeHtml(formatDate(quotation.createdAt || quotation.created_at || quotation.date))
  const generatedDate = escapeHtml(formatDate(new Date()))

  const customerDetailsRows = [
    { label: 'Customer Name', value: escapeHtml(quotation.customerName || quotation.customer_name || '') },
    { label: 'Phone', value: escapeHtml(quotation.customerPhone || quotation.customer_phone || '') },
    { label: 'Email', value: escapeHtml(quotation.customerEmail || quotation.customer_email || '') },
    { label: 'Site Address', value: escapeHtml(quotation.siteAddress || quotation.site_address || '') },
    { label: 'Reference', value: escapeHtml(quotation.referenceBy || quotation.reference_by || '') },
    { label: 'Alternate Phone', value: escapeHtml(quotation.customerAlternatePhone || quotation.customer_alternate_phone || '') },
    { label: 'Secondary Email', value: escapeHtml(quotation.customerSecondaryEmail || quotation.customer_secondary_email || '') },
  ].filter(row => String(row.value).trim())

  const customerDetailsSection = `
    <div class="section-card">
      <div class="section-box">
        <h4>Customer Details</h4>
        <div class="section-grid">
          ${customerDetailsRows.map(row => `<div><span class="label">${escapeHtml(row.label)}</span><div class="value">${row.value}</div></div>`).join('')}
        </div>
      </div>
    </div>
  `

  const projectDetailsRows = [
    { label: 'Project Name', value: escapeHtml(quotation.projectName || quotation.project_name || '') },
    { label: 'Scope of Project', value: escapeHtml(quotation.projectType || quotation.project_type || '') },
    { label: 'Location', value: escapeHtml(quotation.projectLocation || quotation.project_location || '') },
    { label: 'Plot Area', value: escapeHtml(quotation.plotArea || quotation.plot_area || '') },
    { label: 'Built-up Area', value: escapeHtml(quotation.builtUpArea || quotation.built_up_area || '') },
    { label: 'No. of Floors', value: escapeHtml(quotation.floors || '') },
    { label: 'Estimated Duration', value: escapeHtml(quotation.estimatedDuration || quotation.estimated_duration || '') },
  ].filter(row => String(row.value).trim())

  const projectDetailsSection = projectDetailsRows.length ? `
    <div class="section-card">
      <div class="section-box">
        <h4>Project Details</h4>
        <div class="section-grid">
          ${projectDetailsRows.map(row => `<div><span class="label">${escapeHtml(row.label)}</span><div class="value">${row.value}</div></div>`).join('')}
        </div>
      </div>
    </div>
  ` : ''

  const selectedServices = getServiceNames(quotation, options.servicesList || [])
  const selectedServicesSection = selectedServices.length ? `
    <div class="section-card">
      <div class="section-box">
        <h4>Selected Services</h4>
        <ul class="bullet-list">${selectedServices.map(service => `<li>${escapeHtml(service)}</li>`).join('')}</ul>
      </div>
    </div>
  ` : ''

  const boqRows = Array.isArray(quotation.boq) ? quotation.boq : []
  const boqSections = boqRows.reduce((acc: Record<string, Array<any>>, row: any) => {
    const category = String(row?.category || 'General').trim() || 'General'
    if (!acc[category]) acc[category] = []
    acc[category].push(row)
    return acc
  }, {})
  const computedSubtotal = boqRows.reduce((sum, row: any) => {
    const amount = Number(row?.amount || 0)
    return sum + amount
  }, 0)
  const hasDiscountPercent = quotation.discountPercent !== undefined && quotation.discountPercent !== null
  const discountPercent = hasDiscountPercent
    ? Number(quotation.discountPercent)
    : (computedSubtotal > 0 ? (Number(quotation.discount || 0) / computedSubtotal) * 100 : 0)
  const discountAmount = computedSubtotal * (discountPercent / 100)
  const subtotalAfterDiscount = computedSubtotal - discountAmount
  const hasStoredGstPercent = quotation.gstPercent !== undefined && quotation.gstPercent !== null
  const hasStoredGstAmount = quotation.gstAmount !== undefined && quotation.gstAmount !== null
  const hasStoredGstTotal = quotation.gstTotal !== undefined && quotation.gstTotal !== null
  const storedGstValue = hasStoredGstAmount
    ? Number(quotation.gstAmount)
    : (hasStoredGstTotal ? Number(quotation.gstTotal) : null)
  const computedGstTotal = storedGstValue !== null
    ? storedGstValue
    : boqRows.reduce((sum, row: any) => {
      const amount = Number(row?.amount || 0)
      const discountedAmount = amount - (amount * (discountPercent / 100))
      const gstRate = Number(row?.gst || 0)
      return sum + (discountedAmount * gstRate / 100)
    }, 0)
  const hasStoredGrandTotal = quotation.grandTotal !== undefined && quotation.grandTotal !== null
  const computedGrandTotal = hasStoredGrandTotal
    ? Number(quotation.grandTotal)
    : subtotalAfterDiscount + computedGstTotal
  const subtotalValue = computedSubtotal
  const discountPercentValue = discountPercent
  const discountValue = discountAmount
  const subtotalAfterDiscountValue = subtotalAfterDiscount
  const gstPercentValue = hasStoredGstPercent
    ? Number(quotation.gstPercent)
    : (subtotalAfterDiscountValue > 0 ? (computedGstTotal / subtotalAfterDiscountValue) * 100 : 0)
  const gstValue = computedGstTotal

  const boqSectionsHtml = Object.entries(boqSections).map(([category, rows]) => {
    const sectionRowsHtml = (rows as Array<any>).map((row: any, index: number) => `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(row.description || row.item || '-')}</td>
        <td>${escapeHtml(row.category || '-')}</td>
        <td>${escapeHtml(row.unit || '-')}</td>
        <td>${escapeHtml(row.quantity || 0)}</td>
        <td>${formatCurrency(row.rate)}</td>
        <td>${formatCurrency(row.amount)}</td>
      </tr>
    `).join('')
    const sectionTotal = (rows as Array<any>).reduce((sum, row: any) => sum + Number(row?.amount || 0), 0)
    return `
      <div class="section-card" style="margin-top: 12px;">
        <div class="section-box">
          <h5 style="margin: 0 0 8px 0;">${escapeHtml(category || 'General')}</h5>
          <table class="quotation-table">
            <thead><tr><th>S. No</th><th>Description</th><th>Category</th><th>Unit</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
            <tbody>${sectionRowsHtml}</tbody>
          </table>
          <div style="margin-top: 8px; text-align: right; font-weight: 600;">Section Total: ${formatCurrency(sectionTotal)}</div>
        </div>
      </div>
    `
  }).join('')

  const boqSection = boqRows.length ? `
    <div class="section-card">
      <div class="section-box">
        <h4>Bill of Quantities (BOQ)</h4>
        ${boqSectionsHtml}
      </div>
    </div>
  ` : ''

  const paymentRows = Array.isArray(quotation.paymentSchedule)
    ? quotation.paymentSchedule
    : Array.isArray(quotation.payment_schedule)
      ? quotation.payment_schedule
      : []

  const paymentRowsHtml = paymentRows.map((item: any) => `
      <tr>
        <td>${escapeHtml(item.title || 'Milestone')}</td>
        <td>${escapeHtml(item.percent || 0)}%</td>
        <td>${formatCurrency((computedGrandTotal * (item.percent || 0)) / 100)}</td>
      </tr>
    `).join('')

  const paymentSection = paymentRows.length ? `
    <div class="section-card">
      <div class="section-box">
        <h4>Payment Schedule</h4>
        <table class="quotation-table">
          <thead><tr><th>Milestone</th><th>Percent</th><th>Amount</th></tr></thead>
          <tbody>${paymentRowsHtml}</tbody>
        </table>
      </div>
    </div>
  ` : ''

  const summaryRows = [
    { label: 'TOTAL BOQ', value: formatCurrency(subtotalValue) },
    { label: 'Discount %', value: `${discountPercentValue.toFixed(2)}%` },
    { label: 'Discount Amount', value: formatCurrency(discountValue) },
    { label: 'Subtotal After Discount', value: formatCurrency(subtotalAfterDiscountValue) },
    { label: 'GST %', value: `${gstPercentValue.toFixed(2)}%` },
    { label: 'GST Amount', value: formatCurrency(gstValue) },
  ]

  const summarySection = `
    <div class="section-card">
      <div class="section-box">
        <h4>Summary</h4>
        <div class="summary-grid">
          ${summaryRows.map(row => `<div>${escapeHtml(row.label)}</div><div>${escapeHtml(row.value)}</div>`).join('')}
          <div class="grand-label">Grand Total</div><div class="grand-value">${formatCurrency(quotation.grandTotal || quotation.grand_total || 0)}</div>
        </div>
      </div>
    </div>
  `

  const terms = Array.isArray(quotation.terms) ? quotation.terms : []
  const normalizedTerms = terms
    .map((term: any) => String(term || '').trim())
    .filter(Boolean)
    .map((term: string) => term.replace(/^\s*\d+[.)\-]\s*/, '').trim())

  const termsSection = normalizedTerms.length ? `
    <div class="section-card">
      <div class="section-box">
        <h4>Terms & Conditions</h4>
        <ol class="bullet-list numbered">${normalizedTerms.map((term: string, index: number) => `<li><span class="term-number">${index + 1}.</span><span class="term-text">${escapeHtml(term)}</span></li>`).join('')}</ol>
      </div>
    </div>
  ` : ''

  const notesText = String(quotation.notes || '').trim()
  const notesSection = notesText ? `
    <div class="section-card">
      <div class="section-box">
        <h4>Notes</h4>
        <div class="value">${escapeHtml(notesText)}</div>
      </div>
    </div>
  ` : ''

  const attachments = Array.isArray(quotation.attachments) ? quotation.attachments : []
  const attachmentsSection = attachments.length ? `
    <div class="section-card">
      <div class="section-box">
        <h4>Attachments</h4>
        <ul class="bullet-list">${attachments.map((attachment: any) => `<li>${escapeHtml(attachment.originalName || attachment.name || attachment.fileName || attachment.filename || '')}</li>`).join('')}</ul>
      </div>
    </div>
  ` : ''

  const signaturesSection = `
    <div class="section-card">
      <div class="section-box">
        <h4>Signatures</h4>
        <div class="signatures-grid">
          <div class="signature-box">
            <div class="label">Prepared By</div>
            <div class="signature-name">${escapeHtml(companyName || 'Sree Venkateswara')}</div>
            <div class="signature-subtitle">${escapeHtml(companyTagline || 'Constructions & Interiors')}</div>
          </div>
          <div class="signature-box">
            <div class="label">Authorized Signature</div>
            <div class="signature-line"></div>
          </div>
          <div class="signature-box">
            <div class="label">Customer Signature</div>
            <div class="signature-line"></div>
          </div>
        </div>
      </div>
    </div>
  `

  const sectionBlocks = [customerDetailsSection, projectDetailsSection, selectedServicesSection, boqSection, paymentSection, summarySection, termsSection, notesSection, attachmentsSection, signaturesSection].filter(Boolean)

  const headerHtml = `
    <div class="letterhead-header">
      <div class="letterhead-left">
        ${logoUrl ? `<div class="logo"><img src="${escapeHtml(logoUrl)}" alt="${companyName || 'Company Logo'}" /></div>` : ''}
        <div class="company-details">
          ${companyName ? `<div class="company-name">${companyName}</div>` : ''}
          ${companyTagline ? `<div class="company-tagline">${companyTagline}</div>` : ''}
          ${companyAddress ? `<div class="company-meta">${companyAddress}</div>` : ''}
          ${companyContact ? `<div class="company-meta">${companyContact}</div>` : ''}
          ${companyWebsite ? `<div class="company-meta">${companyWebsite}</div>` : ''}
          ${gstNumber ? `<div class="company-meta">GST: ${gstNumber}</div>` : ''}
        </div>
      </div>
      <div class="docinfo">
        <div><strong>Quotation No:</strong> <strong>${quotationNumber}</strong></div>
        <div><strong>Date:</strong> ${quotationDate || generatedDate}</div>
      </div>
    </div>
  `

  const footerHtml = `
    <div class="letterhead-footer">
      <div class="footer-left">${companyContact || companyWebsite || ''}</div>
      <div class="footer-right">Page <span class="page-number">1</span> of <span class="total-pages">1</span></div>
    </div>
  `

  return `
    <!doctype html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <base href="${escapeHtml(options.baseUrl || '')}" />
      <title>Quotation Preview</title>
      <style>
        @page { size: A4; margin: 0 }
        html, body { margin: 0; padding: 0; min-height: 100%; background: #f3f4f6; font-family: Arial, Helvetica, sans-serif; color: #0f172a; }
        body { padding: 12mm 0; }
        .paper { width: 210mm; margin: 0 auto; }
        .page { width: 210mm; min-height: 297mm; box-sizing: border-box; padding: 16mm 14mm 18mm; position: relative; background: white; margin: 0 0 12px; }
        .letterhead-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; border-bottom: 1px solid ${secondaryColor}; padding-bottom: 10px; margin-bottom: 10px; }
        .letterhead-left { display: flex; gap: 14px; align-items: center; }
        .logo { display: flex; align-items: center; justify-content: center; width: 90px; height: 90px; flex-shrink: 0; }
        .logo img { width: 90px; height: 90px; max-width: 90px; max-height: 90px; object-fit: contain; display: block; border-radius: 50%; image-rendering: auto; image-rendering: -webkit-optimize-contrast; image-rendering: crisp-edges; }
        .company-details { display: grid; gap: 4px; }
        .company-name { font-size: 18px; font-weight: 800; color: ${primaryColor}; }
        .company-tagline { font-size: 13px; font-weight: 600; color: ${secondaryColor}; }
        .company-meta { font-size: 11px; color: #475569; line-height: 1.5; }
        .docinfo { width: 190px; font-size: 12px; text-align: right; }
        .docinfo div { margin-bottom: 4px; }
        .section-card { margin-bottom: 18px; }
        .section-box { background: #ffffff; border: 1px solid #000000; border-radius: 10px; padding: 20px; box-sizing: border-box; margin: 0; }
        .section-box h4 { margin: 0 0 12px 0; font-size: 13px; font-weight: 700; color: ${primaryColor}; text-transform: uppercase; letter-spacing: .03em; }
        .section-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 16px; }
        .label { display: block; font-size: 10px; font-weight: 700; color: #475569; margin-bottom: 3px; text-transform: uppercase; letter-spacing: .03em; }
        .value { font-size: 12px; color: #0f172a; line-height: 1.45; }
        .bullet-list { margin: 0; padding-left: 18px; font-size: 12px; color: #0f172a; }
        .bullet-list li { margin-bottom: 4px; }
        .bullet-list.numbered { padding-left: 0; list-style: none; }
        .bullet-list.numbered li { display: flex; align-items: flex-start; gap: 8px; margin-bottom: 8px; }
        .bullet-list.numbered .term-number { flex: 0 0 20px; font-size: 12px; font-weight: 700; text-align: right; line-height: 1.45; color: #0f172a; }
        .bullet-list.numbered .term-text { flex: 1 1 0; min-width: 0; line-height: 1.45; }
        .quotation-table { width: 100%; border-collapse: collapse; font-size: 11px; }
        .quotation-table th, .quotation-table td { border: 1px solid #cbd5e1; padding: 8px 10px; vertical-align: top; }
        .quotation-table th { background: #f8fafc; color: #0f172a; text-align: left; font-weight: 700; }
        .empty { text-align: center; color: #64748b; }
        .summary-grid { display: grid; grid-template-columns: 1fr auto; gap: 8px 16px; align-items: center; font-size: 12px; }
        .summary-grid .grand-label { font-weight: 700; }
        .summary-grid .grand-value { font-weight: 700; }
        .signatures-grid { display: flex; gap: 12px; flex-wrap: nowrap; }
        .signature-box { flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; justify-content: flex-start; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; min-height: 100px; background: #fafafa; overflow: visible; }
        .signature-name { margin-top: 12px; font-weight: 700; font-size: 13px; color: #0f172a; }
        .signature-subtitle { margin-top: 4px; font-size: 11px; color: #475569; line-height: 1.4; }
        .signature-line { margin-top: 12px; min-height: 28px; border-bottom: 1px solid #cbd5e1; width: 100%; box-sizing: border-box; }
        .letterhead-footer { position: absolute; left: 14mm; right: 14mm; bottom: 12mm; display: flex; justify-content: space-between; font-size: 10px; color: #475569; }
        .content-area { min-height: 1px; }
        .section-card, .section-box { break-inside: avoid-page; page-break-inside: avoid; }
        @media print {
          body { padding: 0; background: white; }
          .paper { width: 100%; }
          .page { margin: 0; box-shadow: none; }
          .section-box { border: 1px solid #000000; background: white; padding: 20px; overflow: visible !important; box-sizing: border-box; }
          .section-card { overflow: visible; }
          .signature-box { overflow: visible !important; border: 1px solid #e2e8f0; flex: none; min-width: auto; }
          .signatures-grid { display: flex; overflow: visible; }
          .quotation-table { border-collapse: collapse; overflow: visible; }
          .quotation-table th, .quotation-table td { border: 1px solid #cbd5e1; }
        }
      </style>
    </head>
    <body>
      <div class="paper">
        <div class="page">
          ${headerHtml}
          <div class="content-area"></div>
          ${footerHtml}
        </div>
      </div>
      <script>
        (function() {
          const sectionBlocks = ${JSON.stringify(sectionBlocks)}
          const pageTemplate = document.querySelector('.page')
          const header = pageTemplate.querySelector('.letterhead-header')
          const footer = pageTemplate.querySelector('.letterhead-footer')
          const paper = document.querySelector('.paper')
          const measurement = document.createElement('div')
          measurement.style.position = 'absolute'
          measurement.style.left = '-9999px'
          measurement.style.top = '0'
          measurement.style.width = '182mm'
          measurement.style.visibility = 'hidden'
          document.body.appendChild(measurement)

          const sectionHeights = sectionBlocks.map(block => {
            const temp = document.createElement('div')
            temp.innerHTML = block
            measurement.appendChild(temp)
            const height = temp.scrollHeight + 18
            temp.remove()
            return height
          })
          measurement.remove()

          const headerHeight = header.offsetHeight + 14
          const footerHeight = footer.offsetHeight + 10
          const contentHeight = pageTemplate.clientHeight - headerHeight - footerHeight

          let currentPage = pageTemplate
          let currentContent = currentPage.querySelector('.content-area')
          let currentHeight = 0
          let pages = [currentPage]

          const appendToPage = (page, block, blockHeight) => {
            const content = page.querySelector('.content-area')
            const temp = document.createElement('div')
            temp.innerHTML = block
            content.appendChild(temp.firstElementChild)
          }

          sectionBlocks.forEach((block, index) => {
            const blockHeight = sectionHeights[index]
            if (currentHeight + blockHeight > contentHeight && currentContent.children.length > 0) {
              const nextPage = currentPage.cloneNode(true)
              nextPage.querySelector('.content-area').innerHTML = ''
              nextPage.querySelector('.page-number').textContent = String(pages.length + 1)
              nextPage.querySelector('.total-pages').textContent = '1'
              paper.appendChild(nextPage)
              pages.push(nextPage)
              currentPage = nextPage
              currentContent = currentPage.querySelector('.content-area')
              currentHeight = 0
            }
            appendToPage(currentPage, block, blockHeight)
            currentHeight += blockHeight
          })

          pages.forEach((pg, index) => {
            pg.querySelector('.page-number').textContent = String(index + 1)
            pg.querySelector('.total-pages').textContent = String(pages.length)
          })

          if (${options.printWhenReady ? 'true' : 'false'}) {
            setTimeout(() => window.print(), 400)
          }
        })();
      </script>
    </body>
    </html>
  `
}
