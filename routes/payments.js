// routes/payments.js
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const generateReceiptPDF = require('../utils/pdfGenerator');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');

// simple transporter using .env
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: String(process.env.SMTP_SECURE) === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Mark payment as paid and send receipt (body: { member_id, month_year, amount })
router.post('/pay', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { member_id, month_year, amount } = req.body;
    if (!member_id || !month_year || !amount) return res.status(400).json({ error: 'member_id, month_year and amount required' });

    await conn.beginTransaction();

    // ensure member exists
    const [memRows] = await conn.query(`SELECT m.*, w.wing_name FROM members m JOIN wings w ON m.wing_id = w.id WHERE m.id = ?`, [member_id]);
    if (!memRows.length) {
      await conn.rollback();
      conn.release();
      return res.status(404).json({ error: 'Member not found' });
    }
    const member = memRows[0];

    // upsert payment (insert or update)
    const paymentDate = new Date();
    await conn.query(
      `INSERT INTO payments (member_id, month_year, amount, status, payment_date)
       VALUES (?, ?, ?, 'Paid', ?)
       ON DUPLICATE KEY UPDATE amount = VALUES(amount), status='Paid', payment_date=VALUES(payment_date)`,
      [member_id, month_year, amount, paymentDate]
    );

    // fetch payment row
    const [payRows] = await conn.query(`SELECT * FROM payments WHERE member_id = ? AND month_year = ?`, [member_id, month_year]);
    const payment = payRows[0];

    // generate PDF buffer
    const pdfBuffer = await generateReceiptPDF(member, { ...payment, payment_date: paymentDate, amount });

    // ensure receipts folder exists
    const receiptsDir = path.join(__dirname, '..', 'receipts');
    if (!fs.existsSync(receiptsDir)) fs.mkdirSync(receiptsDir);

    const filename = `receipt_${member.wing_name}_${member.flat_no}_${month_year}.pdf`;
    const filePath = path.join(receiptsDir, filename);
    fs.writeFileSync(filePath, pdfBuffer);

    // update payments.receipt_filename
    await conn.query(`UPDATE payments SET receipt_filename = ? WHERE id = ?`, [filename, payment.id]);

    // send email with attachment
    await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: member.email,
      subject: `Payment Receipt – Flat ${member.wing_name}-${member.flat_no} (${month_year})`,
      text: `Dear ${member.owner_name},

We have received your maintenance payment for ${month_year}.

Please find attached the receipt.

Thank you,
Society Management`,
      attachments: [
        {
          filename,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    });

    await conn.commit();
    conn.release();

    res.json({ success: true, message: 'Payment recorded and receipt emailed', filename });
  } catch (err) {
    await conn.rollback();
    conn.release();
    console.error('Error in /pay:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
