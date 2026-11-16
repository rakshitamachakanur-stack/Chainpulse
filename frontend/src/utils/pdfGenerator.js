import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

/**
 * Generates and downloads a corporate Purchase Order PDF
 */
export function generatePurchaseOrderPDF(order) {
  if (!order) return;
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });

  const brandColor = [44, 95, 93];    // Forest #2C5F5D
  const accentColor = [198, 134, 66]; // Copper #C68642
  const darkSlate = [46, 50, 57];     // Slate #2E3239
  const textMuted = [120, 125, 135];

  // Header banner
  doc.setFillColor(...brandColor);
  doc.rect(0, 0, 612, 70, 'F');

  // Accent line
  doc.setFillColor(...accentColor);
  doc.rect(0, 70, 612, 4, 'F');

  // Logo / Title
  doc.setTextColor(248, 244, 236);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('CHAINPULSE', 40, 42);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 215, 210);
  doc.text('INTELLIGENT SUPPLY CHAIN MANAGEMENT', 40, 56);

  // Document Type Header (Right aligned)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(248, 244, 236);
  doc.text('PURCHASE ORDER', 572, 42, { align: 'right' });

  doc.setFontSize(11);
  doc.setTextColor(...accentColor);
  doc.text(`${order.orderNumber || 'PO-DRAFT'}`, 572, 56, { align: 'right' });

  // PO Metadata Box
  doc.setTextColor(...darkSlate);
  doc.setFontSize(10);
  const startY = 100;

  // Two columns: Left: Supplier & Buyer info, Right: PO Details
  // Left Column - Supplier Info
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...brandColor);
  doc.text('VENDOR / SUPPLIER:', 40, startY);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkSlate);
  doc.setFontSize(11);
  doc.text(order.supplier?.name || 'Authorized Supplier', 40, startY + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...textMuted);
  doc.text(`Code: ${order.supplier?.code || 'N/A'}`, 40, startY + 28);
  doc.text(`Contact: ${order.supplier?.contactName || 'Procurement Rep'}`, 40, startY + 40);
  doc.text(`Email: ${order.supplier?.email || 'supplier@chainpulse.com'}`, 40, startY + 52);
  doc.text(`Phone: ${order.supplier?.phone || '+1-555-0100'}`, 40, startY + 64);

  // Middle Column - Ship To
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...brandColor);
  doc.setFontSize(10);
  doc.text('SHIP TO / FACILITY:', 240, startY);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkSlate);
  doc.setFontSize(11);
  doc.text('ChainPulse Main Distribution Center', 240, startY + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...textMuted);
  doc.text('456 Warehouse Blvd, Logistics Bay 4', 240, startY + 28);
  doc.text('Los Angeles, CA 90001, USA', 240, startY + 40);
  doc.text('Recipient: Inbound Receiving Team', 240, startY + 52);
  doc.text('Contact: warehouse@chainpulse.com', 240, startY + 64);

  // Right Column - Order Details Box
  doc.setFillColor(245, 247, 246);
  doc.roundedRect(420, startY - 8, 152, 80, 4, 4, 'F');
  doc.setDrawColor(220, 225, 222);
  doc.roundedRect(420, startY - 8, 152, 80, 4, 4, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...textMuted);
  doc.text('ORDER DATE:', 430, startY + 8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...darkSlate);
  doc.text(order.createdAt ? format(new Date(order.createdAt), 'MMM d, yyyy') : format(new Date(), 'MMM d, yyyy'), 500, startY + 8);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textMuted);
  doc.text('STATUS:', 430, startY + 24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...accentColor);
  doc.text((order.status || 'draft').toUpperCase(), 500, startY + 24);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textMuted);
  doc.text('PAYMENT:', 430, startY + 40);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...darkSlate);
  doc.text((order.paymentStatus || 'Net 30').toUpperCase(), 500, startY + 40);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textMuted);
  doc.text('DELIVERY ETA:', 430, startY + 56);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...darkSlate);
  doc.text(order.expectedDelivery ? format(new Date(order.expectedDelivery), 'MMM d, yyyy') : 'Standard', 500, startY + 56);

  // Table of Items
  const tableRows = (order.items || []).map((item, index) => {
    const prod = item.product || {};
    const sku = prod.sku || `SKU-${index + 1}`;
    const name = prod.name || 'Catalog Product Item';
    const qty = item.quantity || 1;
    const price = item.unitPrice || prod.unitPrice || 0;
    const total = item.totalPrice || (qty * price);

    return [
      index + 1,
      sku,
      name,
      `${qty} ${prod.unit || 'units'}`,
      `$${Number(price).toFixed(2)}`,
      `$${Number(total).toFixed(2)}`
    ];
  });

  autoTable(doc, {
    startY: 195,
    head: [['#', 'SKU', 'Description', 'Qty', 'Unit Price', 'Line Total']],
    body: tableRows,
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 6,
      textColor: darkSlate,
      lineColor: [225, 230, 228],
      lineWidth: 0.5
    },
    headStyles: {
      fillColor: brandColor,
      textColor: [248, 244, 236],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 25, halign: 'center' },
      1: { cellWidth: 80, fontStyle: 'bold' },
      2: { cellWidth: 220 },
      3: { cellWidth: 60, halign: 'right' },
      4: { cellWidth: 75, halign: 'right' },
      5: { cellWidth: 80, halign: 'right', fontStyle: 'bold' }
    },
    margin: { left: 40, right: 40 }
  });

  // Financial summary
  const finalY = doc.lastAutoTable.finalY + 20;
  const totalAmount = order.totalAmount || tableRows.reduce((sum, r) => sum + parseFloat(r[5].replace('$', '')), 0);

  // Notes on left
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...brandColor);
  doc.text('TERMS & INSTRUCTIONS:', 40, finalY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...textMuted);
  doc.text('1. Please reference the PO Number on all invoices and packaging.', 40, finalY + 14);
  doc.text('2. Packing slip must accompany all shipments.', 40, finalY + 26);
  doc.text('3. Any damaged or defective items will be rejected upon GRN verification.', 40, finalY + 38);

  // Totals box on right
  const boxX = 390;
  doc.setFillColor(248, 249, 248);
  doc.rect(boxX, finalY - 8, 182, 70, 'F');
  doc.setDrawColor(220, 225, 222);
  doc.rect(boxX, finalY - 8, 182, 70, 'S');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...textMuted);
  doc.text('Subtotal:', boxX + 12, finalY + 8);
  doc.setTextColor(...darkSlate);
  doc.text(`$${Number(totalAmount).toFixed(2)}`, 560, finalY + 8, { align: 'right' });

  doc.setTextColor(...textMuted);
  doc.text('Tax & Duties (0%):', boxX + 12, finalY + 24);
  doc.setTextColor(...darkSlate);
  doc.text('$0.00', 560, finalY + 24, { align: 'right' });

  doc.setFillColor(...accentColor);
  doc.rect(boxX, finalY + 34, 182, 28, 'F');
  doc.setTextColor(248, 244, 236);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('TOTAL AMOUNT:', boxX + 12, finalY + 52);
  doc.text(`$${Number(totalAmount).toFixed(2)} USD`, 560, finalY + 52, { align: 'right' });

  // Signatures section at bottom
  const signY = finalY + 110;
  doc.setDrawColor(200, 205, 200);
  doc.line(40, signY, 220, signY);
  doc.line(390, signY, 570, signY);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkSlate);
  doc.text('AUTHORIZED PURCHASING AGENT', 40, signY + 12);
  doc.text('SUPPLIER ACCEPTANCE SIGNATURE', 390, signY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textMuted);
  doc.text(`Approved by: ${order.createdBy?.name || 'Alice Manager'}`, 40, signY + 24);
  doc.text(`Date: ${format(new Date(), 'MMM d, yyyy')}`, 390, signY + 24);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(...textMuted);
  doc.text('Generated securely via ChainPulse Supply Chain Intelligence Platform', 306, 760, { align: 'center' });

  doc.save(`PO-${order.orderNumber || 'DRAFT'}.pdf`);
}

/**
 * Generates and downloads a Goods Receipt Note (GRN) PDF
 */
export function generateGoodsReceiptPDF(grn) {
  if (!grn) return;
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });

  const brandColor = [44, 95, 93];    // Forest #2C5F5D
  const accentColor = [122, 174, 142]; // Sage #7AAE8E
  const darkSlate = [46, 50, 57];
  const textMuted = [120, 125, 135];

  // Header banner
  doc.setFillColor(...brandColor);
  doc.rect(0, 0, 612, 70, 'F');

  // Accent line
  doc.setFillColor(...accentColor);
  doc.rect(0, 70, 612, 4, 'F');

  // Title
  doc.setTextColor(248, 244, 236);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('CHAINPULSE', 40, 42);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 215, 210);
  doc.text('WAREHOUSE RECEIVING & QUALITY ASSURANCE', 40, 56);

  // GRN Type Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(248, 244, 236);
  doc.text('GOODS RECEIPT NOTE', 572, 42, { align: 'right' });

  doc.setFontSize(11);
  doc.setTextColor(...accentColor);
  doc.text(`${grn.grnNumber || 'GRN-DRAFT'}`, 572, 56, { align: 'right' });

  const startY = 100;
  // Metadata Details
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...brandColor);
  doc.setFontSize(10);
  doc.text('RECEIVING RECORD:', 40, startY);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkSlate);
  doc.setFontSize(11);
  doc.text(grn.supplier?.name || 'Inbound Shipment Supplier', 40, startY + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...textMuted);
  doc.text(`Linked Purchase Order: ${grn.order?.orderNumber || 'Direct Receiving'}`, 40, startY + 28);
  doc.text(`Warehouse Inspector: ${grn.verifiedBy?.name || grn.createdBy?.name || 'Warehouse Staff'}`, 40, startY + 40);
  doc.text(`Receiving Date: ${grn.receivedDate ? format(new Date(grn.receivedDate), 'MMM d, yyyy HH:mm') : format(new Date(), 'MMM d, yyyy')}`, 40, startY + 52);

  // Verification Status Badge
  doc.setFillColor(245, 247, 246);
  doc.roundedRect(420, startY - 8, 152, 65, 4, 4, 'F');
  doc.setDrawColor(220, 225, 222);
  doc.roundedRect(420, startY - 8, 152, 65, 4, 4, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...textMuted);
  doc.text('INSPECTION STATUS:', 430, startY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  const statusColor = grn.status === 'verified' ? [44, 95, 93] : [184, 92, 56];
  doc.setTextColor(...statusColor);
  doc.text((grn.status || 'draft').toUpperCase(), 430, startY + 28);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...textMuted);
  doc.text(`Inventory Updated: ${grn.status === 'verified' ? 'YES (Auto-synced)' : 'PENDING'}`, 430, startY + 44);

  // Items Table
  const tableRows = (grn.items || []).map((item, index) => {
    const prod = item.product || {};
    return [
      index + 1,
      prod.sku || `ITEM-${index + 1}`,
      prod.name || 'Stock item',
      item.orderedQty || 0,
      item.receivedQty || 0,
      item.rejectedQty || 0,
      (item.condition || 'good').toUpperCase(),
      item.rejectionReason || 'None (Accepted)'
    ];
  });

  autoTable(doc, {
    startY: 180,
    head: [['#', 'SKU', 'Description', 'Ordered', 'Accepted', 'Rejected', 'Condition', 'Discrepancy Notes']],
    body: tableRows,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 5,
      textColor: darkSlate,
      lineColor: [225, 230, 228],
      lineWidth: 0.5
    },
    headStyles: {
      fillColor: brandColor,
      textColor: [248, 244, 236],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 20, halign: 'center' },
      1: { cellWidth: 65, fontStyle: 'bold' },
      2: { cellWidth: 150 },
      3: { cellWidth: 50, halign: 'right' },
      4: { cellWidth: 50, halign: 'right', fontStyle: 'bold' },
      5: { cellWidth: 50, halign: 'right' },
      6: { cellWidth: 60, halign: 'center' },
      7: { cellWidth: 85 }
    },
    margin: { left: 40, right: 40 }
  });

  const finalY = doc.lastAutoTable.finalY + 25;

  // Notes
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...brandColor);
  doc.text('RECEIVING OBSERVATIONS & DAMAGE REPORT:', 40, finalY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...darkSlate);
  doc.text(grn.notes || grn.damageReport || 'Goods inspected in compliance with ChainPulse warehouse quality verification protocols. No external pallet damage recorded.', 40, finalY + 16, { maxWidth: 530 });

  // Signatures
  const signY = finalY + 80;
  doc.setDrawColor(200, 205, 200);
  doc.line(40, signY, 220, signY);
  doc.line(390, signY, 570, signY);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkSlate);
  doc.text('RECEIVING CLERK / INSPECTOR', 40, signY + 12);
  doc.text('WAREHOUSE OPERATIONS MANAGER', 390, signY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textMuted);
  doc.text(`Inspected by: ${grn.verifiedBy?.name || 'Bob Warehouse'}`, 40, signY + 24);
  doc.text(`Verified: ${format(new Date(), 'MMM d, yyyy')}`, 390, signY + 24);

  doc.save(`GRN-${grn.grnNumber || 'DRAFT'}.pdf`);
}
