const express = require('express');
const cors = require('cors');
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

// Validate discount code
app.post('/discounts/validate', authenticateToken, async (req, res) => {
  try {
    const { code, subtotal } = req.body;

    const [discounts] = await db.query(
      `SELECT * FROM discounts WHERE code = ? AND is_active = true 
       AND (valid_until IS NULL OR valid_until > NOW())`,
      [code]
    );

    if (discounts.length === 0) {
      return res.json({ valid: false, error: 'Invalid or expired discount code' });
    }

    const discount = discounts[0];

    // Check usage limit
    if (discount.usage_limit && discount.used_count >= discount.usage_limit) {
      return res.json({ valid: false, error: 'Discount code has reached usage limit' });
    }

    // Check minimum purchase amount
    if (discount.min_purchase_amount && subtotal < discount.min_purchase_amount) {
      return res.json({
        valid: false,
        error: `Minimum purchase amount of $${discount.min_purchase_amount} required`
      });
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (discount.type === 'percentage') {
      discountAmount = (subtotal * discount.value) / 100;
    } else {
      discountAmount = discount.value;
    }

    // Apply max discount limit if set
    if (discount.max_discount_amount && discountAmount > discount.max_discount_amount) {
      discountAmount = discount.max_discount_amount;
    }

    res.json({
      valid: true,
      discount_id: discount.id,
      discount_amount: discountAmount.toFixed(2),
      description: discount.description
    });
  } catch (error) {
    console.error('Discount validation error:', error);
    res.status(500).json({ error: 'Failed to validate discount' });
  }
});

// Apply discount (called after order creation)
app.post('/discounts/apply', authenticateToken, async (req, res) => {
  try {
    const { discount_id, order_id, discount_amount } = req.body;

    // Record discount usage
    await db.query(
      'INSERT INTO discount_usage (discount_id, user_id, order_id, discount_amount) VALUES (?, ?, ?, ?)',
      [discount_id, req.user.id, order_id, discount_amount]
    );

    // Increment used count
    await db.query(
      'UPDATE discounts SET used_count = used_count + 1 WHERE id = ?',
      [discount_id]
    );

    res.json({ message: 'Discount applied successfully' });
  } catch (error) {
    console.error('Discount application error:', error);
    res.status(500).json({ error: 'Failed to apply discount' });
  }
});

// Get all active discounts (public)
app.get('/discounts', async (req, res) => {
  try {
    const [discounts] = await db.query(
      `SELECT code, description, type, value, min_purchase_amount, valid_until 
       FROM discounts WHERE is_active = true AND (valid_until IS NULL OR valid_until > NOW()) 
       ORDER BY created_at DESC`
    );

    res.json({ discounts });
  } catch (error) {
    console.error('Discounts fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch discounts' });
  }
});

// Create discount (admin only)
app.post('/discounts', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const {
      code,
      description,
      type,
      value,
      min_purchase_amount,
      max_discount_amount,
      usage_limit,
      valid_from,
      valid_until
    } = req.body;

    const [result] = await db.query(
      `INSERT INTO discounts (code, description, type, value, min_purchase_amount, max_discount_amount, 
       usage_limit, valid_from, valid_until) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        code,
        description,
        type,
        value,
        min_purchase_amount || null,
        max_discount_amount || null,
        usage_limit || null,
        valid_from || null,
        valid_until || null
      ]
    );

    res.status(201).json({ message: 'Discount created successfully', discount_id: result.insertId });
  } catch (error) {
    console.error('Discount creation error:', error);
    res.status(500).json({ error: 'Failed to create discount' });
  }
});

// Update discount (admin only)
app.put('/discounts/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const {
      description,
      type,
      value,
      min_purchase_amount,
      max_discount_amount,
      usage_limit,
      valid_until,
      is_active
    } = req.body;

    await db.query(
      `UPDATE discounts SET description = ?, type = ?, value = ?, min_purchase_amount = ?, 
       max_discount_amount = ?, usage_limit = ?, valid_until = ?, is_active = ? WHERE id = ?`,
      [
        description,
        type,
        value,
        min_purchase_amount || null,
        max_discount_amount || null,
        usage_limit || null,
        valid_until || null,
        is_active !== undefined ? is_active : true,
        req.params.id
      ]
    );

    res.json({ message: 'Discount updated successfully' });
  } catch (error) {
    console.error('Discount update error:', error);
    res.status(500).json({ error: 'Failed to update discount' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'discount-service' });
});

const PORT = process.env.DISCOUNT_SERVICE_PORT || 3006;
app.listen(PORT, () => {
  console.log(`Discount Service running on port ${PORT}`);
});
