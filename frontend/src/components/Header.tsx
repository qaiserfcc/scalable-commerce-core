import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { isAuthenticated, isAdmin, logout, getUser } from '../utils/auth';
import './Header.css';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const user = getUser();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo">
          <h1>ChiltanCommerce</h1>
        </Link>

        <nav className="nav">
          <Link to="/products">Products</Link>
          
          {isAuthenticated() ? (
            <>
              <Link to="/cart">Cart</Link>
              <Link to="/orders">My Orders</Link>
              {isAdmin() && <Link to="/admin">Admin</Link>}
              <div className="user-menu">
                <span className="user-name">Hi, {user?.full_name}</span>
                <button onClick={handleLogout} className="btn-logout">
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-login">
                Login
              </Link>
              <Link to="/register" className="btn-register">
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
