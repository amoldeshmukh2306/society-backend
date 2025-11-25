// utils/pdfGenerator.js
const PDFDocument = require('pdfkit');

function generateReceiptPDF(member, payment) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // Header
      doc.fontSize(18).text('Society Maintenance Receipt', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'right' });
      doc.moveDown(1);

      // Member details
      doc.fontSize(12).text(`Name: ${member.owner_name}`);
      doc.text(`Wing: ${member.wing_name}    Flat: ${member.flat_no}`);
      doc.text(`Email: ${member.email}`);
      doc.text(`Phone: ${member.phone || '-'}`);
      doc.moveDown(0.8);

      // Payment details
      doc.fontSize(12).text(`Month: ${payment.month_year}`);
  doc.text(`Amount Paid: Rs ${payment.amount}`);
  // show remaining amount if provided
  const remaining = payment.remaining_amount === undefined || payment.remaining_amount === null ? 0 : payment.remaining_amount;
  doc.text(`Remaining Amount: Rs ${remaining}`);
  doc.text(`Payment Date: ${new Date(payment.payment_date).toLocaleString()}`);
      doc.moveDown(1);

      doc.fontSize(11).text('Thank you for your payment.', { align: 'left' });
      doc.moveDown(2);
      doc.fontSize(9).text('This is a computer generated receipt and does not require signature.', { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = generateReceiptPDF;
