import type { NextApiRequest, NextApiResponse } from 'next'
// @ts-ignore: pdfkit has no bundled TypeScript definitions in this workspace
import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}

const formatCurrency = (value: any) => `₹${Number(value || 0).toFixed(2)}`

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

function getSettingValue(settings: any, keys: string[]) {
  for (const key of keys) {
    if (settings && settings[key]) return settings[key]
  }
  return ''
}

function ensurePageSpace(doc: any, space: number) {
  if (doc.y + space > doc.page.height - doc.page.margins.bottom - 30) {
    doc.addPage()
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  const { quotation, settings } = req.body
  if (!quotation) {
    return res.status(400).json({ success: false, message: 'Missing quotation payload' })
  }

  try {
    const primaryColor = getSettingValue(settings, ['primary_color', 'primaryColor']) || '#0f766e'
    const secondaryColor = getSettingValue(settings, ['secondary_color', 'secondaryColor']) || '#166534'
    const companyName = decodeHtmlEntities(getSettingValue(settings, ['company_name', 'companyName'])) || 'Company Name'
    const companyTagline = decodeHtmlEntities(getSettingValue(settings, ['company_tagline', 'companyTagline'])) || ''
    const companyAddress = [settings?.address, settings?.city, settings?.state, settings?.pincode].filter(Boolean).join(', ')
    const companyContact = [settings?.phone, settings?.alternate_phone].filter(Boolean).join(' | ')
    const companyWebsite = getSettingValue(settings, ['website', 'website_url', 'company_website'])
    const gstNumber = getSettingValue(settings, ['gst_number', 'gstNumber'])
    const bankDetails = getSettingValue(settings, ['bank_details', 'bankDetails', 'bank'])
    const upiQr = getSettingValue(settings, ['upi_qr', 'upiQr', 'upi'])

    const doc: any = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true })
    const chunks: any[] = []
    doc.on('data', (chunk: any) => chunks.push(chunk))
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks)
      const filename = `Quotation-${quotation?.quotationNumber || `SVC-${new Date().getFullYear()}-0000`}.pdf`
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
      res.send(pdfBuffer)
    })

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right
    const left = doc.page.margins.left
    const top = doc.page.margins.top

    function drawHeader() {
      doc.font('Helvetica-Bold').fontSize(18).fillColor(primaryColor)
      doc.text(companyName, left, top, { align: 'left' })
      if (companyTagline) {
        doc.moveDown(0.15)
        doc.font('Helvetica').fontSize(10).fillColor(secondaryColor).text(companyTagline, { align: 'left' })
      }

      const addressLines: string[] = []
      if (companyAddress) addressLines.push(companyAddress)
      if (companyContact) addressLines.push(companyContact)
      if (companyWebsite) addressLines.push(`Website: ${companyWebsite}`)
      if (gstNumber) addressLines.push(`GST: ${gstNumber}`)

      if (addressLines.length) {
        doc.moveDown(0.35)
        doc.font('Helvetica').fontSize(10).fillColor('#334155').text(addressLines.join(' | '), { align: 'left' })
      }

      doc.moveDown(0.7)
      doc.strokeColor(secondaryColor).lineWidth(1.5).moveTo(left, doc.y).lineTo(left + pageWidth, doc.y).stroke()
      doc.moveDown(0.6)
    }

    function drawDocumentInfo() {
      const infoX = doc.page.width - doc.page.margins.right - 180
      const infoWidth = 180
      doc.font('Helvetica').fontSize(10).fillColor('#111827')
      doc.text(`Quotation No: ${quotation?.quotationNumber || `SVC-${new Date().getFullYear()}-0000`}`, infoX, top, { width: infoWidth, align: 'right' })
      doc.text(`Date: ${quotation?.createdAt ? new Date(quotation.createdAt).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB')}`, { width: infoWidth, align: 'right' })
      doc.text(`Status: ${quotation?.status || 'Draft'}`, { width: infoWidth, align: 'right' })
      doc.moveDown(0.4)
    }

    function addFooter(pageNumber?: number) {
      const bottom = doc.page.height - doc.page.margins.bottom + 10
      doc.font('Helvetica').fontSize(8).fillColor('#475569')
      doc.text(companyAddress || '', left, bottom, { width: pageWidth * 0.65, align: 'left' })
      const footerText = `Generated: ${new Date().toLocaleDateString('en-GB')} | Page ${pageNumber ?? doc.page.number}`
      doc.text(footerText, left, bottom, { width: pageWidth, align: 'right' })
    }

    function drawSectionBox(title: string, estimatedHeight: number, renderBody: () => void) {
      ensurePageSpace(doc, estimatedHeight + 24)
      const boxTop = doc.y
      doc.roundedRect(left, boxTop, pageWidth, estimatedHeight, 8).lineWidth(1).strokeColor('#000000').stroke()
      doc.font('Helvetica-Bold').fontSize(11).fillColor(primaryColor)
      doc.text(title, left + 12, boxTop + 10, { width: pageWidth - 24 })
      doc.font('Helvetica').fontSize(10).fillColor('#111827')
      doc.x = left + 12
      doc.y = boxTop + 36
      renderBody()
      doc.y = Math.max(doc.y, boxTop + estimatedHeight + 10)
    }

    const logoUrl = getSettingValue(settings, ['logo'])
    if (logoUrl) {
      try {
        let buffer: Buffer | null = null
        if (logoUrl.startsWith('/')) {
          const localPath = path.join(process.cwd(), 'public', logoUrl.replace(/^\//, ''))
          if (fs.existsSync(localPath)) {
            buffer = fs.readFileSync(localPath)
          }
        } else if (/^https?:\/\//i.test(logoUrl)) {
          const response = await fetch(logoUrl)
          if (response.ok) buffer = Buffer.from(await response.arrayBuffer())
        } else {
          const localPath = path.join(process.cwd(), 'public', logoUrl)
          if (fs.existsSync(localPath)) buffer = fs.readFileSync(localPath)
        }

        if (buffer && !/\.svg$/i.test(logoUrl)) {
          doc.image(buffer, left, doc.y, { fit: [120, 80], align: 'left' })
          doc.moveDown(0.4)
        }
      } catch (err) {
        console.error('Error loading logo for PDF:', err)
      }
    }

    doc.on('pageAdded', () => {
      drawHeader()
      drawDocumentInfo()
    })

    drawHeader()
    drawDocumentInfo()

    const selectedServices = Array.isArray(quotation.services) ? quotation.services : []
    const servicesText = selectedServices.length ? selectedServices.join(', ') : ''
    const terms = Array.isArray(quotation.terms) ? quotation.terms : []
    const attachments = Array.isArray(quotation.attachments) ? quotation.attachments : []
    const boqRows = Array.isArray(quotation.boq) ? quotation.boq : []
    const paymentRows = Array.isArray(quotation.paymentSchedule) ? quotation.paymentSchedule : []

    const customerRows = [
      { label: 'Customer Name', value: quotation.customerName },
      { label: 'Phone', value: quotation.customerPhone },
      { label: 'Email', value: quotation.customerEmail },
      { label: 'Site Address', value: quotation.siteAddress },
      { label: 'Reference', value: quotation.referenceBy },
      { label: 'Alternate Phone', value: quotation.customerAlternatePhone },
      { label: 'Secondary Email', value: quotation.customerSecondaryEmail },
    ].filter(row => String(row.value || '').trim())

    if (customerRows.length) {
      drawSectionBox('Customer Details', 36 + customerRows.length * 18, () => {
        customerRows.forEach(row => {
          doc.text(`${row.label}: ${row.value || '-'}`, { width: pageWidth - 24, paragraphGap: 2 })
        })
      })
    }

    const projectRows = [
      { label: 'Project Name', value: quotation.projectName },
      { label: 'Project Type', value: quotation.projectType },
      { label: 'Location', value: quotation.projectLocation },
      { label: 'Plot Area', value: quotation.plotArea },
      { label: 'Built-up Area', value: quotation.builtUpArea },
      { label: 'No. of Floors', value: quotation.floors },
      { label: 'Estimated Duration', value: quotation.estimatedDuration },
    ].filter(row => String(row.value || '').trim())

    if (projectRows.length) {
      drawSectionBox('Project Details', 36 + projectRows.length * 18, () => {
        projectRows.forEach(row => {
          doc.text(`${row.label}: ${row.value || '-'}`, { width: pageWidth - 24, paragraphGap: 2 })
        })
      })
    }

    if (servicesText) {
      drawSectionBox('Selected Services', 70, () => {
        doc.text(servicesText, { width: pageWidth - 24, paragraphGap: 2 })
      })
    }

    if (boqRows.length) {
      drawSectionBox('Bill of Quantities (BOQ)', 50 + boqRows.length * 16, () => {
        const columns = [140, 70, 45, 40, 55, 35, 55]
        const xPositions = [left + 12, left + 12 + columns[0], left + 12 + columns[0] + columns[1], left + 12 + columns[0] + columns[1] + columns[2], left + 12 + columns[0] + columns[1] + columns[2] + columns[3], left + 12 + columns[0] + columns[1] + columns[2] + columns[3] + columns[4], left + 12 + columns[0] + columns[1] + columns[2] + columns[3] + columns[4] + columns[5]]
        doc.font('Helvetica-Bold').fontSize(8).fillColor('#111827')
        doc.text('Description', xPositions[0], doc.y, { width: columns[0] })
        doc.text('Category', xPositions[1], doc.y, { width: columns[1] })
        doc.text('Unit', xPositions[2], doc.y, { width: columns[2] })
        doc.text('Qty', xPositions[3], doc.y, { width: columns[3] })
        doc.text('Rate', xPositions[4], doc.y, { width: columns[4] })
        doc.text('GST', xPositions[5], doc.y, { width: columns[5] })
        doc.text('Amount', xPositions[6], doc.y, { width: columns[6] })
        doc.moveDown(0.5)
        doc.font('Helvetica').fontSize(8)
        boqRows.forEach((row: any) => {
          doc.text(String(row.description || '-'), xPositions[0], doc.y, { width: columns[0] })
          doc.text(String(row.category || '-'), xPositions[1], doc.y, { width: columns[1] })
          doc.text(String(row.unit || '-'), xPositions[2], doc.y, { width: columns[2] })
          doc.text(String(row.quantity || 0), xPositions[3], doc.y, { width: columns[3] })
          doc.text(formatCurrency(row.rate), xPositions[4], doc.y, { width: columns[4] })
          doc.text(`${row.gst || 0}%`, xPositions[5], doc.y, { width: columns[5] })
          doc.text(formatCurrency(row.amount), xPositions[6], doc.y, { width: columns[6] })
          doc.moveDown(0.4)
        })
      })
    }

    if (paymentRows.length) {
      drawSectionBox('Payment Schedule', 50 + paymentRows.length * 16, () => {
        doc.font('Helvetica-Bold').fontSize(8).fillColor('#111827')
        doc.text('Milestone', { continued: true, width: 180 })
        doc.text('Percent', { continued: true, width: 80, align: 'right' })
        doc.text('Amount', { width: 80, align: 'right' })
        doc.moveDown(0.25)
        doc.font('Helvetica').fontSize(8)
        paymentRows.forEach((item: any) => {
          doc.text(String(item.title || 'Milestone'), { continued: true, width: 180 })
          doc.text(`${item.percent || 0}%`, { continued: true, width: 80, align: 'right' })
          doc.text(formatCurrency(((quotation.grandTotal || quotation.grand_total || 0) * (item.percent || 0)) / 100), { width: 80, align: 'right' })
          doc.moveDown(0.2)
        })
      })
    }

    const summaryRows = [
      { label: 'Subtotal', value: formatCurrency(quotation.subtotal || quotation.sub_total || 0) },
      ...(quotation.gstTotal || quotation.gst_total ? [{ label: 'GST', value: formatCurrency(quotation.gstTotal || quotation.gst_total) }] : []),
      ...(quotation.discount ? [{ label: 'Discount', value: formatCurrency(quotation.discount) }] : []),
    ]

    drawSectionBox('Summary', 34 + summaryRows.length * 18, () => {
      summaryRows.forEach(row => {
        doc.text(`${row.label}: ${row.value}`, { width: pageWidth - 24, paragraphGap: 2 })
      })
      doc.text(`Grand Total: ${formatCurrency(quotation.grandTotal || quotation.grand_total || 0)}`, { width: pageWidth - 24, paragraphGap: 2 })
    })

    if (terms.length) {
      drawSectionBox('Terms & Conditions', 34 + terms.length * 18, () => {
        terms.forEach((term: string, index: number) => {
          doc.text(`${index + 1}. ${term || '-'}`, { width: pageWidth - 24, paragraphGap: 2 })
        })
      })
    }

    const notesText = String(quotation.notes || '').trim()
    if (notesText) {
      drawSectionBox('Notes', 34 + 16, () => {
        doc.text(notesText, { width: pageWidth - 24, paragraphGap: 2 })
      })
    }

    if (attachments.length) {
      drawSectionBox('Attachments', 34 + attachments.length * 18, () => {
        attachments.forEach((attachment: any, index: number) => {
          doc.text(`${index + 1}. ${attachment.originalName || attachment.name || attachment.fileName || attachment.filename || ''}`, { width: pageWidth - 24, paragraphGap: 2 })
        })
      })
    }

    drawSectionBox('Signatures', 130, () => {
      const boxWidth = (pageWidth - 24 - 24) / 3
      const boxHeight = 86
      const startX = doc.x
      const startY = doc.y

      const drawSignatureBox = (x: number, label: string, name?: string, subtitle?: string) => {
        doc.save()
        doc.rect(x, startY, boxWidth, boxHeight).lineWidth(0.5).strokeColor('#cbd5e1').stroke()
        doc.font('Helvetica-Bold').fontSize(8).fillColor('#0f172a').text(label, x + 8, startY + 8, { width: boxWidth - 16 })
        if (name) {
          doc.font('Helvetica-Bold').fontSize(10).fillColor('#111827').text(name, x + 8, startY + 24, { width: boxWidth - 16 })
        }
        if (subtitle) {
          doc.font('Helvetica').fontSize(8).fillColor('#475569').text(subtitle, x + 8, startY + 42, { width: boxWidth - 16 })
        }
        const lineY = startY + boxHeight - 20
        doc.moveTo(x + 8, lineY).lineTo(x + boxWidth - 8, lineY).lineWidth(0.8).strokeColor('#94a3b8').stroke()
        doc.restore()
      }

      drawSignatureBox(
        startX,
        'Prepared By',
        companyName || 'Sree Venkateswara',
        companyTagline || 'Constructions & Interiors'
      )
      drawSignatureBox(startX + boxWidth + 12, 'Authorized Signature')
      drawSignatureBox(startX + (boxWidth + 12) * 2, 'Customer Signature')
      doc.y = startY + boxHeight + 12
    })

    ensurePageSpace(doc, 40)
    doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(left, doc.y).lineTo(left + pageWidth, doc.y).stroke()
    doc.moveDown(0.6)
    doc.font('Helvetica').fontSize(9).fillColor('#475569').text(companyAddress || '', { align: 'left' })
    if (companyWebsite) doc.text(`Web: ${companyWebsite}`, { align: 'left' })
    if (companyContact) doc.text(companyContact, { align: 'left' })

    const range = doc.bufferedPageRange()
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(i)
      addFooter(i + 1)
    }

    doc.end()
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Failed to generate PDF' })
  }
}
