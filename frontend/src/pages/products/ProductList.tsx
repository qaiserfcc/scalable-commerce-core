import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productAPI } from '../../services/api';
import { Product } from '../../types';
import './Products.css';

const ProductList: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, [search, category]);

  const loadProducts = async () => {
    try {
      const params: any = {};
      if (search) params.search = search;
      if (category) params.category = category;
      
      const response = await productAPI.getProducts(params);
      setProducts(response.data.products);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await productAPI.getCategories();
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  return (
    <div className="product-list-container">
      <div className="filters-section">
        <h1>Our Products</h1>
        
        <div className="filters">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="category-select"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading products...</div>
      ) : (
        <div className="products-grid">
          {products.length === 0 ? (
            <p className="no-products">No products found</p>
          ) : (
            products.map((product) => (
              <Link
                key={product.id}
                to={`/products/${product.id}`}
                className="product-card"
              >
                <div className="product-image">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} />
                  ) : (
                    <div className="no-image">No Image</div>
                  )}
                  {product.featured && <span className="badge-featured">Featured</span>}
                </div>
                
                <div className="product-info">
                  <h3>{product.name}</h3>
                  <p className="product-description">
                    {product.description?.substring(0, 100)}
                    {product.description && product.description.length > 100 ? '...' : ''}
                  </p>
                  
                  <div className="product-price">
                    <span className="current-price">${product.price}</span>
                    {product.compare_at_price && product.compare_at_price > product.price && (
                      <span className="original-price">${product.compare_at_price}</span>
                    )}
                  </div>

                  {product.stock_quantity > 0 ? (
                    <span className="stock-status in-stock">In Stock</span>
                  ) : (
                    <span className="stock-status out-of-stock">Out of Stock</span>
                  )}
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ProductList;
