const express = require('express');
const cors = require('cors');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const db = require('./database');
require('dotenv').config({ path: '../../.env' });

const app = express();
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

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

// Get all products with pagination and filters
app.get('/products', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      category, 
      search, 
      featured, 
      min_price, 
      max_price,
      sort = 'created_at',
      order = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    let query = 'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.is_active = true';
    const params = [];

    if (category) {
      query += ' AND p.category_id = ?';
      params.push(category);
    }

    if (search) {
      query += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (featured) {
      query += ' AND p.featured = true';
    }

    if (min_price) {
      query += ' AND p.price >= ?';
      params.push(min_price);
    }

    if (max_price) {
      query += ' AND p.price <= ?';
      params.push(max_price);
    }

    // Validate sort and order to prevent SQL injection
    const validSorts = ['created_at', 'price', 'name'];
    const validOrders = ['ASC', 'DESC'];
    const sortField = validSorts.includes(sort) ? sort : 'created_at';
    const sortOrder = validOrders.includes(order.toUpperCase()) ? order.toUpperCase() : 'DESC';

    query += ` ORDER BY p.${sortField} ${sortOrder} LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [products] = await db.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM products WHERE is_active = true';
    const countParams = [];

    if (category) {
      countQuery += ' AND category_id = ?';
      countParams.push(category);
    }

    if (search) {
      countQuery += ' AND (name LIKE ? OR description LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }

    if (featured) {
      countQuery += ' AND featured = true';
    }

    if (min_price) {
      countQuery += ' AND price >= ?';
      countParams.push(min_price);
    }

    if (max_price) {
      countQuery += ' AND price <= ?';
      countParams.push(max_price);
    }

    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Product fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get single product
app.get('/products/:id', async (req, res) => {
  try {
    const [products] = await db.query(
      'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?',
      [req.params.id]
    );

    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Get product attributes
    const [attributes] = await db.query(
      'SELECT attribute_name, attribute_value FROM product_attributes WHERE product_id = ?',
      [req.params.id]
    );

    const product = products[0];
    product.attributes = attributes;

    res.json({ product });
  } catch (error) {
    console.error('Product fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Create product (admin only)
app.post('/products', verifyAdmin, async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      compare_at_price,
      sku,
      category_id,
      stock_quantity,
      image_url,
      images,
      featured,
      weight,
      dimensions,
      attributes
    } = req.body;

    const [result] = await db.query(
      `INSERT INTO products (name, description, price, compare_at_price, sku, category_id, stock_quantity, 
       image_url, images, featured, weight, dimensions) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        description,
        price,
        compare_at_price || null,
        sku,
        category_id || null,
        stock_quantity || 0,
        image_url || null,
        images ? JSON.stringify(images) : null,
        featured || false,
        weight || null,
        dimensions || null
      ]
    );

    const productId = result.insertId;

    // Insert attributes
    if (attributes && Array.isArray(attributes)) {
      for (const attr of attributes) {
        await db.query(
          'INSERT INTO product_attributes (product_id, attribute_name, attribute_value) VALUES (?, ?, ?)',
          [productId, attr.name, attr.value]
        );
      }
    }

    res.status(201).json({ message: 'Product created successfully', product_id: productId });
  } catch (error) {
    console.error('Product creation error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update product (admin only)
app.put('/products/:id', verifyAdmin, async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      compare_at_price,
      sku,
      category_id,
      stock_quantity,
      image_url,
      images,
      is_active,
      featured,
      weight,
      dimensions
    } = req.body;

    await db.query(
      `UPDATE products SET name = ?, description = ?, price = ?, compare_at_price = ?, sku = ?, 
       category_id = ?, stock_quantity = ?, image_url = ?, images = ?, is_active = ?, featured = ?, 
       weight = ?, dimensions = ? WHERE id = ?`,
      [
        name,
        description,
        price,
        compare_at_price || null,
        sku,
        category_id || null,
        stock_quantity,
        image_url || null,
        images ? JSON.stringify(images) : null,
        is_active !== undefined ? is_active : true,
        featured || false,
        weight || null,
        dimensions || null,
        req.params.id
      ]
    );

    res.json({ message: 'Product updated successfully' });
  } catch (error) {
    console.error('Product update error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Bulk upload products from CSV (admin only)
app.post('/products/bulk-upload', verifyAdmin, upload.single('file'), async (req, res) => {
  let filePath = null;
  
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    filePath = req.file.path;
    const errors = [];
    let successCount = 0;
    let errorCount = 0;

    // Use promise-based approach for better control
    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', async (row) => {
          try {
            await db.query(
              `INSERT INTO products (name, description, price, compare_at_price, sku, category_id, 
               stock_quantity, image_url, featured) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                row.name,
                row.description || '',
                parseFloat(row.price),
                row.compare_at_price ? parseFloat(row.compare_at_price) : null,
                row.sku,
                row.category_id || null,
                parseInt(row.stock_quantity) || 0,
                row.image_url || null,
                row.featured === 'true' || row.featured === '1'
              ]
            );
            successCount++;
          } catch (error) {
            errorCount++;
            errors.push({ sku: row.sku, error: error.message });
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });

    res.json({
      message: 'Bulk upload completed',
      success: successCount,
      errors: errorCount,
      errorDetails: errors
    });

  } catch (error) {
    console.error('Bulk upload error:', error);
    res.status(500).json({ error: 'Failed to process bulk upload' });
  } finally {
    // Clean up uploaded file in all cases
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (cleanupError) {
        console.error('Failed to cleanup uploaded file:', cleanupError);
      }
    }
  }
});

// Get all categories
app.get('/categories', async (req, res) => {
  try {
    const [categories] = await db.query('SELECT * FROM categories ORDER BY name');
    res.json({ categories });
  } catch (error) {
    console.error('Categories fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Create category (admin only)
app.post('/categories', verifyAdmin, async (req, res) => {
  try {
    const { name, description, parent_id, slug } = req.body;

    const [result] = await db.query(
      'INSERT INTO categories (name, description, parent_id, slug) VALUES (?, ?, ?, ?)',
      [name, description || null, parent_id || null, slug]
    );

    res.status(201).json({ message: 'Category created successfully', category_id: result.insertId });
  } catch (error) {
    console.error('Category creation error:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Update stock quantity
app.patch('/products/:id/stock', verifyAdmin, async (req, res) => {
  try {
    const { stock_quantity } = req.body;

    await db.query(
      'UPDATE products SET stock_quantity = ? WHERE id = ?',
      [stock_quantity, req.params.id]
    );

    res.json({ message: 'Stock updated successfully' });
  } catch (error) {
    console.error('Stock update error:', error);
    res.status(500).json({ error: 'Failed to update stock' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'product-service' });
});

const PORT = process.env.PRODUCT_SERVICE_PORT || 3002;
app.listen(PORT, () => {
  console.log(`Product Service running on port ${PORT}`);
});
