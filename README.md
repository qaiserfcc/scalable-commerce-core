# scalable-commerce-core

A modular, microservices-style e-commerce platform built with Node.js (Express), MySQL, and React (TypeScript), designed for shared hosting without Docker. Features include quick registration, full shopping flow, bulk product uploads, discount management, order tracking, and an admin panel with a modern UI/UX.

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/qaiserfcc/scalable-commerce-core.git
cd scalable-commerce-core

# Copy and configure environment
cp .env.example .env
# Edit .env with your database credentials

# Create MySQL databases
mysql -u root -p < scripts/create-databases.sql

# Install all dependencies
npm run install-all

# Start all services
npm run start:all
```

Visit http://localhost:3000 for the API Gateway and the React frontend will be available on the configured port.

## 🏗️ Architecture

**9 Independent Microservices:**
- **API Gateway** (3000) - Central routing and rate limiting
- **Auth Service** (3001) - User authentication and management
- **Product Service** (3002) - Product catalog with bulk uploads
- **Cart Service** (3003) - Shopping cart management  
- **Order Service** (3004) - Order processing and tracking
- **Payment Service** (3005) - Payment processing
- **Discount Service** (3006) - Coupon and discount management
- **Admin Service** (3007) - Admin dashboard and analytics
- **Notification Service** (3008) - Email notifications

**Frontend:**
- Modern React with TypeScript
- Gradient-based UI inspired by chiltanpure.com
- Fully responsive design

## ✨ Key Features

- ⚡ **Quick Registration** - Get started in seconds
- 🛍️ **Full Shopping Flow** - Browse, cart, checkout, track
- 📦 **Bulk Product Uploads** - CSV-based import
- 💰 **Discount System** - Flexible coupon management
- 📊 **Admin Dashboard** - Analytics and management
- 🔒 **JWT Authentication** - Secure token-based auth
- 🗄️ **Separate Databases** - MySQL database per service
- 📱 **Responsive Design** - Works on all devices

## 📚 Documentation

- [Deployment Guide](./DEPLOYMENT.md) - Complete deployment instructions
- [API Documentation](#api-endpoints) - Service endpoints reference
- [Architecture Details](#architecture) - System design overview

## 🔧 Development

```bash
# Start individual services for development
npm run dev:gateway
npm run dev:auth
npm run dev:product
# ... etc

# Start frontend
npm run dev:frontend
```

## 🌐 Deployment

Optimized for shared hosting environments. See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions including:
- Server setup
- Database configuration
- Process management with PM2
- Nginx/Apache configuration
- Production security

## 📦 Tech Stack

**Backend:**
- Node.js + Express
- MySQL with separate databases
- JWT authentication
- bcryptjs for password hashing
- Nodemailer for notifications

**Frontend:**
- React 18
- TypeScript
- React Router
- Axios
- Modern CSS with gradients

## 🤝 Contributing

Contributions welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see LICENSE file for details

## 👏 Acknowledgments

UI/UX design inspired by [chiltanpure.com](https://chiltanpure.com)
