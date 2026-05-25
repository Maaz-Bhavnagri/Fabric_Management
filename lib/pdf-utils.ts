import type { InvoiceDetail } from './app-types';
import { format } from 'date-fns';

export async function generateOrderPdf(invoice: InvoiceDetail) {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  
  // Custom font size and styles
  doc.setFontSize(22);
  doc.setTextColor(40, 40, 40);
  doc.text('Lucky Creation', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Premium Fabric & Tailoring', pageWidth / 2, 26, { align: 'center' });

  // Invoice Details Section
  doc.setFontSize(12);
  doc.setTextColor(40, 40, 40);
  
  const createdDate = new Date(invoice.createdAt);
  const formattedDate = format(createdDate, 'dd MMM yyyy');
  
  doc.text(`Invoice Number: ${invoice.invoiceNumber}`, 14, 40);
  doc.text(`Date: ${formattedDate}`, 14, 46);
  if (invoice.paymentStatus) {
    doc.text(`Status: ${invoice.paymentStatus.toUpperCase()}`, 14, 52);
  }

  // Customer Details Section
  if (invoice.customer) {
    doc.text(`Customer Name: ${invoice.customer.fullName}`, 120, 40);
    doc.text(`Phone: ${invoice.customer.phone}`, 120, 46);
  } else {
    doc.text('Customer: Walk-in', 120, 40);
  }

  // Divider Line
  doc.setDrawColor(220, 220, 220);
  doc.line(14, 60, pageWidth - 14, 60);

  // Items Table
  const tableColumn = ["Item", "Fabric/Color", "₹/M", "Meters", "Fabric Amt", "Stitching", "Total"];
  const tableRows: Array<Array<string | number>> = [];

  let pdfFabricTotal = 0;
  let pdfStitchingTotal = 0;

  if (invoice.items && invoice.items.length > 0) {
    invoice.items.forEach(item => {
      const designName = item.fabricVariant?.design?.designName || 'Fabric';
      const variantDesc = `${designName} - ${item.fabricVariant?.color || 'N/A'}`;
      const fabricAmt = item.meters * item.ratePerMeter;
      const stitching = item.stitchingPrice || 0;
      pdfFabricTotal += fabricAmt;
      pdfStitchingTotal += stitching;
      const itemData = [
        designName,
        variantDesc,
        `Rs ${item.ratePerMeter.toFixed(2)}`,
        item.meters.toString(),
        `Rs ${fabricAmt.toFixed(2)}`,
        stitching > 0 ? `Rs ${stitching.toFixed(2)}` : '—',
        `Rs ${item.lineTotal.toFixed(2)}`
      ];
      tableRows.push(itemData);
    });
  } else {
    tableRows.push(["-", "No items", "-", "-", "-", "-", "-"]);
  }

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 65,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 36 },
      2: { cellWidth: 20 },
      3: { cellWidth: 16 },
      4: { cellWidth: 24 },
      5: { cellWidth: 22 },
      6: { cellWidth: 22 }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 8;
  const grandTotal = invoice.grandTotal || 0;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);

  let yOff = finalY;

  // Fabric total
  doc.text(`Fabric Total:`, pageWidth - 60, yOff);
  doc.text(`Rs ${pdfFabricTotal.toFixed(2)}`, pageWidth - 14, yOff, { align: 'right' });
  yOff += 6;

  // Stitching total (only if any)
  if (pdfStitchingTotal > 0) {
    doc.text(`Stitching Total:`, pageWidth - 60, yOff);
    doc.text(`Rs ${pdfStitchingTotal.toFixed(2)}`, pageWidth - 14, yOff, { align: 'right' });
    yOff += 6;
  }

  // Discount
  if (invoice.discount && invoice.discount > 0) {
    doc.text(`Discount:`, pageWidth - 60, yOff);
    doc.text(`- Rs ${invoice.discount.toFixed(2)}`, pageWidth - 14, yOff, { align: 'right' });
    yOff += 6;
  }

  if (invoice.tax && invoice.tax > 0) {
    doc.text(`Tax:`, pageWidth - 60, yOff);
    doc.text(`+ Rs ${invoice.tax.toFixed(2)}`, pageWidth - 14, yOff, { align: 'right' });
    yOff += 6;
  }

  // Grand total
  yOff += 2;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text(`Grand Total:`, pageWidth - 60, yOff);
  doc.text(`Rs ${grandTotal.toFixed(2)}`, pageWidth - 14, yOff, { align: 'right' });
  yOff += 7;

  if (invoice.advancePaid && invoice.advancePaid > 0) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Advance Paid:`, pageWidth - 60, yOff);
    doc.text(`Rs ${invoice.advancePaid.toFixed(2)}`, pageWidth - 14, yOff, { align: 'right' });
    yOff += 6;

    const balance = Math.max(0, grandTotal - invoice.advancePaid);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(balance > 0 ? 200 : 50, balance > 0 ? 50 : 150, 50);
    doc.text(`Balance Due:`, pageWidth - 60, yOff);
    doc.text(`Rs ${balance.toFixed(2)}`, pageWidth - 14, yOff, { align: 'right' });
  }

  const finalTotalY = yOff;


  // Footer notes
  if (invoice.notes) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text('Notes:', 14, finalTotalY + 10);
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    const splitNotes = doc.splitTextToSize(invoice.notes, 100);
    doc.text(splitNotes, 14, finalTotalY + 15);
  }

  const customerStr = invoice.customer ? invoice.customer.fullName.replace(/\s+/g, '_') : 'WalkIn';
  const nameFormatter = `${customerStr}_${format(createdDate, 'yyyy-MM-dd')}`;
  
  doc.save(`Invoice_${nameFormatter}.pdf`);
}
