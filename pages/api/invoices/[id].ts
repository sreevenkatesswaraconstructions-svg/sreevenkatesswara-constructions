import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ success: false, message: 'Invoice ID is required' });
  }

  if (req.method === 'GET') {
    return handleGetInvoice(id, res);
  }

  if (req.method === 'PUT') {
    return handleUpdateInvoice(id, req, res);
  }

  if (req.method === 'DELETE') {
    return handleDeleteInvoice(id, res);
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

async function handleDeleteInvoice(id: string, res: NextApiResponse) {
  try {
    await prisma.invoice.delete({ where: { id } });
    return res.status(200).json({ success: true, message: 'Invoice deleted' });
  } catch (error: any) {
    console.error('[INVOICE DELETE]', error);
    if (error?.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    return res.status(500).json({ success: false, message: 'Failed to delete invoice' });
  }
}

async function handleGetInvoice(id: string, res: NextApiResponse) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: {
          select: { id: true, name: true, phone: true },
        },
        project: {
          select: { id: true, title: true },
        },
      },
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    return res.status(200).json(invoice);
  } catch (error) {
    console.error('[INVOICE FETCH]', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch invoice' });
  }
}

async function handleUpdateInvoice(id: string, req: NextApiRequest, res: NextApiResponse) {
  try {
    const body = req.body || {};
    const dueDate = body.dueDate ? new Date(body.dueDate) : null;
    const totalAmount = Number(body.totalAmount);
    const status = body.status ? String(body.status) : 'Draft';
    const notes = body.notes != null ? String(body.notes) : null;

    if (!body.dueDate || !dueDate || Number.isNaN(dueDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid due date' });
    }

    if (Number.isNaN(totalAmount) || totalAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Total amount must be greater than zero' });
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        dueDate,
        status,
        totalAmount,
        notes,
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

    return res.status(200).json(invoice);
  } catch (error) {
    console.error('[INVOICE UPDATE]', error);

    if (error?.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const message = error?.message || 'Failed to update invoice';
    return res.status(500).json({ success: false, message: `Failed to update invoice: ${message}` });
  }
}
