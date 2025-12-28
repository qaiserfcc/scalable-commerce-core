import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cartAPI, orderAPI, authAPI } from '../../services/api';
import { Cart, Address } from '../../types';
import './Checkout.css';

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState<Cart | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [discountCode, setDiscountCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCheckoutData();
  }, []);

  const loadCheckoutData = async () => {
    try {
      const [cartResponse, addressResponse] = await Promise.all([
        cartAPI.getCart(),
        authAPI.getAddresses(),
      ]);

      setCart(cartResponse.data);
      setAddresses(addressResponse.data.addresses);

      // Select default address if available
      const defaultAddr = addressResponse.data.addresses.find(
        (addr: Address) => addr.is_default
      );
      if (defaultAddr) {
        setSelectedAddress(defaultAddr.id!);
      }
    } catch (error) {
      console.error('Failed to load checkout data:', error);
      setError('Failed to load checkout information');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      setError('Please select a shipping address');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      const address = addresses.find((addr) => addr.id === selectedAddress);

      const orderData = {
        shipping_address: address,
        billing_address: address,
        payment_method: paymentMethod,
        discount_code: discountCode || undefined,
      };

      const response = await orderAPI.createOrder(orderData);

      // Redirect to order confirmation
      navigate(`/orders/${response.data.order_id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to place order');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading checkout...</div>;
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

  const subtotal = parseFloat(cart.subtotal);
  const shipping = subtotal > 100 ? 0 : 10;
  const tax = (subtotal + shipping) * 0.1;
  const total = subtotal + shipping + tax;

  return (
    <div className="checkout-container">
      <h1>Checkout</h1>

      {error && <div className="error-message">{error}</div>}

      <div className="checkout-content">
        <div className="checkout-main">
          {/* Shipping Address */}
          <div className="checkout-section">
            <h2>Shipping Address</h2>
            
            {addresses.length === 0 ? (
              <p>No saved addresses. Please add an address in your profile.</p>
            ) : (
              <div className="address-list">
                {addresses.map((address) => (
                  <label key={address.id} className="address-option">
                    <input
                      type="radio"
                      name="address"
                      value={address.id}
                      checked={selectedAddress === address.id}
                      onChange={() => setSelectedAddress(address.id!)}
                    />
                    <div className="address-details">
                      <p>{address.address_line1}</p>
                      {address.address_line2 && <p>{address.address_line2}</p>}
                      <p>
                        {address.city}, {address.state} {address.postal_code}
                      </p>
                      <p>{address.country}</p>
                      {address.is_default && (
                        <span className="badge-default">Default</span>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Payment Method */}
          <div className="checkout-section">
            <h2>Payment Method</h2>
            
            <div className="payment-methods">
              <label className="payment-option">
                <input
                  type="radio"
                  name="payment"
                  value="COD"
                  checked={paymentMethod === 'COD'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <span>Cash on Delivery (COD)</span>
              </label>

              <label className="payment-option">
                <input
                  type="radio"
                  name="payment"
                  value="Card"
                  checked={paymentMethod === 'Card'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <span>Credit/Debit Card</span>
              </label>
            </div>
          </div>

          {/* Discount Code */}
          <div className="checkout-section">
            <h2>Discount Code</h2>
            <div className="discount-input">
              <input
                type="text"
                placeholder="Enter discount code"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
              />
              <button className="btn-apply">Apply</button>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="checkout-summary">
          <h2>Order Summary</h2>

          <div className="summary-items">
            {cart.items.map((item) => (
              <div key={item.id} className="summary-item">
                <span>
                  {item.product?.name} × {item.quantity}
                </span>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="summary-totals">
            <div className="summary-row">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>

            <div className="summary-row">
              <span>Shipping</span>
              <span>{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span>
            </div>

            <div className="summary-row">
              <span>Tax (10%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>

            <div className="summary-row total">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <button
            className="btn-place-order"
            onClick={handlePlaceOrder}
            disabled={processing || !selectedAddress}
          >
            {processing ? 'Processing...' : 'Place Order'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
