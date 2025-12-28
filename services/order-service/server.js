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

// Generate unique order number with timestamp-based uniqueness
const generateOrderNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substr(2, 9).toUpperCase();
  const uniqueId = `${timestamp}${random}`;
  return `ORD-${uniqueId}`;
};

// Create order from cart
app.post('/orders', authenticateToken, async (req, res) => {
  try {
    const { shipping_address, billing_address, payment_method, discount_code } = req.body;

    // Get cart items
    const cartResponse = await axios.get(
      `${process.env.CART_SERVICE_URL || 'http://localhost:3003'}/cart`,
      { headers: { authorization: req.headers.authorization } }
    );

    const cart = cartResponse.data;

    if (!cart.items || cart.items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    let subtotal = parseFloat(cart.subtotal);
    let discountAmount = 0;

    // Apply discount if code provided
    if (discount_code) {
      try {
        const discountResponse = await axios.post(
          `${process.env.DISCOUNT_SERVICE_URL || 'http://localhost:3006'}/discounts/validate`,
          { code: discount_code, subtotal },
          { headers: { authorization: req.headers.authorization } }
        );

        if (discountResponse.data.valid) {
          discountAmount = discountResponse.data.discount_amount;
        }
      } catch (error) {
        console.error('Discount validation error:', error);
      }
    }

    // Calculate totals - configurable via environment
    const taxRate = parseFloat(process.env.TAX_RATE) || 0.1; // 10% default
    const freeShippingThreshold = parseFloat(process.env.FREE_SHIPPING_THRESHOLD) || 100;
    const standardShipping = parseFloat(process.env.STANDARD_SHIPPING_COST) || 10;
    
    const taxAmount = (subtotal - discountAmount) * taxRate;
    const shippingAmount = subtotal > freeShippingThreshold ? 0 : standardShipping;
    const totalAmount = subtotal - discountAmount + taxAmount + shippingAmount;

    // Create order
    const orderNumber = generateOrderNumber();
    const [orderResult] = await db.query(
      `INSERT INTO orders (user_id, order_number, status, subtotal, discount_amount, tax_amount, 
       shipping_amount, total_amount, shipping_address, billing_address, payment_method) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        orderNumber,
        'pending',
        subtotal,
        discountAmount,
        taxAmount,
        shippingAmount,
        totalAmount,
        JSON.stringify(shipping_address),
        billing_address ? JSON.stringify(billing_address) : JSON.stringify(shipping_address),
        payment_method || 'COD'
      ]
    );

    const orderId = orderResult.insertId;

    // Insert order items
    for (const item of cart.items) {
      if (item.product) {
        await db.query(
          `INSERT INTO order_items (order_id, product_id, product_name, product_sku, quantity, 
           unit_price, total_price) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            orderId,
            item.product_id,
            item.product.name,
            item.product.sku,
            item.quantity,
            item.price,
            item.price * item.quantity
          ]
        );
      }
    }

    // Add initial tracking entry
    await db.query(
      'INSERT INTO order_tracking (order_id, status, message) VALUES (?, ?, ?)',
      [orderId, 'pending', 'Order placed successfully']
    );

    // Clear cart
    await axios.delete(
      `${process.env.CART_SERVICE_URL || 'http://localhost:3003'}/cart`,
      { headers: { authorization: req.headers.authorization } }
    );

    // Send notification
    try {
      await axios.post(
        `${process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3008'}/notifications/order-created`,
        {
          user_id: req.user.id,
          order_number: orderNumber,
          total_amount: totalAmount
        }
      );
    } catch (error) {
      console.error('Notification error:', error);
    }

    res.status(201).json({
      message: 'Order created successfully',
      order_id: orderId,
      order_number: orderNumber,
      total_amount: totalAmount.toFixed(2)
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Get user orders
app.get('/orders', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM orders WHERE user_id = ?';
    const params = [req.user.id];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [orders] = await db.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM orders WHERE user_id = ?';
    const countParams = [req.user.id];

    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }

    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Orders fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get single order with items and tracking
app.get('/orders/:id', authenticateToken, async (req, res) => {
  try {
    const [orders] = await db.query(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orders[0];

    // Get order items
    const [items] = await db.query(
      'SELECT * FROM order_items WHERE order_id = ?',
      [req.params.id]
    );

    // Get tracking history
    const [tracking] = await db.query(
      'SELECT * FROM order_tracking WHERE order_id = ? ORDER BY created_at ASC',
      [req.params.id]
    );

    res.json({
      order,
      items,
      tracking
    });
  } catch (error) {
    console.error('Order fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Track order by order number (public endpoint)
app.get('/track/:orderNumber', async (req, res) => {
  try {
    const [orders] = await db.query(
      'SELECT id, order_number, status, total_amount, created_at FROM orders WHERE order_number = ?',
      [req.params.orderNumber]
    );

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orders[0];

    // Get tracking history
    const [tracking] = await db.query(
      'SELECT status, message, created_at FROM order_tracking WHERE order_id = ? ORDER BY created_at ASC',
      [order.id]
    );

    res.json({
      order_number: order.order_number,
      status: order.status,
      total_amount: order.total_amount,
      created_at: order.created_at,
      tracking
    });
  } catch (error) {
    console.error('Order tracking error:', error);
    res.status(500).json({ error: 'Failed to track order' });
  }
});

// Update order status (admin endpoint - should be in admin service, but included here for completeness)
app.patch('/orders/:id/status', authenticateToken, async (req, res) => {
  try {
    // Verify admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { status, message } = req.body;

    await db.query(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, req.params.id]
    );

    // Add tracking entry
    await db.query(
      'INSERT INTO order_tracking (order_id, status, message) VALUES (?, ?, ?)',
      [req.params.id, status, message || `Order status updated to ${status}`]
    );

    res.json({ message: 'Order status updated successfully' });
  } catch (error) {
    console.error('Order status update error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Cancel order
app.post('/orders/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const [orders] = await db.query(
      'SELECT status FROM orders WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (orders[0].status !== 'pending' && orders[0].status !== 'confirmed') {
      return res.status(400).json({ error: 'Order cannot be cancelled at this stage' });
    }

    await db.query(
      'UPDATE orders SET status = ? WHERE id = ?',
      ['cancelled', req.params.id]
    );

    // Add tracking entry
    await db.query(
      'INSERT INTO order_tracking (order_id, status, message) VALUES (?, ?, ?)',
      [req.params.id, 'cancelled', 'Order cancelled by customer']
    );

    res.json({ message: 'Order cancelled successfully' });
  } catch (error) {
    console.error('Order cancellation error:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'order-service' });
});

const PORT = process.env.ORDER_SERVICE_PORT || 3004;
app.listen(PORT, () => {
  console.log(`Order Service running on port ${PORT}`);
});
