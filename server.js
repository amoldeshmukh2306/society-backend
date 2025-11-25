// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const membersRoute = require('./routes/members');
const paymentsRoute = require('./routes/payments');

const app = express();
app.use(cors());
app.use(express.json());

// serve receipts folder as static files (for preview)
app.use('/receipts', express.static(path.join(__dirname, 'receipts')));

// API routes
app.use('/api/members', membersRoute);
app.use('/api/payments', paymentsRoute);

// simple health
app.get('/api/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
