import type { NextApiRequest, NextApiResponse } from 'next'
// @ts-ignore: pdfkit has no bundled TypeScript definitions in this workspace
import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'
import { prisma } from '../../../../lib/prisma'

export const config = {
  api: {
    bodyParser: false,
  },
}

const mmToPt = (mm: number) => mm * 2.83465

function ensurePageSpace(doc: any, space: number) {
  const contentBottom = doc.page.height - doc.page.margins.bottom - 60
  if (doc.y + space > contentBottom) {
    doc.addPage()
  }
}

function getSettingValue(settings: any, keys: string[]) {
  for (const key of keys) {
    if (settings && settings[key]) return settings[key]
  }
  return ''
}

function getLogoSettingValue(settings: any) {
  return getSettingValue(settings, ['logo', 'company_logo', 'companyLogo', 'logoUrl']) || ''
}

async function loadLogoBuffer(logoUrl: string): Promise<Buffer | null> {
  if (!logoUrl) return null

  if (logoUrl.startsWith('data:')) {
    const matches = logoUrl.match(/^data:(image\/\w+);base64,(.+)$/)
    if (!matches) {
      throw new Error('Invalid data URL for logo image')
    }
    return Buffer.from(matches[2], 'base64')
  }

  if (logoUrl.startsWith('/')) {
    const localPath = path.join(process.cwd(), 'public', logoUrl.replace(/^\//, ''))
    if (!fs.existsSync(localPath)) return null
    return fs.readFileSync(localPath)
  }

  if (/^https?:\/\//i.test(logoUrl)) {
    const response = await fetch(logoUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    })
    if (!response.ok) throw new Error(`Logo download failed: ${response.status}`)
    const buffer = Buffer.from(await response.arrayBuffer())
    return buffer
  }

  const localPath = path.join(process.cwd(), 'public', logoUrl)
  if (fs.existsSync(localPath)) return fs.readFileSync(localPath)
  return null
}

function decodeHtmlEntities(value: any) {
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ success: false, message: 'Invoice ID is required' })
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, phone: true, email: true, location: true } },
        project: { select: { id: true, title: true, status: true, siteAddress: true, projectType: true, category: true } },
        items: true,
      },
    })

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' })
    }

    // load settings from DB to reuse exact branding used by Quotation PDF
    const settingsRows = await prisma.settings.findMany({ orderBy: { key: 'asc' } })
    const settings: Record<string, any> = {}
    settingsRows.forEach((s: any) => { settings[s.key] = s.value })

    const primaryColor = getSettingValue(settings, ['primary_color', 'primaryColor']) || '#0f766e'
    const secondaryColor = getSettingValue(settings, ['secondary_color', 'secondaryColor']) || '#166534'
    const companyName = decodeHtmlEntities(getSettingValue(settings, ['company_name', 'companyName'])) || 'Sree Venkatesswara'
    const companyTagline = decodeHtmlEntities(getSettingValue(settings, ['company_tagline', 'companyTagline'])) || ''
    const companyAddress = [settings?.address, settings?.city, settings?.state, settings?.pincode].filter(Boolean).join(', ')
    const companyContact = [settings?.phone, settings?.alternate_phone].filter(Boolean).join(' | ')
    const companyWebsite = getSettingValue(settings, ['website', 'website_url', 'company_website'])

    const logoUrl = getLogoSettingValue(settings) || '/images/logo.jpeg'
    let logoBuffer: Buffer | null = null
    try {
      logoBuffer = await loadLogoBuffer(logoUrl)
    } catch (err) {
      console.error('[INVOICE PDF] Logo load failed:', err)
      logoBuffer = null
    }

    const download = req.query.download === '1' || req.query.download === 'true'
    const filename = `Invoice-${invoice.invoiceNumber || id}.pdf`

    const doc: any = new PDFDocument({
      size: 'A4',
      margin: {
        top: mmToPt(16),
        right: mmToPt(14),
        bottom: mmToPt(18),
        left: mmToPt(14),
      },
      bufferPages: true,
    })

    const chunks: any[] = []
    doc.on('data', (chunk: any) => chunks.push(chunk))
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks)
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', `${download ? 'attachment' : 'inline'}; filename="${filename}"`)
        res.send(pdfBuffer)
      }
    })

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right
    const left = doc.page.margins.left
    const top = doc.page.margins.top

    const formatDate = (dateValue: Date | string | null | undefined) => {
      if (!dateValue) return '-'
      const date = new Date(dateValue)
      return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    }

    const formatCurrency = (value: number | null | undefined) => {
      const amount = Number(value ?? 0)
      const formattedAmount = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount)

      return formattedAmount.includes('₹') ? formattedAmount.replace('₹', 'Rs.') : formattedAmount
    }

    // Column widths for header: Logo 18%, Company Details 52%, Invoice Details 30%
    const logoColWidth = pageWidth * 0.18
    const companyColWidth = pageWidth * 0.52
    const invoiceColWidth = pageWidth * 0.30

    const logoColX = left
    const companyColX = logoColX + logoColWidth
    const invoiceColX = companyColX + companyColWidth

    const drawHeader = () => {
      const headerTop = top
      const colHeight = 76

      // Draw column separators for clarity (optional visual guides)
      doc.rect(logoColX, headerTop, logoColWidth, colHeight).lineWidth(0).stroke()
      doc.rect(companyColX, headerTop, companyColWidth, colHeight).lineWidth(0).stroke()
      doc.rect(invoiceColX, headerTop, invoiceColWidth, colHeight).lineWidth(0).stroke()

      // Column 1: Logo
      if (logoBuffer && !/\.svg$/i.test(logoUrl || '')) {
        try {
          const logoFit = 60
          const logoPaddingX = 4
          const logoPaddingY = 8
          doc.image(logoBuffer, logoColX + logoPaddingX, headerTop + logoPaddingY, { fit: [logoFit, logoFit], align: 'left', quality: 100 })
        } catch (err) {
          console.error('[INVOICE PDF] Image render error:', err)
        }
      }

      // Column 2: Company Details
      const companyPaddingX = 8
      let companyY = headerTop + 4
      doc.font('Helvetica-Bold').fontSize(16).fillColor(primaryColor)
      doc.text(companyName, companyColX + companyPaddingX, companyY, { width: companyColWidth - 2 * companyPaddingX, align: 'left' })
      companyY += 18

      if (companyTagline) {
        doc.font('Helvetica-Oblique').fontSize(10).fillColor(secondaryColor)
        doc.text(companyTagline, companyColX + companyPaddingX, companyY, { width: companyColWidth - 2 * companyPaddingX, align: 'left' })
        companyY += 14
      } else {
        companyY += 2
      }

      // Company details: Phone, Email (no address, no website)
      doc.font('Helvetica').fontSize(8.5).fillColor('#334155')
      if (companyContact) {
        doc.text(`Ph: ${companyContact}`, companyColX + companyPaddingX, companyY, { width: companyColWidth - 2 * companyPaddingX, align: 'left' })
        companyY += 12
      }
      if (settings?.email) {
        // Use smaller font for email to prevent overflow
        doc.font('Helvetica').fontSize(7.5).fillColor('#334155')
        doc.text(`Email: ${settings.email}`, companyColX + companyPaddingX, companyY, { width: companyColWidth - 2 * companyPaddingX, align: 'left' })
        companyY += 11
      }

      // Column 3: Invoice Details (right-aligned, no title)
      const invoicePaddingX = 8
      let invoiceY = headerTop + 4

      // Invoice Number field
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#64748b')
      doc.text('Invoice No', invoiceColX + invoicePaddingX, invoiceY, { width: invoiceColWidth - 2 * invoicePaddingX, align: 'right' })
      doc.font('Helvetica').fontSize(9.5).fillColor('#0f172a')
      doc.text(invoice?.invoiceNumber || `INV-${new Date().getFullYear()}-0000`, invoiceColX + invoicePaddingX, invoiceY + 9, { width: invoiceColWidth - 2 * invoicePaddingX, align: 'right' })
      invoiceY += 18

      // Issue Date field
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#64748b')
      doc.text('Issue Date', invoiceColX + invoicePaddingX, invoiceY, { width: invoiceColWidth - 2 * invoicePaddingX, align: 'right' })
      doc.font('Helvetica').fontSize(9.5).fillColor('#0f172a')
      doc.text(formatDate(invoice?.issueDate), invoiceColX + invoicePaddingX, invoiceY + 9, { width: invoiceColWidth - 2 * invoicePaddingX, align: 'right' })
      invoiceY += 18

      // Due Date field
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#64748b')
      doc.text('Due Date', invoiceColX + invoicePaddingX, invoiceY, { width: invoiceColWidth - 2 * invoicePaddingX, align: 'right' })
      doc.font('Helvetica').fontSize(9.5).fillColor('#0f172a')
      doc.text(formatDate(invoice?.dueDate), invoiceColX + invoicePaddingX, invoiceY + 9, { width: invoiceColWidth - 2 * invoicePaddingX, align: 'right' })
      invoiceY += 18

      // Status field
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#64748b')
      doc.text('Status', invoiceColX + invoicePaddingX, invoiceY, { width: invoiceColWidth - 2 * invoicePaddingX, align: 'right' })
      doc.font('Helvetica').fontSize(9.5).fillColor('#0f172a')
      doc.text(invoice?.status || 'Draft', invoiceColX + invoicePaddingX, invoiceY + 9, { width: invoiceColWidth - 2 * invoicePaddingX, align: 'right' })

      // Horizontal separator line
      doc.moveTo(left, headerTop + colHeight).lineTo(left + pageWidth, headerTop + colHeight).strokeColor(primaryColor).lineWidth(1.5).stroke()
      doc.y = headerTop + colHeight + 12
    }

    const addFooter = (pageNumber?: number) => {
      const bottom = doc.page.height - doc.page.margins.bottom
      const footerStartY = bottom - 52

      // Top separator line
      doc.strokeColor('#cbd5e1').lineWidth(1)
      doc.moveTo(left, footerStartY).lineTo(left + pageWidth, footerStartY).stroke()

      let footerY = footerStartY + 4

      // Company name
      doc.font('Helvetica-Bold').fontSize(8).fillColor('#0f172a')
      doc.text(companyName, left, footerY, { width: pageWidth, align: 'left' })
      footerY += 10

      // Address (intelligent grouping - fit 2-3 lines max)
      doc.font('Helvetica').fontSize(7).fillColor('#64748b')
      if (companyAddress) {
        const addressParts = companyAddress.split(',').map((part: string) => part.trim())
        // Group address parts to fit on 2-3 lines instead of one per line
        if (addressParts.length <= 2) {
          doc.text(companyAddress, left, footerY, { width: pageWidth * 0.85, align: 'left' })
          footerY += 6
        } else {
          // Group into chunks: first 2 parts on line 1, rest on line 2
          const line1 = addressParts.slice(0, 2).join(', ')
          const line2 = addressParts.slice(2).join(', ')
          doc.text(line1, left, footerY, { width: pageWidth * 0.85, align: 'left' })
          footerY += 6
          doc.text(line2, left, footerY, { width: pageWidth * 0.85, align: 'left' })
          footerY += 6
        }
      }

      // Phone and Email on same line, separated by |
      doc.font('Helvetica').fontSize(7).fillColor('#64748b')
      let contactLine = ''
      if (companyContact) {
        contactLine += `Phone: ${companyContact}`
      }
      if (settings?.email) {
        contactLine += `${contactLine ? ' | ' : ''}Email: ${settings.email}`
      }
      if (contactLine) {
        doc.text(contactLine, left, footerY, { width: pageWidth * 0.85, align: 'left' })
      }

      // Page number at bottom right
      doc.font('Helvetica').fontSize(7).fillColor('#94a3b8')
      const footerText = `Page ${pageNumber} of ${doc.bufferedPageRange().count}`
      doc.text(footerText, left, footerY, { width: pageWidth, align: 'right' })
    }

    doc.on('pageAdded', () => {
      drawHeader()
    })

    drawHeader()

    // Bill To and Project Info cards (equal width, side by side)
    const cardWidth = (pageWidth - 12) / 2
    const cardPadding = 10

    const customerRows = [
      { label: 'Name', value: invoice.customer?.name || invoice.customerName },
      { label: 'Phone', value: invoice.customer?.phone },
      { label: 'Email', value: invoice.customer?.email },
      { label: 'Address', value: invoice.customer?.location },
    ].filter((row) => String(row.value || '').trim())

    const projectRows = [
      { label: 'Project', value: invoice.project?.title },
      { label: 'Type', value: invoice.project?.projectType || invoice.project?.category },
      { label: 'Status', value: invoice.project?.status },
    ].filter((row) => String(row.value || '').trim())

    const maxRows = Math.max(customerRows.length, projectRows.length)
    const cardHeight = 30 + maxRows * 16 + cardPadding

    ensurePageSpace(doc, cardHeight + 12)
    const cardsTop = doc.y

    // Bill To Card
    doc.roundedRect(left, cardsTop, cardWidth, cardHeight, 6).lineWidth(1).strokeColor('#e2e8f0').stroke()
    doc.rect(left, cardsTop, cardWidth, 28).fillColor(primaryColor).fill()
    doc.font('Helvetica-Bold').fontSize(11).fillColor('white')
    doc.text('Bill To', left + cardPadding, cardsTop + 8, { width: cardWidth - 2 * cardPadding, align: 'left' })

    let billY = cardsTop + 38
    doc.font('Helvetica').fontSize(9.5).fillColor('#334155')
    customerRows.forEach((row) => {
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#64748b')
      doc.text(row.label, left + cardPadding, billY, { width: cardWidth * 0.30, align: 'left' })
      doc.font('Helvetica').fontSize(9).fillColor('#0f172a')
      doc.text(row.value || '-', left + cardPadding + cardWidth * 0.35, billY, { width: cardWidth * 0.60, align: 'left' })
      billY += 16
    })

    // Project Info Card
    const projectCardX = left + cardWidth + 12
    doc.roundedRect(projectCardX, cardsTop, cardWidth, cardHeight, 6).lineWidth(1).strokeColor('#e2e8f0').stroke()
    doc.rect(projectCardX, cardsTop, cardWidth, 28).fillColor(secondaryColor).fill()
    doc.font('Helvetica-Bold').fontSize(11).fillColor('white')
    doc.text('Project Information', projectCardX + cardPadding, cardsTop + 8, { width: cardWidth - 2 * cardPadding, align: 'left' })

    let projectY = cardsTop + 38
    doc.font('Helvetica').fontSize(9.5).fillColor('#334155')
    projectRows.forEach((row) => {
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#64748b')
      doc.text(row.label, projectCardX + cardPadding, projectY, { width: cardWidth * 0.30, align: 'left' })
      doc.font('Helvetica').fontSize(9).fillColor('#0f172a')
      doc.text(row.value || '-', projectCardX + cardPadding + cardWidth * 0.35, projectY, { width: cardWidth * 0.60, align: 'left' })
      projectY += 16
    })

    doc.y = cardsTop + cardHeight + 12

    // Invoice Table (supports multiple items)
    ensurePageSpace(doc, 75)
    const tableTop = doc.y
    const amountColWidth = 90
    const descColWidth = pageWidth - amountColWidth - 4

    const items = Array.isArray(invoice.items) ? invoice.items : []
    const rowsCount = Math.max(1, items.length)
    const rowHeight = 18
    const headerHeight = 26
    const minBodyHeight = 32
    const bodyHeight = Math.max(minBodyHeight, rowsCount * rowHeight + 8)
    const tableHeight = headerHeight + bodyHeight

    // Table border (dynamic height)
    doc.roundedRect(left, tableTop, pageWidth, tableHeight, 6).lineWidth(1).strokeColor('#cbd5e1').stroke()

    // Table header background
    doc.rect(left, tableTop, pageWidth, headerHeight).fillColor('#f8fafc').fill()
    doc.moveTo(left, tableTop + headerHeight).lineTo(left + pageWidth, tableTop + headerHeight).strokeColor('#cbd5e1').lineWidth(0.5).stroke()

    // Table headers
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#0f172a')
    doc.text('Description', left + 10, tableTop + 8, { width: descColWidth - 14, align: 'left' })
    doc.text('Amount', left + descColWidth + 8, tableTop + 8, { width: amountColWidth - 14, align: 'right' })

    // Table rows (items)
    let currentY = tableTop + headerHeight + 8
    doc.font('Helvetica').fontSize(9.5).fillColor('#334155')

    if (items.length > 0) {
      for (const it of items) {
        ensurePageSpace(doc, rowHeight + 40)
        doc.text(decodeHtmlEntities(it.description || 'Item'), left + 10, currentY, { width: descColWidth - 14, align: 'left' })
        doc.font('Helvetica').fontSize(9.5).fillColor('#0f172a')
        doc.text(formatCurrency(it.amount), left + descColWidth + 8, currentY, { width: amountColWidth - 14, align: 'right' })
        currentY += rowHeight
        doc.font('Helvetica').fontSize(9.5).fillColor('#334155')
      }
    } else {
      // fallback single row to preserve old layout
      doc.text('Project / Service Charges', left + 10, currentY, { width: descColWidth - 14, align: 'left' })
      doc.font('Helvetica').fontSize(9.5).fillColor('#0f172a')
      doc.text(formatCurrency(invoice.subtotal), left + descColWidth + 8, currentY, { width: amountColWidth - 14, align: 'right' })
      currentY += rowHeight
    }

    doc.y = tableTop + tableHeight + 8

    // Summary Section
    ensurePageSpace(doc, 95)
    const summaryTop = doc.y
    const summaryLabelWidth = pageWidth * 0.65
    const summaryValueWidth = pageWidth * 0.35
    const summaryRows = [
      { label: 'Subtotal', value: formatCurrency(invoice.subtotal ?? 0) },
      { label: 'Discount', value: `${formatCurrency(invoice.discountAmount ?? 0)} (${Number(invoice.discountPercent ?? 0).toFixed(2)}%)` },
      { label: 'Tax', value: `${formatCurrency(invoice.taxAmount ?? 0)} (${Number(invoice.taxPercent ?? 0).toFixed(2)}%)` },
    ]

    summaryRows.forEach((row, index) => {
      doc.font('Helvetica').fontSize(9.5).fillColor('#334155')
      doc.text(row.label, left, summaryTop + index * 18, { width: summaryLabelWidth, align: 'left' })
      doc.font('Helvetica').fontSize(9.5).fillColor('#0f172a')
      doc.text(row.value, left + summaryLabelWidth, summaryTop + index * 18, { width: summaryValueWidth, align: 'right' })
    })

    doc.moveTo(left, summaryTop + summaryRows.length * 18 + 8).lineTo(left + pageWidth, summaryTop + summaryRows.length * 18 + 8).strokeColor('#cbd5e1').lineWidth(1).stroke()

    doc.rect(left, summaryTop + summaryRows.length * 18 + 12, pageWidth, 26).fillColor('#dcfce7').fill()
    doc.rect(left, summaryTop + summaryRows.length * 18 + 12, pageWidth, 26).lineWidth(0.5).strokeColor('#86efac').stroke()

    doc.font('Helvetica-Bold').fontSize(11).fillColor('#15803d')
    doc.text('Grand Total', left, summaryTop + summaryRows.length * 18 + 16, { width: summaryLabelWidth, align: 'left' })
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#15803d')
    const totalAmountValue = formatCurrency(invoice.totalAmount ?? 0)
    doc.text(totalAmountValue, left + summaryLabelWidth, summaryTop + summaryRows.length * 18 + 16, { width: summaryValueWidth, align: 'right' })

    doc.y = summaryTop + summaryRows.length * 18 + 48

    // Notes (if present)
    if (invoice.notes) {
      ensurePageSpace(doc, 45)
      doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#0f172a')
      doc.text('Notes', left, doc.y, { width: pageWidth, align: 'left' })
      doc.font('Helvetica').fontSize(9).fillColor('#334155')
      doc.text(invoice.notes, left, doc.y + 14, { width: pageWidth, align: 'left' })
      doc.y += 40
    }

    // Footer: Signature and thank you
    ensurePageSpace(doc, 50)
    const signatureAreaTop = doc.y
    const signatureX = left + pageWidth - 160

    doc.font('Helvetica').fontSize(9).fillColor('#64748b')
    const fs = require('fs')
const path = require('path')

const stampPath = path.join(process.cwd(), 'public', 'images', 'stamps', 'company-stamp.png')
const signaturePath = path.join(process.cwd(), 'public', 'images', 'signatures', 'authorized-signature.png')
if (fs.existsSync(stampPath)) {
  doc.opacity(0.30)
doc.image(stampPath, signatureX + 5, signatureAreaTop - 10, {
  width: 95
})
  doc.opacity(1)
}
if (fs.existsSync(signaturePath)) {
  doc.image(signaturePath, signatureX + 2, signatureAreaTop - 2, {
  width: 115
})
}
    doc.text('Authorized Signature', signatureX, signatureAreaTop, { width: 150, align: 'left' })
    doc.moveTo(signatureX, signatureAreaTop + 28).lineTo(signatureX + 140, signatureAreaTop + 28).strokeColor('#cbd5e1').lineWidth(1).stroke()

    doc.font('Helvetica-Oblique').fontSize(10).fillColor('#334155')
    doc.text('Thank you for choosing Sree Venkatesswara Constructions & Interiors.', left, signatureAreaTop + 40, { width: pageWidth, align: 'left' })

    addFooter(1)

    doc.end()
  } catch (error) {
    console.error('[INVOICE PDF]', error)
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Failed to generate invoice PDF' })
    }
  }
}
