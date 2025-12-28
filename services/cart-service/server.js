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

// Get or create cart for user
const getOrCreateCart = async (userId) => {
  const [carts] = await db.query('SELECT id FROM carts WHERE user_id = ?', [userId]);
  
  if (carts.length > 0) {
    return carts[0].id;
  }

  const [result] = await db.query('INSERT INTO carts (user_id) VALUES (?)', [userId]);
  return result.insertId;
};

// Get cart with items
app.get('/cart', authenticateToken, async (req, res) => {
  try {
    const cartId = await getOrCreateCart(req.user.id);

    const [items] = await db.query(
      'SELECT ci.*, ci.price as unit_price FROM cart_items ci WHERE ci.cart_id = ?',
      [cartId]
    );

    // Fetch product details from product service
    const itemsWithDetails = await Promise.all(
      items.map(async (item) => {
        try {
          const response = await axios.get(
            `${process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002'}/products/${item.product_id}`
          );
          
          return {
            ...item,
            product: response.data.product
          };
        } catch (error) {
          return {
            ...item,
            product: null
          };
        }
      })
    );

    const subtotal = itemsWithDetails.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    res.json({
      cart_id: cartId,
      items: itemsWithDetails,
      subtotal: subtotal.toFixed(2),
      item_count: items.length
    });
  } catch (error) {
    console.error('Cart fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
});

// Add item to cart
app.post('/cart/items', authenticateToken, async (req, res) => {
  try {
    const { product_id, quantity = 1 } = req.body;

    // Validate product exists and get price
    const productResponse = await axios.get(
      `${process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002'}/products/${product_id}`
    );

    if (!productResponse.data.product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = productResponse.data.product;

    if (product.stock_quantity < quantity) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    const cartId = await getOrCreateCart(req.user.id);

    // Check if item already exists in cart
    const [existingItems] = await db.query(
      'SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ?',
      [cartId, product_id]
    );

    if (existingItems.length > 0) {
      // Update quantity
      const newQuantity = existingItems[0].quantity + quantity;
      
      await db.query(
        'UPDATE cart_items SET quantity = ?, price = ? WHERE id = ?',
        [newQuantity, product.price, existingItems[0].id]
      );
    } else {
      // Insert new item
      await db.query(
        'INSERT INTO cart_items (cart_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
        [cartId, product_id, quantity, product.price]
      );
    }

    res.status(201).json({ message: 'Item added to cart' });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ error: 'Failed to add item to cart' });
  }
});

// Update cart item quantity
app.put('/cart/items/:itemId', authenticateToken, async (req, res) => {
  try {
    const { quantity } = req.body;
    const { itemId } = req.params;

    if (quantity < 1) {
      return res.status(400).json({ error: 'Quantity must be at least 1' });
    }

    const cartId = await getOrCreateCart(req.user.id);

    // Verify item belongs to user's cart
    const [items] = await db.query(
      'SELECT product_id FROM cart_items WHERE id = ? AND cart_id = ?',
      [itemId, cartId]
    );

    if (items.length === 0) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    // Check stock availability with error handling
    try {
      const productResponse = await axios.get(
        `${process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002'}/products/${items[0].product_id}`
      );

      if (productResponse.data.product.stock_quantity < quantity) {
        return res.status(400).json({ error: 'Insufficient stock' });
      }
    } catch (productError) {
      console.error('Product service error:', productError);
      return res.status(503).json({ error: 'Unable to verify product availability' });
    }

    await db.query(
      'UPDATE cart_items SET quantity = ? WHERE id = ?',
      [quantity, itemId]
    );

    res.json({ message: 'Cart updated successfully' });
  } catch (error) {
    console.error('Cart update error:', error);
    res.status(500).json({ error: 'Failed to update cart' });
  }
});

// Remove item from cart
app.delete('/cart/items/:itemId', authenticateToken, async (req, res) => {
  try {
    const { itemId } = req.params;
    const cartId = await getOrCreateCart(req.user.id);

    await db.query(
      'DELETE FROM cart_items WHERE id = ? AND cart_id = ?',
      [itemId, cartId]
    );

    res.json({ message: 'Item removed from cart' });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ error: 'Failed to remove item from cart' });
  }
});

// Clear cart
app.delete('/cart', authenticateToken, async (req, res) => {
  try {
    const cartId = await getOrCreateCart(req.user.id);

    await db.query('DELETE FROM cart_items WHERE cart_id = ?', [cartId]);

    res.json({ message: 'Cart cleared successfully' });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'cart-service' });
});

const PORT = process.env.CART_SERVICE_PORT || 3003;
app.listen(PORT, () => {
  console.log(`Cart Service running on port ${PORT}`);
});
