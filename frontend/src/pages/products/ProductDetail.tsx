import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productAPI, cartAPI } from '../../services/api';
import { Product } from '../../types';
import { isAuthenticated } from '../../utils/auth';
import './Products.css';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      const response = await productAPI.getProduct(Number(id));
      setProduct(response.data.product);
    } catch (error) {
      console.error('Failed to load product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    setAddingToCart(true);
    setMessage('');

    try {
      await cartAPI.addToCart({
        product_id: Number(id),
        quantity,
      });
      setMessage('Added to cart successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      setMessage(error.response?.data?.error || 'Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading product...</div>;
  }

  if (!product) {
    return <div className="error">Product not found</div>;
  }

  return (
    <div className="product-detail-container">
      <div className="product-detail">
        <div className="product-detail-image">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} />
          ) : (
            <div className="no-image-large">No Image Available</div>
          )}
        </div>

        <div className="product-detail-info">
          <h1>{product.name}</h1>
          
          <div className="product-price-section">
            <span className="price-large">${product.price}</span>
            {product.compare_at_price && product.compare_at_price > product.price && (
              <>
                <span className="price-compare">${product.compare_at_price}</span>
                <span className="discount-badge">
                  Save {Math.round((1 - product.price / product.compare_at_price) * 100)}%
                </span>
              </>
            )}
          </div>

          <p className="product-description-full">{product.description}</p>

          <div className="product-meta">
            <p><strong>SKU:</strong> {product.sku}</p>
            {product.category_name && (
              <p><strong>Category:</strong> {product.category_name}</p>
            )}
            <p>
              <strong>Availability:</strong>{' '}
              {product.stock_quantity > 0 ? (
                <span className="text-success">{product.stock_quantity} in stock</span>
              ) : (
                <span className="text-danger">Out of stock</span>
              )}
            </p>
          </div>

          {message && (
            <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}

          <div className="product-actions">
            <div className="quantity-selector">
              <label>Quantity:</label>
              <input
                type="number"
                min="1"
                max={product.stock_quantity}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
            </div>

            <button
              className="btn-add-to-cart"
              onClick={handleAddToCart}
              disabled={product.stock_quantity === 0 || addingToCart}
            >
              {addingToCart ? 'Adding...' : 'Add to Cart'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
