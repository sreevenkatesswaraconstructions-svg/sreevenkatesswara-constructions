import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { calculateInvoiceTotals } from '../../../lib/invoiceCalculations';

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
        items: {
          orderBy: { createdAt: 'asc' },
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
    const status = body.status ? String(body.status) : 'Draft';
    const notes = body.notes != null ? String(body.notes) : null;
    const discountPercent = Number(body.discountPercent ?? 0) || 0;
    const taxPercent = Number(body.taxPercent ?? 0) || 0;

    if (!body.dueDate || !dueDate || Number.isNaN(dueDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid due date' });
    }

    const incomingItems = Array.isArray(body.items) ? body.items : [];
    const normalizedItems = incomingItems.map((item: any) => {
      const quantity = Number(item.quantity ?? 0) || 0;
      const unitPrice = Number(item.unitPrice ?? 0) || 0;
      const amount = Number((quantity * unitPrice).toFixed(2));
      return {
        id: item.id ? String(item.id) : undefined,
        description: item.description ? String(item.description) : '',
        quantity,
        unitPrice,
        amount,
      };
    });

    const totals = calculateInvoiceTotals(normalizedItems, discountPercent, taxPercent);

    if (Number.isNaN(totals.totalAmount) || totals.totalAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Total amount must be greater than zero' });
    }

    const invoiceItemModel = (prisma as any).invoiceItem;
    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        dueDate,
        status,
        subtotal: totals.subtotal,
        discountPercent: totals.discountPercent,
        discountAmount: totals.discountAmount,
        taxPercent: totals.taxPercent,
        taxAmount: totals.taxAmount,
        totalAmount: totals.totalAmount,
        notes,
      },
    });

    if (invoiceItemModel) {
      try {
        await invoiceItemModel.deleteMany({ where: { invoiceId: id } });
      } catch (error) {
        console.warn('[INVOICE UPDATE] deleting old items failed', error);
      }

      if (normalizedItems.length > 0) {
        const itemsToCreate = normalizedItems.map((item: any) => ({
          invoiceId: updatedInvoice.id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.amount,
        }));

        try {
          if (invoiceItemModel.createMany) {
            await invoiceItemModel.createMany({ data: itemsToCreate });
          } else {
            for (const item of itemsToCreate) {
              await invoiceItemModel.create({ data: item });
            }
          }
        } catch (error) {
          console.warn('[INVOICE UPDATE] creating items failed', error);
        }
      }
    }

    let invoice: any = await prisma.invoice.findUnique({
      where: { id: updatedInvoice.id },
      include: {
        customer: {
          select: { id: true, name: true, phone: true },
        },
        project: {
          select: { id: true, title: true },
        },
        items: {
          orderBy: { createdAt: 'asc' },
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
