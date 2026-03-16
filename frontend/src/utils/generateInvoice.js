import jsPDF from 'jspdf';

export const generateInvoice = (job) => {
  const doc = new jsPDF();
  doc.setFillColor(99, 102, 241);
  doc.rect(0, 0, 210, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22); doc.setFont('helvetica', 'bold');
  doc.text('SewaPro', 20, 25);
  doc.setFontSize(11); doc.setFont('helvetica', 'normal');
  doc.text('Service Invoice', 150, 25);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.text(`Invoice #: SP-${job._id?.slice(-6).toUpperCase() || 'N/A'}`, 20, 52);
  doc.text(`Date: ${new Date(job.completedAt || job.createdAt).toLocaleDateString('en-IN')}`, 20, 60);
  doc.text(`Status: ${job.status}`, 20, 68);

  doc.setFillColor(245, 245, 255);
  doc.rect(15, 78, 180, 0.5, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
  doc.text('Service Details', 20, 90);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
  doc.text(`Job: ${job.title}`, 20, 100);
  doc.text(`Category: ${job.category}`, 20, 108);
  doc.text(`Address: ${job.location?.address || 'N/A'}`, 20, 116);
  doc.text(`Worker: ${job.acceptedBy?.name || 'N/A'}`, 20, 124);
  doc.text(`Worker Phone: ${job.acceptedBy?.phone || 'N/A'}`, 20, 132);
  if (job.scheduledDate) doc.text(`Scheduled: ${new Date(job.scheduledDate).toLocaleDateString('en-IN')}`, 20, 140);

  doc.setFillColor(237, 233, 254);
  doc.rect(15, 155, 180, 32, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(14);
  doc.setTextColor(79, 70, 229);
  doc.text(`Total Amount: Rs. ${job.budget?.max || 0}`, 25, 168);
  doc.setFontSize(10);
  doc.text(`Commission (10%): Rs. ${Math.round((job.budget?.max || 0) * 0.10)}`, 25, 180);

  if (job.isRated) {
    doc.setTextColor(0,0,0); doc.setFont('helvetica','normal'); doc.setFontSize(10);
    doc.text(`Your Rating: ${'★'.repeat(job.rating || 0)} (${job.rating}/5)`, 20, 200);
    if (job.review) doc.text(`Review: ${job.review}`, 20, 208);
  }

  doc.setFillColor(99, 102, 241);
  doc.rect(0, 268, 210, 30, 'F');
  doc.setTextColor(255, 255, 255); doc.setFontSize(9);
  doc.text('SewaPro — Connecting skilled workers across Gujarat', 105, 280, { align:'center' });
  doc.text('sewapro.com  |  support@sewapro.com', 105, 290, { align:'center' });

  doc.save(`SewaPro-Invoice-${job._id?.slice(-6) || 'job'}.pdf`);
};
