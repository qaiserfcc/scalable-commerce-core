const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const axios = require('axios');
const db = require('./database');
require('dotenv').config({ path: '../../.env' });

const app = express();
app.use(cors());
app.use(express.json());

// Middleware to verify token
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const response = await axios.post(
      process.env.AUTH_SERVICE_URL || 'http://localhost:3001/verify',
      { token }
    );

    if (response.data.valid) {
      req.user = response.data.user;
      next();
    } else {
      res.status(403).json({ error: 'Invalid token' });
    }
  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
  }
};

// Process payment (simplified - in production would integrate with real payment gateway)
app.post('/payments', authenticateToken, async (req, res) => {
  try {
    const { order_id, payment_method, payment_details } = req.body;

    // Generate cryptographically secure transaction ID
    const timestamp = Date.now().toString(36).toUpperCase();
    const randomBytes = crypto.randomBytes(8).toString('hex').toUpperCase();
    const transactionId = `TXN-${timestamp}-${randomBytes}`;
    
    // For COD, mark as pending; for online payments, mark as completed
    const status = payment_method === 'COD' ? 'pending' : 'completed';

    const [result] = await db.query(
      `INSERT INTO payments (order_id, user_id, amount, payment_method, transaction_id, status, payment_details) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        order_id,
        req.user.id,
        req.body.amount,
        payment_method,
        transactionId,
        status,
        payment_details ? JSON.stringify(payment_details) : null
      ]
    );

    res.status(201).json({
      message: 'Payment processed successfully',
      payment_id: result.insertId,
      transaction_id: transactionId,
      status
    });
  } catch (error) {
    console.error('Payment processing error:', error);
    res.status(500).json({ error: 'Payment processing failed' });
  }
});

// Get payment by order ID
app.get('/payments/order/:orderId', authenticateToken, async (req, res) => {
  try {
    const [payments] = await db.query(
      'SELECT * FROM payments WHERE order_id = ? AND user_id = ?',
      [req.params.orderId, req.user.id]
    );

    if (payments.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json({ payment: payments[0] });
  } catch (error) {
    console.error('Payment fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch payment' });
  }
});

// Get user payment history
app.get('/payments', authenticateToken, async (req, res) => {
  try {
    const [payments] = await db.query(
      'SELECT * FROM payments WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );

    res.json({ payments });
  } catch (error) {
    console.error('Payment history fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
});

// Refund payment (admin only)
app.post('/payments/:id/refund', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    await db.query(
      'UPDATE payments SET status = ? WHERE id = ?',
      ['refunded', req.params.id]
    );

    res.json({ message: 'Payment refunded successfully' });
  } catch (error) {
    console.error('Refund error:', error);
    res.status(500).json({ error: 'Failed to process refund' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'payment-service' });
});

const PORT = process.env.PAYMENT_SERVICE_PORT || 3005;
app.listen(PORT, () => {
  console.log(`Payment Service running on port ${PORT}`);
});
