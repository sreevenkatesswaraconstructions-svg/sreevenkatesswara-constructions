import { prisma } from '../../../lib/prisma'
import { NextApiRequest, NextApiResponse } from 'next'
import * as XLSX from 'xlsx'
import PDFDocument from 'pdfkit'
import { format } from 'date-fns'
import { normalizeEnquiryStatus, normalizeEnquirySource, normalizeEnquiryCreatedBy } from '../../../lib/enquiryUtils'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { format: exportFormat, status, startDate, endDate } = req.query

    const where: any = {}
    
    if (status) {
      where.status = status as string
    }
    
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate as string)
      if (endDate) where.createdAt.lte = new Date(endDate as string)
    }

    const enquiries = await prisma.enquiry.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    if (exportFormat === 'excel') {
      // Export to Excel
      const worksheet = XLSX.utils.json_to_sheet(
        enquiries.map((e) => ({
          'Customer Name': e.customerName,
          'Email': e.email || 'N/A',
          'Phone': e.phone,
          'Service': e.service,
          'Budget': e.budget || 'N/A',
          'Location': e.location || 'N/A',
          'Message': e.message || 'N/A',
          'Source': normalizeEnquirySource(e.source),
          'Status': normalizeEnquiryStatus(e.status),
          'Created By': normalizeEnquiryCreatedBy(e.createdBy),
          'Contacted': e.isContacted ? 'Yes' : 'No',
          'Date': format(new Date(e.createdAt), 'yyyy-MM-dd HH:mm:ss'),
        }))
      )

      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Enquiries')
      
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      res.setHeader('Content-Disposition', `attachment; filename=enquiries-${format(new Date(), 'yyyy-MM-dd')}.xlsx`)
      
      return res.send(buffer)
    } else if (exportFormat === 'pdf') {
      // Export to PDF
      const doc = new PDFDocument({ margin: 50 })
      const chunks: any[] = []

      doc.on('data', (chunk) => chunks.push(chunk))
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks)
        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', `attachment; filename=enquiries-${format(new Date(), 'yyyy-MM-dd')}.pdf`)
        res.send(pdfBuffer)
      })

      // PDF Header
      doc.fontSize(20).font('Helvetica-Bold').text('Sree Venkatesswara Constructions & Interiors', { align: 'center' })
      doc.fontSize(14).font('Helvetica').text('Enquiries Report', { align: 'center' })
      doc.fontSize(10).text(`Generated on: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`, { align: 'center' })
      doc.moveDown()

      // Table Header
      doc.fontSize(10).font('Helvetica-Bold')
      doc.text('Name', 50, doc.y)
      doc.text('Email', 150, doc.y)
      doc.text('Phone', 300, doc.y)
      doc.text('Service', 400, doc.y)
      doc.text('Status', 500, doc.y)
      doc.moveDown()

      // Table Rows
      doc.fontSize(9).font('Helvetica')
      enquiries.forEach((enquiry) => {
        doc.text(enquiry.customerName, 50, doc.y, { width: 100, ellipsis: true })
        doc.text(enquiry.email, 150, doc.y, { width: 150, ellipsis: true })
        doc.text(enquiry.phone, 300, doc.y, { width: 100, ellipsis: true })
        doc.text(enquiry.service, 400, doc.y, { width: 100, ellipsis: true })
        doc.text(enquiry.status, 500, doc.y)
        doc.moveDown()
      })

      doc.end()
      
      // Wait for PDF to finish
      return new Promise((resolve) => {})
    } else {
      return res.status(400).json({ error: 'Invalid export format' })
    }
  } catch (error) {
    console.error('Export error:', error)
    return res.status(500).json({ error: 'Failed to export enquiries' })
  }
}
