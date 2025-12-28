import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderAPI } from '../../services/api';
import { Order } from '../../types';
import './Orders.css';

const OrderList: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const response = await orderAPI.getOrders();
      setOrders(response.data.orders);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (status: string) => {
    const statusClasses: { [key: string]: string } = {
      pending: 'status-pending',
      confirmed: 'status-confirmed',
      processing: 'status-processing',
      shipped: 'status-shipped',
      delivered: 'status-delivered',
      cancelled: 'status-cancelled',
    };
    return statusClasses[status] || 'status-default';
  };

  if (loading) {
    return <div className="loading">Loading orders...</div>;
  }

  return (
    <div className="orders-container">
      <h1>My Orders</h1>

      {orders.length === 0 ? (
        <div className="no-orders">
          <p>You haven't placed any orders yet</p>
          <Link to="/products" className="btn-primary">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <Link
              key={order.id}
              to={`/orders/${order.id}`}
              className="order-card"
            >
              <div className="order-header">
                <div>
                  <h3>Order #{order.order_number}</h3>
                  <p className="order-date">
                    {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className={`order-status ${getStatusClass(order.status)}`}>
                  {order.status.toUpperCase()}
                </span>
              </div>

              <div className="order-details">
                <div className="order-info">
                  <p>
                    <strong>Total:</strong> ${order.total_amount.toFixed(2)}
                  </p>
                  <p>
                    <strong>Payment:</strong> {order.payment_method}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderList;
