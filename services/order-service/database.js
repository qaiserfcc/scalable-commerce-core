const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../../.env' });

const pool = mysql.createPool({
  host: process.env.ORDER_DB_HOST || 'localhost',
  user: process.env.ORDER_DB_USER || 'root',
  password: process.env.ORDER_DB_PASSWORD || '',
  database: process.env.ORDER_DB_NAME || 'order_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const initDB = async () => {
  try {
    const connection = await pool.getConnection();
    
    // Create orders table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        order_number VARCHAR(50) UNIQUE NOT NULL,
        status ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
        subtotal DECIMAL(10, 2) NOT NULL,
        discount_amount DECIMAL(10, 2) DEFAULT 0,
        tax_amount DECIMAL(10, 2) DEFAULT 0,
        shipping_amount DECIMAL(10, 2) DEFAULT 0,
        total_amount DECIMAL(10, 2) NOT NULL,
        shipping_address TEXT NOT NULL,
        billing_address TEXT,
        payment_method VARCHAR(50),
        payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_order_number (order_number),
        INDEX idx_status (status)
      )
    `);

    // Create order_items table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        product_sku VARCHAR(100),
        quantity INT NOT NULL,
        unit_price DECIMAL(10, 2) NOT NULL,
        total_price DECIMAL(10, 2) NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        INDEX idx_order_id (order_id)
      )
    `);

    // Create order_tracking table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS order_tracking (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        status VARCHAR(50) NOT NULL,
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        INDEX idx_order_id (order_id)
      )
    `);

    connection.release();
    console.log('Order database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

initDB();

module.exports = pool;
