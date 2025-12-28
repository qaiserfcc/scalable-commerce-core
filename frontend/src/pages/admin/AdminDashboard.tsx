import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import './Admin.css';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    total_users: 0,
    total_products: 0,
    total_orders: 0,
    total_revenue: 0,
    pending_orders: 0,
    low_stock_products: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await adminAPI.getDashboardStats();
      setStats(response.data.stats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="admin-container">
      <h1>Admin Dashboard</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Users</h3>
          <p className="stat-number">{stats.total_users}</p>
        </div>

        <div className="stat-card">
          <h3>Total Products</h3>
          <p className="stat-number">{stats.total_products}</p>
        </div>

        <div className="stat-card">
          <h3>Total Orders</h3>
          <p className="stat-number">{stats.total_orders}</p>
        </div>

        <div className="stat-card">
          <h3>Total Revenue</h3>
          <p className="stat-number">${stats.total_revenue.toFixed(2)}</p>
        </div>

        <div className="stat-card warning">
          <h3>Pending Orders</h3>
          <p className="stat-number">{stats.pending_orders}</p>
        </div>

        <div className="stat-card alert">
          <h3>Low Stock Products</h3>
          <p className="stat-number">{stats.low_stock_products}</p>
        </div>
      </div>

      <div className="admin-actions">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <button className="action-btn">Manage Products</button>
          <button className="action-btn">View Orders</button>
          <button className="action-btn">Manage Users</button>
          <button className="action-btn">Create Discount</button>
          <button className="action-btn">View Analytics</button>
          <button className="action-btn">Bulk Upload Products</button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
