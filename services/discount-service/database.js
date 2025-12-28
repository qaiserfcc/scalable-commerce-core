const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../../.env' });

const pool = mysql.createPool({
  host: process.env.DISCOUNT_DB_HOST || 'localhost',
  user: process.env.DISCOUNT_DB_USER || 'root',
  password: process.env.DISCOUNT_DB_PASSWORD || '',
  database: process.env.DISCOUNT_DB_NAME || 'discount_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const initDB = async () => {
  try {
    const connection = await pool.getConnection();
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS discounts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        type ENUM('percentage', 'fixed') NOT NULL,
        value DECIMAL(10, 2) NOT NULL,
        min_purchase_amount DECIMAL(10, 2),
        max_discount_amount DECIMAL(10, 2),
        usage_limit INT,
        used_count INT DEFAULT 0,
        valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        valid_until TIMESTAMP NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_code (code),
        INDEX idx_active (is_active)
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS discount_usage (
        id INT AUTO_INCREMENT PRIMARY KEY,
        discount_id INT NOT NULL,
        user_id INT NOT NULL,
        order_id INT,
        discount_amount DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (discount_id) REFERENCES discounts(id) ON DELETE CASCADE,
        INDEX idx_discount_id (discount_id),
        INDEX idx_user_id (user_id)
      )
    `);

    connection.release();
    console.log('Discount database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

initDB();

module.exports = pool;
