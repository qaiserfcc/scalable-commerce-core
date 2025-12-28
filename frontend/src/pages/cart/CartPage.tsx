import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cartAPI } from '../../services/api';
import { Cart } from '../../types';
import './Cart.css';

const CartPage: React.FC = () => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const response = await cartAPI.getCart();
      setCart(response.data);
    } catch (error) {
      console.error('Failed to load cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: number, quantity: number) => {
    try {
      await cartAPI.updateCartItem(itemId, { quantity });
      loadCart();
    } catch (error) {
      console.error('Failed to update quantity:', error);
    }
  };

  const removeItem = async (itemId: number) => {
    try {
      await cartAPI.removeFromCart(itemId);
      loadCart();
    } catch (error) {
      console.error('Failed to remove item:', error);
    }
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  if (loading) {
    return <div className="loading">Loading cart...</div>;
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="empty-cart">
        <h2>Your cart is empty</h2>
        <button onClick={() => navigate('/products')} className="btn-primary">
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <h1>Shopping Cart</h1>

      <div className="cart-content">
        <div className="cart-items">
          {cart.items.map((item) => (
            <div key={item.id} className="cart-item">
              <div className="item-image">
                {item.product?.image_url ? (
                  <img src={item.product.image_url} alt={item.product.name} />
                ) : (
                  <div className="no-image">No Image</div>
                )}
              </div>

              <div className="item-details">
                <h3>{item.product?.name}</h3>
                <p className="item-price">${item.price}</p>
              </div>

              <div className="item-quantity">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                >
                  -
                </button>
                <span>{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  disabled={item.quantity >= (item.product?.stock_quantity || 0)}
                >
                  +
                </button>
              </div>

              <div className="item-total">
                <p>${(item.price * item.quantity).toFixed(2)}</p>
              </div>

              <button
                className="btn-remove"
                onClick={() => removeItem(item.id)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="cart-summary">
          <h2>Order Summary</h2>
          
          <div className="summary-row">
            <span>Subtotal ({cart.item_count} items)</span>
            <span>${cart.subtotal}</span>
          </div>

          <div className="summary-row">
            <span>Shipping</span>
            <span>{parseFloat(cart.subtotal) > 100 ? 'FREE' : '$10.00'}</span>
          </div>

          <div className="summary-row total">
            <span>Total</span>
            <span>
              ${(parseFloat(cart.subtotal) + (parseFloat(cart.subtotal) > 100 ? 0 : 10)).toFixed(2)}
            </span>
          </div>

          <button className="btn-checkout" onClick={handleCheckout}>
            Proceed to Checkout
          </button>

          <button
            className="btn-continue"
            onClick={() => navigate('/products')}
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
