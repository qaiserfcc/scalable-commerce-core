const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../../.env' });

const pool = mysql.createPool({
  host: process.env.PAYMENT_DB_HOST || 'localhost',
  user: process.env.PAYMENT_DB_USER || 'root',
  password: process.env.PAYMENT_DB_PASSWORD || '',
  database: process.env.PAYMENT_DB_NAME || 'payment_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const initDB = async () => {
  try {
    const connection = await pool.getConnection();
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        user_id INT NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        transaction_id VARCHAR(255),
        status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
        payment_details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_order_id (order_id),
        INDEX idx_user_id (user_id),
        INDEX idx_transaction_id (transaction_id)
      )
    `);

    connection.release();
    console.log('Payment database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

initDB();

module.exports = pool;
