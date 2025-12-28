const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../../.env' });

const pool = mysql.createPool({
  host: process.env.PRODUCT_DB_HOST || 'localhost',
  user: process.env.PRODUCT_DB_USER || 'root',
  password: process.env.PRODUCT_DB_PASSWORD || '',
  database: process.env.PRODUCT_DB_NAME || 'product_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const initDB = async () => {
  try {
    const connection = await pool.getConnection();
    
    // Create categories table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        parent_id INT,
        slug VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
        INDEX idx_slug (slug)
      )
    `);

    // Create products table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        compare_at_price DECIMAL(10, 2),
        sku VARCHAR(100) UNIQUE NOT NULL,
        category_id INT,
        stock_quantity INT DEFAULT 0,
        image_url VARCHAR(500),
        images TEXT,
        is_active BOOLEAN DEFAULT true,
        featured BOOLEAN DEFAULT false,
        weight DECIMAL(8, 2),
        dimensions VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
        INDEX idx_sku (sku),
        INDEX idx_category (category_id),
        INDEX idx_featured (featured),
        INDEX idx_active (is_active)
      )
    `);

    // Create product_attributes table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS product_attributes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        attribute_name VARCHAR(100) NOT NULL,
        attribute_value VARCHAR(255) NOT NULL,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        INDEX idx_product_id (product_id)
      )
    `);

    connection.release();
    console.log('Product database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

initDB();

module.exports = pool;
