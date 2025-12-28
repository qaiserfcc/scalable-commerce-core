# Scalable Commerce Core

A microservices-style e-commerce platform built with Node.js (Express), MySQL, and React (TypeScript), designed for shared hosting environments without Docker.

## Features

- ✅ **Microservices Architecture**: Separate services for Auth, Products, Cart, Orders, Payments, Discounts, Admin, and Notifications
- ✅ **API Gateway**: Central routing and rate limiting
- ✅ **Quick Registration**: Fast user onboarding with JWT authentication
- ✅ **Full Shopping Flow**: Browse products, add to cart, checkout, and track orders
- ✅ **Bulk Product Uploads**: CSV-based bulk import for products
- ✅ **Discount Management**: Create and manage discount codes
- ✅ **Order Tracking**: Real-time order status updates
- ✅ **Admin Panel**: Dashboard with analytics and management tools
- ✅ **Separate MySQL Databases**: Each service has its own database for scalability
- ✅ **Modern UI**: React with TypeScript, inspired by chiltanpure.com aesthetic

## Architecture

### Backend Services (Node.js + Express + MySQL)

1. **API Gateway** (Port 3000)
   - Routes requests to appropriate services
   - Rate limiting and security
   - CORS handling

2. **Auth Service** (Port 3001)
   - User registration and login
   - JWT token management
   - User profile and address management
   - Database: `auth_db`

3. **Product Service** (Port 3002)
   - Product CRUD operations
   - Category management
   - Bulk product uploads via CSV
   - Database: `product_db`

4. **Cart Service** (Port 3003)
   - Shopping cart management
   - Add/update/remove items
   - Database: `cart_db`

5. **Order Service** (Port 3004)
   - Order creation and management
   - Order tracking with status updates
   - Database: `order_db`

6. **Payment Service** (Port 3005)
   - Payment processing (COD and online payments)
   - Payment history
   - Database: `payment_db`

7. **Discount Service** (Port 3006)
   - Discount code creation and validation
   - Usage tracking
   - Database: `discount_db`

8. **Admin Service** (Port 3007)
   - Dashboard analytics
   - User and order management
   - Database: `admin_db`

9. **Notification Service** (Port 3008)
   - Email notifications
   - Order confirmations
   - Status updates

### Frontend (React + TypeScript)

- Modern, responsive UI
- Product browsing and search
- Shopping cart interface
- Order tracking
- Admin dashboard
- Gradient-based design inspired by chiltanpure.com

## Installation

### Prerequisites

- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- npm or yarn

### Step 1: Clone the Repository

```bash
git clone https://github.com/qaiserfcc/scalable-commerce-core.git
cd scalable-commerce-core
```

### Step 2: Environment Configuration

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database credentials
AUTH_DB_HOST=localhost
AUTH_DB_USER=root
AUTH_DB_PASSWORD=your_password
# ... (configure for all services)

# JWT Secret (change in production!)
JWT_SECRET=your-secret-key-change-this-in-production

# Email configuration (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-email-password
```

### Step 3: Create MySQL Databases

Create the required databases in MySQL:

```sql
CREATE DATABASE auth_db;
CREATE DATABASE product_db;
CREATE DATABASE cart_db;
CREATE DATABASE order_db;
CREATE DATABASE payment_db;
CREATE DATABASE discount_db;
CREATE DATABASE admin_db;
```

The tables will be automatically created when each service starts for the first time.

### Step 4: Install Dependencies

Install all service and frontend dependencies:

```bash
# Install all services
npm run install-all
```

Or install individually:

```bash
# Root dependencies
npm install

# Each service
cd services/api-gateway && npm install
cd ../auth-service && npm install
cd ../product-service && npm install
# ... (repeat for all services)

# Frontend
cd frontend && npm install
```

### Step 5: Start the Application

#### Option A: Start All Services Simultaneously

```bash
npm run start:all
```

#### Option B: Start Services Individually (recommended for development)

Open separate terminal windows for each:

```bash
# Terminal 1: API Gateway
npm run dev:gateway

# Terminal 2: Auth Service
npm run dev:auth

# Terminal 3: Product Service
npm run dev:product

# Terminal 4: Cart Service
npm run dev:cart

# Terminal 5: Order Service
npm run dev:order

# Terminal 6: Payment Service
npm run dev:payment

# Terminal 7: Discount Service
npm run dev:discount

# Terminal 8: Admin Service
npm run dev:admin

# Terminal 9: Notification Service
npm run dev:notification

# Terminal 10: Frontend
npm run dev:frontend
```

### Step 6: Access the Application

- **Frontend**: http://localhost:3000 (served by React dev server, typically on port 3000 or 3001 if gateway uses 3000)
- **API Gateway**: http://localhost:3000
- **Services**: Ports 3001-3008 (as configured)

## Usage

### For Customers

1. **Register**: Quick registration with email, password, and name
2. **Browse Products**: Search and filter products by category
3. **Add to Cart**: Select products and quantities
4. **Checkout**: Enter shipping address and complete order
5. **Track Orders**: View order status and tracking history

### For Admins

1. **Login**: Use admin credentials
2. **Dashboard**: View statistics and analytics
3. **Manage Products**: Add, edit, or bulk upload products
4. **Manage Orders**: Update order statuses
5. **Create Discounts**: Set up promotional codes
6. **View Analytics**: Monitor sales and performance

### Bulk Product Upload

CSV format for bulk upload:

```csv
name,description,price,compare_at_price,sku,category_id,stock_quantity,image_url,featured
Product Name,Description,29.99,39.99,SKU-001,1,100,https://example.com/image.jpg,true
```

## API Endpoints

### Auth Service
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile
- `GET /api/auth/addresses` - Get user addresses
- `POST /api/auth/addresses` - Add new address

### Product Service
- `GET /api/products/products` - List products (with filters)
- `GET /api/products/products/:id` - Get single product
- `POST /api/products/products` - Create product (admin)
- `PUT /api/products/products/:id` - Update product (admin)
- `POST /api/products/products/bulk-upload` - Bulk upload (admin)
- `GET /api/products/categories` - List categories

### Cart Service
- `GET /api/cart/cart` - Get user cart
- `POST /api/cart/cart/items` - Add item to cart
- `PUT /api/cart/cart/items/:id` - Update cart item
- `DELETE /api/cart/cart/items/:id` - Remove cart item
- `DELETE /api/cart/cart` - Clear cart

### Order Service
- `POST /api/orders/orders` - Create order
- `GET /api/orders/orders` - List user orders
- `GET /api/orders/orders/:id` - Get order details
- `GET /api/orders/track/:orderNumber` - Track order (public)
- `POST /api/orders/orders/:id/cancel` - Cancel order

### Discount Service
- `GET /api/discounts/discounts` - List active discounts
- `POST /api/discounts/discounts/validate` - Validate discount code
- `POST /api/discounts/discounts` - Create discount (admin)

### Admin Service
- `GET /api/admin/dashboard/stats` - Dashboard statistics
- `GET /api/admin/analytics/sales` - Sales analytics

## Deployment on Shared Hosting

### Build Frontend

```bash
cd frontend
npm run build
```

### Deploy Services

1. Upload service directories to your hosting
2. Install dependencies on server: `npm install --production`
3. Configure environment variables
4. Start services using PM2 or similar process manager:

```bash
pm2 start services/api-gateway/server.js --name api-gateway
pm2 start services/auth-service/server.js --name auth-service
# ... (repeat for all services)
```

### Configure Nginx/Apache

Example Nginx configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Serve React build
    location / {
        root /path/to/frontend/build;
        try_files $uri /index.html;
    }

    # Proxy API requests
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Security Considerations

1. **Change JWT Secret**: Update `JWT_SECRET` in production
2. **Use HTTPS**: Enable SSL certificates
3. **Database Security**: Use strong passwords and restrict access
4. **Rate Limiting**: Configure appropriate limits in API Gateway
5. **Input Validation**: All inputs are validated on the backend
6. **CORS**: Configure appropriate CORS policies

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions, please open an issue on GitHub.

## Acknowledgments

- UI/UX inspiration: chiltanpure.com
- Built with modern web technologies for scalability and performance
