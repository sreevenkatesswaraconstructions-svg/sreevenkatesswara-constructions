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

function getLogoSettingValue(settings: any) {
  return getSettingValue(settings, ['logo', 'company_logo', 'companyLogo', 'logoUrl']) || ''
}

const mmToPt = (mm: number) => mm * 2.83465

function ensurePageSpace(doc: any, space: number) {
  const contentBottom = doc.page.height - doc.page.margins.bottom - 20
  if (doc.y + space > contentBottom) {
    doc.addPage()
  }
}

async function loadLogoBuffer(logoUrl: string): Promise<Buffer | null> {
  if (!logoUrl) return null

  if (logoUrl.startsWith('data:')) {
    const matches = logoUrl.match(/^data:(image\/\w+);base64,(.+)$/)
    if (!matches) {
      throw new Error('Invalid data URL for logo image')
    }
    const buffer = Buffer.from(matches[2], 'base64')
    return buffer
  }

  if (logoUrl.startsWith('/')) {
    const localPath = path.join(process.cwd(), 'public', logoUrl.replace(/^\//, ''))
    if (!fs.existsSync(localPath)) {
      throw new Error(`Logo file not found at ${localPath}`)
    }
    const buffer = fs.readFileSync(localPath)
    return buffer
  }

  if (/^https?:\/\//i.test(logoUrl)) {
    try {
      const response = await fetch(logoUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
        },
      })
      if (!response.ok) {
        throw new Error(`Logo download failed with status ${response.status} ${response.statusText}`)
      }
      const contentType = response.headers.get('content-type') || ''
      if (contentType && !contentType.startsWith('image/')) {
        throw new Error(`Unexpected logo content type: ${contentType}`)
      }
      const buffer = Buffer.from(await response.arrayBuffer())
      return buffer
    } catch (error) {
      console.error('[Quotation PDF] Error downloading logo image:', error)
      throw error
    }
  }

  const localPath = path.join(process.cwd(), 'public', logoUrl)
  if (fs.existsSync(localPath)) {
    const buffer = fs.readFileSync(localPath)
    return buffer
  }

  throw new Error(`Unsupported logo URL format: ${logoUrl}`)
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
      const filename = `Quotation-${quotation?.quotationNumber || `SVC-${new Date().getFullYear()}-0000`}.pdf`
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
      res.send(pdfBuffer)
    })

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right
    const left = doc.page.margins.left
    const top = doc.page.margins.top

    const logoUrl = getLogoSettingValue(settings) || '/images/logo.jpeg'
    let logoBuffer: Buffer | null = null
    if (logoUrl) {
      try {
        logoBuffer = await loadLogoBuffer(logoUrl)
      } catch (error) {
        console.error('[Quotation PDF] Image loading failed:', error)
        throw error
      }
    }

    const drawHeader = () => {
      const headerTop = top
      let currentY = headerTop

      if (logoBuffer && !/\.svg$/i.test(logoUrl || '')) {
        try {
          doc.image(logoBuffer, left, currentY - 4, {
            fit: [90, 90],
            align: 'left',
            quality: 100,
          })
        } catch (error) {
          console.error('[Quotation PDF] Image loading error:', error)
          throw error
        }
      } else if (!logoBuffer) {
      }

      const companyX = logoBuffer ? left + 120 : left
      doc.font('Helvetica-Bold').fontSize(18).fillColor(primaryColor)
      doc.text(companyName, companyX, currentY, { align: 'left' })
      currentY += 22
      
      if (companyTagline) {
        doc.font('Helvetica-Oblique').fontSize(13).fillColor(secondaryColor).text(companyTagline, companyX, currentY, { align: 'left' })
        currentY += 16
      }

      doc.font('Helvetica').fontSize(11).fillColor('#334155')
      const companyDetails: string[] = []
      if (companyAddress) companyDetails.push(companyAddress)
      if (companyContact) companyDetails.push(`Ph: ${companyContact}`)
      if (settings?.email) companyDetails.push(`Email: ${settings.email}`)
      if (companyWebsite) companyDetails.push(`Web: ${companyWebsite}`)
      if (gstNumber) companyDetails.push(`GSTIN: ${gstNumber}`)
      
      if (companyDetails.length) {
        doc.text(companyDetails.join('  |  '), companyX, currentY, { align: 'left' })
      }

      const infoX = doc.page.width - doc.page.margins.right - 200
      doc.font('Helvetica-Bold').fontSize(12).fillColor('#1e293b')
      doc.text('QUOTATION', infoX, top, { width: 200, align: 'right' })
      doc.moveDown(0.2)
      
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#64748b')
      doc.text('Quotation No:', infoX, doc.y, { width: 200, align: 'right' })
      doc.font('Helvetica').fontSize(11).fillColor('#0f172a')
      doc.text(quotation?.quotationNumber || `SVC-${new Date().getFullYear()}-0000`, infoX, doc.y, { width: 200, align: 'right' })
      doc.moveDown(0.15)
      
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#64748b')
      doc.text('Date:', infoX, doc.y, { width: 200, align: 'right' })
      doc.font('Helvetica').fontSize(11).fillColor('#0f172a')
      doc.text(quotation?.createdAt ? new Date(quotation.createdAt).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'), infoX, doc.y, { width: 200, align: 'right' })
      doc.moveDown(0.15)
      
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#64748b')
      doc.text('Status:', infoX, doc.y, { width: 200, align: 'right' })
      doc.font('Helvetica').fontSize(11).fillColor('#0f172a')
      doc.text(quotation?.status || 'Draft', infoX, doc.y, { width: 200, align: 'right' })

      doc.moveDown(1)
      doc.strokeColor(primaryColor).lineWidth(3).moveTo(left, doc.y).lineTo(left + pageWidth, doc.y).stroke()
      doc.moveDown(0.5)
    }

    const addFooter = (pageNumber?: number) => {
      const bottom = doc.page.height - doc.page.margins.bottom - 12
      doc.strokeColor('#94a3b8').lineWidth(1).moveTo(left, bottom - 15).lineTo(left + pageWidth, bottom - 15).stroke()
      
      doc.font('Helvetica').fontSize(8).fillColor('#64748b')
      const footerLines: string[] = []
      if (companyAddress) footerLines.push(companyAddress)
      if (companyContact) footerLines.push(`Ph: ${companyContact}`)
      if (settings?.email) footerLines.push(`Email: ${settings.email}`)
      if (companyWebsite) footerLines.push(`Web: ${companyWebsite}`)
      
      const footerLeft = footerLines.join('  |  ')
      doc.text(footerLeft || '', left, bottom, { width: pageWidth * 0.65, align: 'left' })
      
      const footerText = `Generated: ${new Date().toLocaleDateString('en-GB')} at ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}  |  Page ${pageNumber} of ${doc.bufferedPageRange().count}`
      doc.text(footerText, left, bottom, { width: pageWidth, align: 'right' })
    }

    const drawSectionBox = (title: string, estimatedHeight: number, renderBody: () => void) => {
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

    doc.on('pageAdded', () => {
      drawHeader()
    })

    drawHeader()

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
      const customerHeight = 60 + customerRows.length * 22
      ensurePageSpace(doc, customerHeight + 24)
      const customerBoxTop = doc.y
      doc.roundedRect(left, customerBoxTop, pageWidth, customerHeight, 10).lineWidth(1.5).strokeColor('#1e293b').stroke()
      
      doc.rect(left, customerBoxTop, pageWidth, 30).fillColor(primaryColor).fill()
      doc.font('Helvetica-Bold').fontSize(13).fillColor('white')
      doc.text('CUSTOMER INFORMATION', left + 15, customerBoxTop + 10, { width: pageWidth - 30 })
      
      doc.y = customerBoxTop + 40
      doc.font('Helvetica').fontSize(10).fillColor('#334155')
      
      const colWidth = (pageWidth - 30) / 2
      customerRows.forEach((row, index) => {
        const isLeft = index % 2 === 0
        const xPos = isLeft ? left + 15 : left + 15 + colWidth + 10
        const yPos = isLeft ? doc.y : doc.y - 22
        
        doc.text(`${row.label}:`, xPos, yPos, { width: 100, continued: true })
        doc.text(row.value || '-', { width: colWidth - 110 })
        
        if (isLeft && index < customerRows.length - 1) {
          doc.moveDown(0.5)
        }
      })
      
      doc.y = customerBoxTop + customerHeight + 15
    }

    const projectRows = [
      { label: 'Project Name', value: quotation.projectName },
      { label: 'Scope of Project', value: quotation.projectType },
      { label: 'Location', value: quotation.projectLocation },
      { label: 'Plot Area', value: quotation.plotArea },
      { label: 'Built-up Area', value: quotation.builtUpArea },
      { label: 'No. of Floors', value: quotation.floors },
      { label: 'Estimated Duration', value: quotation.estimatedDuration },
    ].filter(row => String(row.value || '').trim())

    if (projectRows.length) {
      const projectHeight = 60 + projectRows.length * 22
      ensurePageSpace(doc, projectHeight + 24)
      const projectBoxTop = doc.y
      doc.roundedRect(left, projectBoxTop, pageWidth, projectHeight, 10).lineWidth(1.5).strokeColor('#1e293b').stroke()
      
      doc.rect(left, projectBoxTop, pageWidth, 30).fillColor(secondaryColor).fill()
      doc.font('Helvetica-Bold').fontSize(13).fillColor('white')
      doc.text('PROJECT INFORMATION', left + 15, projectBoxTop + 10, { width: pageWidth - 30 })
      
      doc.y = projectBoxTop + 40
      doc.font('Helvetica').fontSize(10).fillColor('#334155')
      
      const colWidth = (pageWidth - 30) / 2
      projectRows.forEach((row, index) => {
        const isLeft = index % 2 === 0
        const xPos = isLeft ? left + 15 : left + 15 + colWidth + 10
        const yPos = isLeft ? doc.y : doc.y - 22
        
        doc.text(`${row.label}:`, xPos, yPos, { width: 100, continued: true })
        doc.text(row.value || '-', { width: colWidth - 110 })
        
        if (isLeft && index < projectRows.length - 1) {
          doc.moveDown(0.5)
        }
      })
      
      doc.y = projectBoxTop + projectHeight + 15
    }

    if (servicesText) {
      drawSectionBox('Selected Services', 70, () => {
        doc.text(servicesText, { width: pageWidth - 24, paragraphGap: 2 })
      })
    }

    if (boqRows.length) {
      const drawBOQTable = () => {
        const tableLeft = left + 15
        const tableWidth = pageWidth - 30
        const columns = [40, 180, 80, 45, 50, 70, 70]
        const xPositions = columns.reduce((acc: number[], col: number, idx: number) => {
          acc.push(idx === 0 ? tableLeft : acc[idx - 1] + columns[idx - 1])
          return acc
        }, [] as number[])
        const headers = ['S.No', 'Description', 'Brand', 'Unit', 'Qty', 'Rate', 'Amount']
        const rightAlignCols = [4, 5, 6]

        const drawTableHeader = (y: number) => {
          doc.save()
          doc.rect(tableLeft, y, tableWidth, 26).fillColor(primaryColor).fill()
          doc.font('Helvetica-Bold').fontSize(10).fillColor('white')
          headers.forEach((header, idx) => {
            const align = rightAlignCols.includes(idx) ? 'right' : 'left'
            doc.text(header, xPositions[idx] + 5, y + 8, { width: columns[idx] - 10, align })
          })
          doc.restore()
        }

        const drawCategoryRow = (category: string, y: number) => {
          const rowHeight = 28
          doc.save()
          doc.rect(tableLeft, y, tableWidth, rowHeight).fillColor('#f8fafc').fill()
          doc.rect(tableLeft, y, tableWidth, rowHeight).lineWidth(1).strokeColor('#94a3b8').stroke()
          doc.font('Helvetica-Bold').fontSize(11).fillColor('#0f172a')
          doc.text(category.toUpperCase(), tableLeft + 10, y + 9)
          doc.restore()
          return rowHeight
        }

        const drawCategorySubtotal = (category: string, subtotal: number, y: number) => {
          const rowHeight = 28
          doc.save()
          doc.rect(tableLeft, y, tableWidth, rowHeight).fillColor('#e2e8f0').fill()
          doc.rect(tableLeft, y, tableWidth, rowHeight).lineWidth(1).strokeColor('#64748b').stroke()
          doc.font('Helvetica-Bold').fontSize(10).fillColor('#1e293b')
          doc.text(`Section Total:`, tableLeft + 10, y + 9)
          doc.text(formatCurrency(subtotal), xPositions[6] + 5, y + 9, { width: columns[6] - 10, align: 'right' })
          doc.restore()
          return rowHeight
        }

        const drawTableRow = (row: any, y: number, slNo: number) => {
          const rowHeight = 24
          doc.save()
          doc.rect(tableLeft, y, tableWidth, rowHeight).lineWidth(0.75).strokeColor('#cbd5e1').stroke()
          doc.font('Helvetica').fontSize(9).fillColor('#334155')
          
          doc.text(String(slNo), xPositions[0] + 5, y + 8, { width: columns[0] - 10, align: 'center' })
          
          const desc = String(row.description || '-')
          const descHeight = doc.heightOfString(desc, { width: columns[1] - 10 })
          const adjustedRowHeight = Math.max(rowHeight, descHeight + 10)
          
          if (descHeight > 14) {
            doc.rect(tableLeft, y, tableWidth, adjustedRowHeight).lineWidth(0.75).strokeColor('#cbd5e1').stroke()
          }
          
          doc.text(desc, xPositions[1] + 5, y + 8, { width: columns[1] - 10 })
          doc.text(String(row.brand || '-'), xPositions[2] + 5, y + 8, { width: columns[2] - 10 })
          doc.text(String(row.unit || '-'), xPositions[3] + 5, y + 8, { width: columns[3] - 10, align: 'center' })
          doc.text(String(row.quantity || 0), xPositions[4] + 5, y + 8, { width: columns[4] - 10, align: 'right' })
          doc.text(formatCurrency(row.rate), xPositions[5] + 5, y + 8, { width: columns[5] - 10, align: 'right' })
          doc.text(formatCurrency(row.amount), xPositions[6] + 5, y + 8, { width: columns[6] - 10, align: 'right' })
          doc.restore()
          return adjustedRowHeight
        }

        let tableY = doc.y
        drawTableHeader(tableY)
        tableY += 26

        const groupedBOQ = boqRows.reduce((acc: any, row: any) => {
          const category = row.category || 'General'
          if (!acc[category]) acc[category] = []
          acc[category].push(row)
          return acc
        }, {})

        let globalSlNo = 1
        let totalBoqValue = 0
        Object.keys(groupedBOQ).forEach((category) => {
          const categoryRows = groupedBOQ[category]
          
          if (tableY + 60 > doc.page.height - doc.page.margins.bottom - 40) {
            doc.addPage()
            tableY = doc.y
            drawTableHeader(tableY)
            tableY += 26
          }

          const catRowHeight = drawCategoryRow(category, tableY)
          tableY += catRowHeight

          let categorySubtotal = 0
          categoryRows.forEach((row: any) => {
            if (tableY + 35 > doc.page.height - doc.page.margins.bottom - 40) {
              doc.addPage()
              tableY = doc.y
              drawTableHeader(tableY)
              tableY += 26
              const catRowHeight = drawCategoryRow(category, tableY)
              tableY += catRowHeight
            }
            const rowHeight = drawTableRow(row, tableY, globalSlNo++)
            tableY += rowHeight
            categorySubtotal += Number(row.amount || 0)
          })

          totalBoqValue += categorySubtotal

          if (tableY + 35 > doc.page.height - doc.page.margins.bottom - 40) {
            doc.addPage()
            tableY = doc.y
          }
          const subtotalRowHeight = drawCategorySubtotal(category, categorySubtotal, tableY)
          tableY += subtotalRowHeight
        })

        doc.save()
        doc.y = tableY + 15
      }

      const estimatedBOQHeight = 80 + boqRows.length * 30
      ensurePageSpace(doc, estimatedBOQHeight + 40)
      const boxTop = doc.y
      doc.roundedRect(left, boxTop, pageWidth, estimatedBOQHeight, 10).lineWidth(1.5).strokeColor('#1e293b').stroke()
      
      doc.rect(left, boxTop, pageWidth, 35).fillColor(primaryColor).fill()
      doc.font('Helvetica-Bold').fontSize(14).fillColor('white')
      doc.text('BILL OF QUANTITIES', left + 15, boxTop + 12, { width: pageWidth - 30 })
      
      doc.y = boxTop + 45
      drawBOQTable()
      doc.y = Math.max(doc.y, boxTop + estimatedBOQHeight + 15)
    }

    if (paymentRows.length) {
      const paymentHeight = 70 + paymentRows.length * 26
      ensurePageSpace(doc, paymentHeight + 30)
      const paymentBoxTop = doc.y
      doc.roundedRect(left, paymentBoxTop, pageWidth, paymentHeight, 10).lineWidth(1.5).strokeColor('#1e293b').stroke()
      
      doc.rect(left, paymentBoxTop, pageWidth, 35).fillColor(primaryColor).fill()
      doc.font('Helvetica-Bold').fontSize(14).fillColor('white')
      doc.text('PAYMENT TERMS', left + 15, paymentBoxTop + 12, { width: pageWidth - 30 })
      
      doc.y = paymentBoxTop + 50
      
      const tableLeft = left + 15
      const tableWidth = pageWidth - 30
      const columns = [200, 90, 90]
      const xPositions = columns.reduce((acc: number[], col: number, idx: number) => {
        acc.push(idx === 0 ? tableLeft : acc[idx - 1] + columns[idx - 1])
        return acc
      }, [] as number[])
      const headers = ['Milestone', 'Percentage', 'Amount']
      const rightAlignCols = [1, 2]

      const drawPaymentHeader = (y: number) => {
        doc.save()
        doc.rect(tableLeft, y, tableWidth, 24).fillColor('#f1f5f9').fill()
        doc.rect(tableLeft, y, tableWidth, 24).lineWidth(1).strokeColor('#94a3b8').stroke()
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#1e293b')
        headers.forEach((header, idx) => {
          const align = rightAlignCols.includes(idx) ? 'right' : 'left'
          doc.text(header, xPositions[idx] + 8, y + 8, { width: columns[idx] - 16, align })
        })
        doc.restore()
      }

      const drawPaymentRow = (item: any, y: number) => {
        const rowHeight = 26
        doc.save()
        doc.rect(tableLeft, y, tableWidth, rowHeight).lineWidth(0.75).strokeColor('#cbd5e1').stroke()
        doc.font('Helvetica').fontSize(10).fillColor('#334155')
        doc.text(String(item.title || 'Milestone'), xPositions[0] + 8, y + 8, { width: columns[0] - 16 })
        doc.text(`${item.percent || 0}%`, xPositions[1] + 8, y + 8, { width: columns[1] - 16, align: 'right' })
        doc.text(formatCurrency(((quotation.grandTotal || quotation.grand_total || 0) * (item.percent || 0)) / 100), xPositions[2] + 8, y + 8, { width: columns[2] - 16, align: 'right' })
        doc.restore()
        return rowHeight
      }

      let paymentY = doc.y
      drawPaymentHeader(paymentY)
      paymentY += 24

      paymentRows.forEach((item: any) => {
        if (paymentY + 35 > doc.page.height - doc.page.margins.bottom - 40) {
          doc.addPage()
          paymentY = doc.y
          drawPaymentHeader(paymentY)
          paymentY += 24
        }
        const rowHeight = drawPaymentRow(item, paymentY)
        paymentY += rowHeight
      })

      doc.y = paymentBoxTop + paymentHeight + 15
    }

    const subtotalValue = quotation.subtotal || quotation.sub_total || 0
    const discountValue = quotation.discount || 0
    const subtotalAfterDiscountValue = subtotalValue - discountValue
    const hasStoredGstPercent = quotation.gstPercent !== undefined && quotation.gstPercent !== null
    const gstValue = quotation.gstAmount !== undefined && quotation.gstAmount !== null
      ? Number(quotation.gstAmount)
      : (quotation.gstTotal !== undefined && quotation.gstTotal !== null ? Number(quotation.gstTotal) : 0)
    const hasStoredDiscountPercent = quotation.discountPercent !== undefined && quotation.discountPercent !== null
    const discountPercentValue = hasStoredDiscountPercent
      ? Number(quotation.discountPercent)
      : (subtotalValue > 0 ? (discountValue / subtotalValue) * 100 : 0)
    const gstPercentValue = Number(hasStoredGstPercent ? quotation.gstPercent : (subtotalAfterDiscountValue > 0 ? (gstValue / subtotalAfterDiscountValue) * 100 : 0))
    const summaryRows = [
      { label: 'Discount %', value: `${discountPercentValue.toFixed(2)}%` },
      { label: 'Discount Amount', value: formatCurrency(discountValue) },
      { label: 'Subtotal After Discount', value: formatCurrency(subtotalAfterDiscountValue) },
      { label: 'GST %', value: `${gstPercentValue.toFixed(2)}%` },
      { label: 'GST Amount', value: formatCurrency(gstValue) },
    ]

    const summaryHeight = 70 + summaryRows.length * 28 + 40
    ensurePageSpace(doc, summaryHeight + 30)
    const summaryBoxTop = doc.y
    doc.roundedRect(left, summaryBoxTop, pageWidth, summaryHeight, 10).lineWidth(1.5).strokeColor('#1e293b').stroke()
    
    doc.rect(left, summaryBoxTop, pageWidth, 35).fillColor(secondaryColor).fill()
    doc.font('Helvetica-Bold').fontSize(14).fillColor('white')
    doc.text('PAYMENT SUMMARY', left + 15, summaryBoxTop + 12, { width: pageWidth - 30 })
    
    doc.y = summaryBoxTop + 50
    doc.font('Helvetica').fontSize(11).fillColor('#334155')
    summaryRows.forEach(row => {
      doc.text(`${row.label}:`, { continued: true, width: pageWidth - 30 - 150 })
      doc.text(row.value, { width: 150, align: 'right' })
      doc.moveDown(0.5)
    })
    const grandTotalY = doc.y + 10
    doc.roundedRect(left + 15, grandTotalY, pageWidth - 30, 38, 6).fillColor(primaryColor).fill()
    doc.font('Helvetica-Bold').fontSize(16).fillColor('white')
    doc.text('GRAND TOTAL:', left + 25, grandTotalY + 12, { continued: true, width: pageWidth - 30 - 180 })
    doc.text(formatCurrency(quotation.grandTotal || quotation.grand_total || 0), { width: 150, align: 'right' })
    doc.y = summaryBoxTop + summaryHeight + 15

    if (terms.length) {
      const normalizedTerms = terms
        .map((term: string) => String(term || '').trim())
        .filter(Boolean)
        .map((term: string) => term.replace(/^\s*\d+[.)\-]\s*/, '').trim())

      const numberX = left + 15
      const numberColumnWidth = Math.max(18, doc.widthOfString(`${normalizedTerms.length}.`) + 8)
      const textX = numberX + numberColumnWidth + 4
      const textWidth = pageWidth - textX + left - 10
      const itemGap = 8

      const termsHeight =
        35 +
        15 +
        normalizedTerms.reduce((height, term) => {
          return (
            height +
            doc.heightOfString(term, {
              width: textWidth,
              align: 'justify',
              lineGap: 3,
            }) +
            itemGap
          )
        }, 0) +
        15

      ensurePageSpace(doc, termsHeight + 30)
      const termsBoxTop = doc.y
      doc.roundedRect(left, termsBoxTop, pageWidth, termsHeight, 10).lineWidth(1.5).strokeColor('#1e293b').stroke()

      doc.rect(left, termsBoxTop, pageWidth, 35).fillColor(primaryColor).fill()
      doc.font('Helvetica-Bold').fontSize(14).fillColor('white')
      doc.text('TERMS & CONDITIONS', left + 15, termsBoxTop + 12, { width: pageWidth - 30 })

      doc.y = termsBoxTop + 50
      doc.font('Helvetica').fontSize(10).fillColor('#334155')

      normalizedTerms.forEach((term: string, index: number) => {
        const startY = doc.y
        const serialNumber = `${index + 1}.`
        const serialNumberWidth = doc.widthOfString(serialNumber)

        doc.font('Helvetica-Bold').fontSize(10).fillColor('#334155')
        doc.text(serialNumber, numberX + numberColumnWidth - serialNumberWidth, startY, {
          width: numberColumnWidth,
          align: 'left',
        })

        const textHeight = doc.heightOfString(term, {
          width: textWidth,
          align: 'justify',
          lineGap: 3,
        })

        doc.font('Helvetica').fontSize(10).fillColor('#334155')
        doc.text(term, textX, startY, {
          width: textWidth,
          align: 'justify',
          lineGap: 3,
        })

        doc.y = startY + textHeight + itemGap
      })

      doc.y += 8
    }

    const notesText = String(quotation.notes || '').trim()
    if (notesText) {
      const notesHeight = 34 + 50
      ensurePageSpace(doc, notesHeight + 24)
      const notesBoxTop = doc.y
      doc.roundedRect(left, notesBoxTop, pageWidth, notesHeight, 8).lineWidth(1).strokeColor('#000000').stroke()
      doc.font('Helvetica-Bold').fontSize(11).fillColor(primaryColor)
      doc.text('Notes', left + 12, notesBoxTop + 10, { width: pageWidth - 24 })
      doc.y = notesBoxTop + 36
      doc.font('Helvetica').fontSize(10).fillColor('#111827')
      doc.text(notesText, { width: pageWidth - 24, paragraphGap: 2 })
      doc.y = notesBoxTop + notesHeight + 10
    }

    if (attachments.length) {
      const attachmentsHeight = 34 + attachments.length * 20
      ensurePageSpace(doc, attachmentsHeight + 24)
      const attachmentsBoxTop = doc.y
      doc.roundedRect(left, attachmentsBoxTop, pageWidth, attachmentsHeight, 8).lineWidth(1).strokeColor('#000000').stroke()
      doc.font('Helvetica-Bold').fontSize(11).fillColor(primaryColor)
      doc.text('Attachments', left + 12, attachmentsBoxTop + 10, { width: pageWidth - 24 })
      doc.y = attachmentsBoxTop + 36
      doc.font('Helvetica').fontSize(10).fillColor('#111827')
      attachments.forEach((attachment: any, index: number) => {
        doc.text(`${index + 1}. ${attachment.originalName || attachment.name || attachment.fileName || attachment.filename || ''}`, { width: pageWidth - 24, paragraphGap: 4 })
        doc.moveDown(0.2)
      })
      doc.y = attachmentsBoxTop + attachmentsHeight + 10
    }

    const signaturesHeight = 150
    ensurePageSpace(doc, signaturesHeight + 30)
    const sigBoxTop = doc.y
    doc.roundedRect(left, sigBoxTop, pageWidth, signaturesHeight, 10).lineWidth(1.5).strokeColor('#1e293b').stroke()
    
    doc.rect(left, sigBoxTop, pageWidth, 35).fillColor(primaryColor).fill()
    doc.font('Helvetica-Bold').fontSize(14).fillColor('white')
    doc.text('SIGNATURES', left + 15, sigBoxTop + 12, { width: pageWidth - 30 })
    
    doc.y = sigBoxTop + 50

    const boxWidth = (pageWidth - 30 - 20) / 3
    const boxHeight = 95
    const startX = left + 15
    const startY = doc.y

    const drawSignatureBox = (x: number, label: string, name?: string, subtitle?: string) => {
      doc.save()
      doc.roundedRect(x, startY, boxWidth, boxHeight, 8).lineWidth(1).strokeColor('#94a3b8').stroke()
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#1e293b')
      doc.text(label, x + 12, startY + 12, { width: boxWidth - 24 })
      if (name) {
        doc.font('Helvetica-Bold').fontSize(12).fillColor('#0f172a')
        doc.text(name, x + 12, startY + 35, { width: boxWidth - 24 })
      }
      if (subtitle) {
        doc.font('Helvetica-Oblique').fontSize(9).fillColor('#64748b')
        doc.text(subtitle, x + 12, startY + 52, { width: boxWidth - 24 })
      }
      const lineY = startY + boxHeight - 28
      doc.moveTo(x + 12, lineY).lineTo(x + boxWidth - 12, lineY).lineWidth(1.5).strokeColor('#475569').stroke()
      doc.restore()
    }

    drawSignatureBox(
      startX,
      'Prepared By',
      companyName || 'Sree Venkateswara',
      companyTagline || 'Constructions & Interiors'
    )
    drawSignatureBox(startX + boxWidth + 10, 'Authorized Signature')
    drawSignatureBox(startX + (boxWidth + 10) * 2, 'Customer Signature')
    doc.y = sigBoxTop + signaturesHeight + 15

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
