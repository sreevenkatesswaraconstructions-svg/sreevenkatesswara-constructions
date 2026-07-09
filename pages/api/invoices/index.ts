import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { calculateInvoiceTotals } from '../../../lib/invoiceCalculations';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return handleGetInvoices(req, res);
  }

  if (req.method === 'POST') {
    return handleCreateInvoice(req, res);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

async function handleGetInvoices(req: NextApiRequest, res: NextApiResponse) {
  try {
    const invoices = await prisma.invoice.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: { id: true, name: true, phone: true },
        },
        project: {
          select: { id: true, title: true },
        },
      },
    });

    return res.status(200).json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch invoices' });
  }
}

async function handleCreateInvoice(req: NextApiRequest, res: NextApiResponse) {
  try {
    const body = req.body || {};
    const invoiceNumber = body.invoiceNumber || `INV-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    const issueDate = body.issueDate ? new Date(body.issueDate) : new Date();
    if (!issueDate || Number.isNaN(issueDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid issue date' });
    }

    const dueDate = body.dueDate ? new Date(body.dueDate) : null;
    if (body.dueDate && (!dueDate || Number.isNaN(dueDate.getTime()))) {
      return res.status(400).json({ success: false, message: 'Invalid due date' });
    }

    const parsedDiscountPercent = Number(body.discountPercent ?? 0);
    const parsedTaxPercent = Number(body.taxPercent ?? 0);

    // If items are provided, compute amounts from items and persist them together
    const items = Array.isArray(body.items) ? body.items : [];
    if (items.length > 0) {
      // normalize and compute amount for each item
      const normalizedItems = items.map((it: any) => {
        const quantity = Number(it.quantity ?? 0) || 0
        const unitPrice = Number(it.unitPrice ?? 0) || 0
        const amount = Number(it.amount ?? quantity * unitPrice) || quantity * unitPrice
        return {
          description: it.description ? String(it.description) : '',
          quantity,
          unitPrice,
          amount,
        }
      })

      const totals = calculateInvoiceTotals(normalizedItems, parsedDiscountPercent, parsedTaxPercent)

      // Create invoice with nested items using Prisma's nested create
      const invoiceCreateData: any = {
        invoiceNumber,
        customerName: body.customerName ? String(body.customerName) : null,
        status: body.status ? String(body.status) : 'Draft',
        issueDate,
        dueDate: dueDate || undefined,
        subtotal: totals.subtotal,
        discountPercent: totals.discountPercent,
        discountAmount: totals.discountAmount,
        taxPercent: totals.taxPercent,
        taxAmount: totals.taxAmount,
        totalAmount: totals.totalAmount,
        notes: body.notes ? String(body.notes) : null,
        items: {
          create: normalizedItems,
        },
      }

      if (body.customerId) {
        invoiceCreateData.customer = { connect: { id: String(body.customerId) } }
      }

      if (body.projectId) {
        invoiceCreateData.project = { connect: { id: String(body.projectId) } }
      }

      const invoice = await prisma.invoice.create({
        data: invoiceCreateData,
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          project: { select: { id: true, title: true } },
          items: { orderBy: { createdAt: 'asc' } },
        },
      })

      return res.status(201).json(invoice)
    }

    // Fallback to existing behavior when no items are provided
    const totals = calculateInvoiceTotals([], parsedDiscountPercent, parsedTaxPercent)
    if (Number.isNaN(totals.totalAmount) || totals.totalAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Total amount must be a number greater than zero' });
    }

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        customer: body.customerId
          ? { connect: { id: String(body.customerId) } }
          : undefined,
        customerName: body.customerName ? String(body.customerName) : null,
        project: body.projectId
          ? { connect: { id: String(body.projectId) } }
          : undefined,
        status: body.status ? String(body.status) : 'Draft',
        issueDate,
        dueDate: dueDate || undefined,
        subtotal: totals.subtotal,
        discountPercent: totals.discountPercent,
        discountAmount: totals.discountAmount,
        taxPercent: totals.taxPercent,
        taxAmount: totals.taxAmount,
        totalAmount: totals.totalAmount,
        notes: body.notes ? String(body.notes) : null,
      },
      include: {
        customer: {
          select: { id: true, name: true, phone: true },
        },
        project: {
          select: { id: true, title: true },
        },
      },
    });

    return res.status(201).json(invoice);
  } catch (error: any) {
    console.error('[INVOICE CREATE]', error);

    if (error?.code === 'P2002' && Array.isArray(error?.meta?.target)) {
      return res.status(409).json({ success: false, message: `Invoice number already exists: ${String(error.meta.target.join(', '))}` });
    }

    const message = error?.message || 'Failed to create invoice';
    return res.status(500).json({ success: false, message: `Failed to create invoice: ${message}` });
  }
}
