// routes/members.js
const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Add member
router.post('/', async (req, res) => {
  try {
    const { wing_id, flat_no, owner_name, email, phone, maintenance_amount } = req.body;
    const [result] = await pool.query(
      `INSERT INTO members (wing_id, flat_no, owner_name, email, phone, maintenance_amount)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [wing_id, flat_no, owner_name, email, phone || null, maintenance_amount || 0]
    );
    res.json({ success: true, id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// List members (optional ?wing= A/B/C)
router.get('/', async (req, res) => {
  try {
    const wing = req.query.wing;
    let q = `SELECT m.*, w.wing_name FROM members m JOIN wings w ON m.wing_id = w.id`;
    const params = [];
    if (wing) {
      q += ` WHERE w.wing_name = ?`;
      params.push(wing);
    }
    q += ` ORDER BY w.wing_name, m.flat_no`;
    const [rows] = await pool.query(q, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get member payments by member id (ensures months exist)
router.get('/:id/payments', async (req, res) => {
  try {
    const memberId = parseInt(req.params.id, 10);

    // Build last 12 months list (YYYY-MM)
    const now = new Date();
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}`);
    }

    // Ensure payment rows exist for each month (insert ignore) - include remaining_amount default 0
    for (const m of months) {
      await pool.query(
        `INSERT IGNORE INTO payments (member_id, month_year, amount, status, remaining_amount) VALUES (?, ?, 0, 'Pending', 0)`,
        [memberId, m]
      );
    }

    // fetch payments
    const [rows] = await pool.query(`SELECT * FROM payments WHERE member_id = ? ORDER BY month_year`, [memberId]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
