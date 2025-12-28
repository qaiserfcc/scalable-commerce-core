const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('./database');
require('dotenv').config({ path: '../../.env' });

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Quick Registration
app.post('/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('full_name').trim().notEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email, password, full_name, phone } = req.body;
      
      // Check if user already exists
      const [existingUsers] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
      if (existingUsers.length > 0) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user
      const [result] = await db.query(
        'INSERT INTO users (email, password, full_name, phone) VALUES (?, ?, ?, ?)',
        [email, hashedPassword, full_name, phone || null]
      );

      // Generate JWT token
      const token = jwt.sign(
        { id: result.insertId, email, role: 'customer' },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        message: 'Registration successful',
        token,
        user: {
          id: result.insertId,
          email,
          full_name,
          role: 'customer'
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  }
);

// Login
app.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email, password } = req.body;

      // Find user
      const [users] = await db.query(
        'SELECT id, email, password, full_name, role, is_active FROM users WHERE email = ?',
        [email]
      );

      if (users.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = users[0];

      if (!user.is_active) {
        return res.status(403).json({ error: 'Account is disabled' });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }
);

// Get current user profile
app.get('/profile', authenticateToken, async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, email, full_name, phone, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: users[0] });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update profile
app.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { full_name, phone } = req.body;

    await db.query(
      'UPDATE users SET full_name = ?, phone = ? WHERE id = ?',
      [full_name, phone, req.user.id]
    );

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get user addresses
app.get('/addresses', authenticateToken, async (req, res) => {
  try {
    const [addresses] = await db.query(
      'SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
      [req.user.id]
    );

    res.json({ addresses });
  } catch (error) {
    console.error('Address fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch addresses' });
  }
});

// Add address
app.post('/addresses', authenticateToken, async (req, res) => {
  try {
    const { address_line1, address_line2, city, state, postal_code, country, is_default } = req.body;

    // If this is set as default, unset other defaults
    if (is_default) {
      await db.query('UPDATE addresses SET is_default = false WHERE user_id = ?', [req.user.id]);
    }

    const [result] = await db.query(
      'INSERT INTO addresses (user_id, address_line1, address_line2, city, state, postal_code, country, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, address_line1, address_line2 || null, city, state || null, postal_code, country, is_default || false]
    );

    res.status(201).json({ message: 'Address added successfully', address_id: result.insertId });
  } catch (error) {
    console.error('Address add error:', error);
    res.status(500).json({ error: 'Failed to add address' });
  }
});

// Verify token endpoint (for other services)
app.post('/verify', async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ valid: true, user: decoded });
  } catch (error) {
    res.status(401).json({ valid: false, error: 'Invalid token' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'auth-service' });
});

const PORT = process.env.AUTH_SERVICE_PORT || 3001;
app.listen(PORT, () => {
  console.log(`Auth Service running on port ${PORT}`);
});
