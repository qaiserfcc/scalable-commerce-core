const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
require('dotenv').config({ path: '../../.env' });

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// Rate limiting - configurable via environment variables
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes default
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 requests default
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Service URLs
const SERVICES = {
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  product: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002',
  cart: process.env.CART_SERVICE_URL || 'http://localhost:3003',
  order: process.env.ORDER_SERVICE_URL || 'http://localhost:3004',
  payment: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3005',
  discount: process.env.DISCOUNT_SERVICE_URL || 'http://localhost:3006',
  admin: process.env.ADMIN_SERVICE_URL || 'http://localhost:3007',
  notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3008'
};

// Proxy helper function
const proxyRequest = async (req, res, serviceUrl) => {
  try {
    const response = await axios({
      method: req.method,
      url: `${serviceUrl}${req.path}`,
      data: req.body,
      headers: {
        ...req.headers,
        host: new URL(serviceUrl).host
      },
      params: req.query
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: 'Service unavailable', message: error.message });
    }
  }
};

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'API Gateway is running' });
});

// Route to services
app.use('/api/auth', (req, res) => proxyRequest(req, res, SERVICES.auth));
app.use('/api/products', (req, res) => proxyRequest(req, res, SERVICES.product));
app.use('/api/cart', (req, res) => proxyRequest(req, res, SERVICES.cart));
app.use('/api/orders', (req, res) => proxyRequest(req, res, SERVICES.order));
app.use('/api/payments', (req, res) => proxyRequest(req, res, SERVICES.payment));
app.use('/api/discounts', (req, res) => proxyRequest(req, res, SERVICES.discount));
app.use('/api/admin', (req, res) => proxyRequest(req, res, SERVICES.admin));
app.use('/api/notifications', (req, res) => proxyRequest(req, res, SERVICES.notification));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.GATEWAY_PORT || 3000;
app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});
