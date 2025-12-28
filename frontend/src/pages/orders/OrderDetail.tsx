import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { orderAPI } from '../../services/api';
import { Order, OrderItem, OrderTracking } from '../../types';
import './Orders.css';

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [tracking, setTracking] = useState<OrderTracking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    try {
      const response = await orderAPI.getOrder(Number(id));
      setOrder(response.data.order);
      setItems(response.data.items);
      setTracking(response.data.tracking);
    } catch (error) {
      console.error('Failed to load order:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading order...</div>;
  }

  if (!order) {
    return <div className="error">Order not found</div>;
  }

  return (
    <div className="order-detail-container">
      <h1>Order Details</h1>

      <div className="order-info-card">
        <h2>Order #{order.order_number}</h2>
        <p>
          <strong>Date:</strong> {new Date(order.created_at).toLocaleDateString()}
        </p>
        <p>
          <strong>Status:</strong>{' '}
          <span className={`order-status status-${order.status}`}>
            {order.status.toUpperCase()}
          </span>
        </p>
      </div>

      <div className="order-content">
        <div className="order-items-section">
          <h3>Order Items</h3>
          <div className="order-items">
            {items.map((item) => (
              <div key={item.id} className="order-item">
                <div>
                  <h4>{item.product_name}</h4>
                  <p>SKU: {item.product_sku}</p>
                </div>
                <div className="order-item-details">
                  <p>Quantity: {item.quantity}</p>
                  <p>Price: ${item.unit_price.toFixed(2)}</p>
                  <p className="item-total">
                    Total: ${item.total_price.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="order-summary-section">
          <h3>Order Summary</h3>
          <div className="summary-details">
            <div className="summary-row">
              <span>Subtotal</span>
              <span>${order.subtotal.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Discount</span>
              <span>-${order.discount_amount.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Tax</span>
              <span>${order.tax_amount.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Shipping</span>
              <span>${order.shipping_amount.toFixed(2)}</span>
            </div>
            <div className="summary-row total">
              <span>Total</span>
              <span>${order.total_amount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="tracking-section">
        <h3>Order Tracking</h3>
        <div className="tracking-timeline">
          {tracking.map((track, index) => (
            <div key={index} className="tracking-item">
              <div className="tracking-dot"></div>
              <div className="tracking-content">
                <p className="tracking-status">{track.status.toUpperCase()}</p>
                <p className="tracking-message">{track.message}</p>
                <p className="tracking-time">
                  {new Date(track.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
