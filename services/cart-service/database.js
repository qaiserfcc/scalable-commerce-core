const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../../.env' });

const pool = mysql.createPool({
  host: process.env.CART_DB_HOST || 'localhost',
  user: process.env.CART_DB_USER || 'root',
  password: process.env.CART_DB_PASSWORD || '',
  database: process.env.CART_DB_NAME || 'cart_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const initDB = async () => {
  try {
    const connection = await pool.getConnection();
    
    // Create cart table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS carts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_cart (user_id),
        INDEX idx_user_id (user_id)
      )
    `);

    // Create cart_items table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        cart_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        price DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
        INDEX idx_cart_id (cart_id),
        INDEX idx_product_id (product_id),
        UNIQUE KEY unique_cart_product (cart_id, product_id)
      )
    `);

    connection.release();
    console.log('Cart database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

initDB();

module.exports = pool;
