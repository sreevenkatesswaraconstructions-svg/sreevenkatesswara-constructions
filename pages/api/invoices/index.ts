import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

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

    const subtotal = Number(body.subtotal ?? 0);
    const taxAmount = Number(body.taxAmount ?? 0);
    const totalAmount = Number(body.totalAmount ?? 0);

    if (Number.isNaN(totalAmount) || totalAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Total amount must be a number greater than zero' });
    }

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        customerId: body.customerId ? String(body.customerId) : null,
        customerName: body.customerName ? String(body.customerName) : null,
        projectId: body.projectId ? String(body.projectId) : null,
        status: body.status ? String(body.status) : 'Draft',
        issueDate,
        dueDate: dueDate || undefined,
        subtotal,
        taxAmount,
        totalAmount,
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
