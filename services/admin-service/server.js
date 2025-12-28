const express = require('express');
const cors = require('cors');
const axios = require('axios');
const db = require('./database');
require('dotenv').config({ path: '../../.env' });

const app = express();
app.use(cors());
app.use(express.json());

// Middleware to verify admin token
const verifyAdmin = async (req, res, next) => {
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

    if (response.data.valid && response.data.user.role === 'admin') {
      req.user = response.data.user;
      next();
    } else {
      res.status(403).json({ error: 'Admin access required' });
    }
  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
  }
};

// Get dashboard statistics
app.get('/dashboard/stats', verifyAdmin, async (req, res) => {
  try {
    // This would aggregate data from various services
    // For now, returning sample structure
    
    const stats = {
      total_users: 0,
      total_products: 0,
      total_orders: 0,
      total_revenue: 0,
      pending_orders: 0,
      low_stock_products: 0
    };

    res.json({ stats });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// Get recent orders (proxied from order service with admin privileges)
app.get('/orders', verifyAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    // In production, this would query the order service database or make API calls
    res.json({
      orders: [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: 0,
        pages: 0
      }
    });
  } catch (error) {
    console.error('Orders fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get all users (proxied from auth service)
app.get('/users', verifyAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    // In production, this would query the auth service database or make API calls
    res.json({
      users: [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: 0,
        pages: 0
      }
    });
  } catch (error) {
    console.error('Users fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Update user status
app.patch('/users/:id/status', verifyAdmin, async (req, res) => {
  try {
    const { is_active } = req.body;

    // In production, this would update the auth service database or make API call
    res.json({ message: 'User status updated successfully' });
  } catch (error) {
    console.error('User update error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Get sales analytics
app.get('/analytics/sales', verifyAdmin, async (req, res) => {
  try {
    const { start_date, end_date, period = 'daily' } = req.query;

    const [analytics] = await db.query(
      `SELECT metric_date, SUM(metric_value) as total_sales 
       FROM analytics WHERE metric_name = 'daily_sales' 
       AND metric_date BETWEEN ? AND ? 
       GROUP BY metric_date ORDER BY metric_date ASC`,
      [start_date || '2024-01-01', end_date || '2024-12-31']
    );

    res.json({ analytics });
  } catch (error) {
    console.error('Analytics fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Record analytics metric
app.post('/analytics', verifyAdmin, async (req, res) => {
  try {
    const { metric_name, metric_value, metric_date } = req.body;

    await db.query(
      'INSERT INTO analytics (metric_name, metric_value, metric_date) VALUES (?, ?, ?)',
      [metric_name, metric_value, metric_date || new Date().toISOString().split('T')[0]]
    );

    res.status(201).json({ message: 'Analytics recorded successfully' });
  } catch (error) {
    console.error('Analytics recording error:', error);
    res.status(500).json({ error: 'Failed to record analytics' });
  }
});

// Generate reports
app.get('/reports/:type', verifyAdmin, async (req, res) => {
  try {
    const { type } = req.params;
    const { start_date, end_date } = req.query;

    // Generate different types of reports
    const report = {
      type,
      period: { start_date, end_date },
      data: []
    };

    res.json({ report });
  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'admin-service' });
});

const PORT = process.env.ADMIN_SERVICE_PORT || 3007;
app.listen(PORT, () => {
  console.log(`Admin Service running on port ${PORT}`);
});
