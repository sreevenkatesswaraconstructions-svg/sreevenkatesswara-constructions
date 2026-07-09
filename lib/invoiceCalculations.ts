export type InvoiceTotals = {
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  taxPercent: number;
  taxAmount: number;
  totalAmount: number;
};

export const calculateInvoiceTotals = (
  items: Array<Record<string, any>> = [],
  discountPercent = 0,
  taxPercent = 0,
): InvoiceTotals => {
  const normalizedDiscountPercent = Number(discountPercent || 0);
  const normalizedTaxPercent = Number(taxPercent || 0);

  const subtotal = (Array.isArray(items) ? items : []).reduce((sum, item) => {
    const quantity = Number(item?.quantity ?? 0) || 0;
    const unitPrice = Number(item?.unitPrice ?? 0) || 0;
    const lineAmount = quantity || unitPrice
      ? Number((quantity * unitPrice).toFixed(2))
      : Number(item?.amount ?? 0);

    return sum + lineAmount;
  }, 0);

  const discountAmount = Number((subtotal * (normalizedDiscountPercent / 100)).toFixed(2));
  const subtotalAfterDiscount = Number((subtotal - discountAmount).toFixed(2));
  const taxAmount = Number((subtotalAfterDiscount * (normalizedTaxPercent / 100)).toFixed(2));
  const totalAmount = Number((subtotalAfterDiscount + taxAmount).toFixed(2));

  return {
    subtotal: Number(subtotal.toFixed(2)),
    discountPercent: normalizedDiscountPercent,
    discountAmount,
    taxPercent: normalizedTaxPercent,
    taxAmount,
    totalAmount,
  };
};

export const formatCurrency = (value: number | null | undefined) => {
  const safeValue = Number(value || 0);
  return `₹${safeValue.toFixed(2)}`;
};
