import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportBookingsPDF = (bookings, adminName) => {
  const doc = new jsPDF();

  doc.setFontSize(22);
  doc.setTextColor(99, 102, 241);
  doc.text('🌉 SewaPro', 14, 20);

  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Booking Report — ${adminName}`, 14, 30);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 14, 37);

  autoTable(doc, {
    startY: 45,
    head: [['#', 'Worker', 'Category', 'Date', 'Hours', 'Rate ₹', 'Amount ₹', 'Status']],
    body: bookings.map((b, i) => [
      i + 1,
      b.workerId?.name || 'N/A',
      b.workerId?.category || 'N/A',
      b.date ? new Date(b.date).toLocaleDateString('en-IN') : 'N/A',
      b.estimatedHours || '-',
      b.workerId?.pricePerHour || '-',
      `₹${b.totalAmount || 0}`,
      b.status
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [99, 102, 241] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    didDrawPage: (data) => {
      doc.setFontSize(8);
      doc.text('SewaPro Platform', 14, doc.internal.pageSize.height - 10);
      doc.text(`Page ${data.pageNumber}`, doc.internal.pageSize.width - 25, doc.internal.pageSize.height - 10);
    }
  });

  doc.save(`SewaPro_Report_${Date.now()}.pdf`);
};
