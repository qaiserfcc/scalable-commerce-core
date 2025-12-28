const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config({ path: '../../.env' });

const app = express();
app.use(cors());
app.use(express.json());

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Send welcome email
app.post('/notifications/welcome', async (req, res) => {
  try {
    const { email, full_name } = req.body;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Welcome to Our E-commerce Platform!',
      html: `
        <h1>Welcome ${full_name}!</h1>
        <p>Thank you for registering with us.</p>
        <p>Start shopping now and enjoy exclusive deals!</p>
      `
    };

    // Only send if email credentials are configured
    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      await transporter.sendMail(mailOptions);
    }

    res.json({ message: 'Welcome email sent successfully' });
  } catch (error) {
    console.error('Email sending error:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// Send order confirmation email
app.post('/notifications/order-created', async (req, res) => {
  try {
    const { user_id, order_number, total_amount } = req.body;

    // In production, fetch user email from auth service
    console.log(`Order confirmation notification for order ${order_number}`);

    res.json({ message: 'Order confirmation sent successfully' });
  } catch (error) {
    console.error('Notification error:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// Send order status update
app.post('/notifications/order-status', async (req, res) => {
  try {
    const { order_number, status, email } = req.body;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Order ${order_number} - Status Update`,
      html: `
        <h2>Order Status Update</h2>
        <p>Your order ${order_number} status has been updated to: <strong>${status}</strong></p>
        <p>Track your order on our website for more details.</p>
      `
    };

    // Only send if email credentials are configured
    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD && email) {
      await transporter.sendMail(mailOptions);
    }

    res.json({ message: 'Status update notification sent successfully' });
  } catch (error) {
    console.error('Notification error:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// Send promotional email
app.post('/notifications/promotional', async (req, res) => {
  try {
    const { email, subject, content } = req.body;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: subject,
      html: content
    };

    // Only send if email credentials are configured
    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD && email) {
      await transporter.sendMail(mailOptions);
    }

    res.json({ message: 'Promotional email sent successfully' });
  } catch (error) {
    console.error('Email sending error:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'notification-service' });
});

const PORT = process.env.NOTIFICATION_SERVICE_PORT || 3008;
app.listen(PORT, () => {
  console.log(`Notification Service running on port ${PORT}`);
});
