const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../../.env' });

const pool = mysql.createPool({
  host: process.env.ADMIN_DB_HOST || 'localhost',
  user: process.env.ADMIN_DB_USER || 'root',
  password: process.env.ADMIN_DB_PASSWORD || '',
  database: process.env.ADMIN_DB_NAME || 'admin_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const initDB = async () => {
  try {
    const connection = await pool.getConnection();
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS analytics (
        id INT AUTO_INCREMENT PRIMARY KEY,
        metric_name VARCHAR(100) NOT NULL,
        metric_value DECIMAL(15, 2) NOT NULL,
        metric_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_metric_name (metric_name),
        INDEX idx_metric_date (metric_date)
      )
    `);

    connection.release();
    console.log('Admin database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

initDB();

module.exports = pool;
