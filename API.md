# API Documentation

## Base URL

```
http://localhost:3000/api
```

All requests go through the API Gateway which routes to appropriate microservices.

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

---

## Auth Service (`/api/auth`)

### Register User
**POST** `/api/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "John Doe",
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "message": "Registration successful",
  "token": "jwt-token",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "customer"
  }
}
```

### Login
**POST** `/api/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "jwt-token",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "customer"
  }
}
```

### Get Profile
**GET** `/api/auth/profile`

Requires authentication.

**Response:**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Doe",
    "phone": "+1234567890",
    "role": "customer",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### Get Addresses
**GET** `/api/auth/addresses`

Requires authentication.

**Response:**
```json
{
  "addresses": [
    {
      "id": 1,
      "address_line1": "123 Main St",
      "address_line2": "Apt 4",
      "city": "New York",
      "state": "NY",
      "postal_code": "10001",
      "country": "USA",
      "is_default": true
    }
  ]
}
```

---

## Product Service (`/api/products`)

### List Products
**GET** `/api/products/products`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `search` (optional): Search query
- `category` (optional): Category ID
- `featured` (optional): Filter featured products
- `min_price` (optional): Minimum price
- `max_price` (optional): Maximum price
- `sort` (optional): Sort field (created_at, price, name)
- `order` (optional): Sort order (ASC, DESC)

**Response:**
```json
{
  "products": [
    {
      "id": 1,
      "name": "Product Name",
      "description": "Product description",
      "price": 29.99,
      "compare_at_price": 39.99,
      "sku": "SKU-001",
      "category_id": 1,
      "category_name": "Category",
      "stock_quantity": 100,
      "image_url": "https://example.com/image.jpg",
      "featured": true,
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

### Get Product
**GET** `/api/products/products/:id`

**Response:**
```json
{
  "product": {
    "id": 1,
    "name": "Product Name",
    "description": "Detailed product description",
    "price": 29.99,
    "compare_at_price": 39.99,
    "sku": "SKU-001",
    "category_id": 1,
    "category_name": "Category",
    "stock_quantity": 100,
    "image_url": "https://example.com/image.jpg",
    "featured": true,
    "attributes": [
      {
        "attribute_name": "Color",
        "attribute_value": "Blue"
      }
    ]
  }
}
```

### Create Product (Admin)
**POST** `/api/products/products`

Requires admin authentication.

**Request Body:**
```json
{
  "name": "Product Name",
  "description": "Product description",
  "price": 29.99,
  "compare_at_price": 39.99,
  "sku": "SKU-001",
  "category_id": 1,
  "stock_quantity": 100,
  "image_url": "https://example.com/image.jpg",
  "featured": false,
  "attributes": [
    {
      "name": "Color",
      "value": "Blue"
    }
  ]
}
```

### Bulk Upload Products (Admin)
**POST** `/api/products/products/bulk-upload`

Requires admin authentication.

**Request:**
- Content-Type: `multipart/form-data`
- Body: File upload with key `file`

CSV Format:
```csv
name,description,price,compare_at_price,sku,category_id,stock_quantity,image_url,featured
Product 1,Description,29.99,39.99,SKU-001,1,100,https://example.com/img.jpg,true
```

---

## Cart Service (`/api/cart`)

### Get Cart
**GET** `/api/cart/cart`

Requires authentication.

**Response:**
```json
{
  "cart_id": 1,
  "items": [
    {
      "id": 1,
      "product_id": 1,
      "quantity": 2,
      "price": 29.99,
      "product": {
        "id": 1,
        "name": "Product Name",
        "image_url": "https://example.com/image.jpg",
        "stock_quantity": 100
      }
    }
  ],
  "subtotal": "59.98",
  "item_count": 1
}
```

### Add to Cart
**POST** `/api/cart/cart/items`

Requires authentication.

**Request Body:**
```json
{
  "product_id": 1,
  "quantity": 2
}
```

### Update Cart Item
**PUT** `/api/cart/cart/items/:itemId`

Requires authentication.

**Request Body:**
```json
{
  "quantity": 3
}
```

### Remove from Cart
**DELETE** `/api/cart/cart/items/:itemId`

Requires authentication.

---

## Order Service (`/api/orders`)

### Create Order
**POST** `/api/orders/orders`

Requires authentication.

**Request Body:**
```json
{
  "shipping_address": {
    "address_line1": "123 Main St",
    "city": "New York",
    "state": "NY",
    "postal_code": "10001",
    "country": "USA"
  },
  "billing_address": {
    "address_line1": "123 Main St",
    "city": "New York",
    "state": "NY",
    "postal_code": "10001",
    "country": "USA"
  },
  "payment_method": "COD",
  "discount_code": "SAVE10"
}
```

**Response:**
```json
{
  "message": "Order created successfully",
  "order_id": 1,
  "order_number": "ORD-ABC123-XYZ",
  "total_amount": "65.98"
}
```

### Get Orders
**GET** `/api/orders/orders`

Requires authentication.

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `status` (optional): Filter by status

**Response:**
```json
{
  "orders": [
    {
      "id": 1,
      "order_number": "ORD-ABC123-XYZ",
      "status": "pending",
      "total_amount": 65.98,
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "pages": 1
  }
}
```

### Get Order Details
**GET** `/api/orders/orders/:id`

Requires authentication.

**Response:**
```json
{
  "order": {
    "id": 1,
    "order_number": "ORD-ABC123-XYZ",
    "status": "shipped",
    "subtotal": 59.98,
    "discount_amount": 5.99,
    "tax_amount": 5.40,
    "shipping_amount": 0.00,
    "total_amount": 59.39,
    "created_at": "2024-01-01T00:00:00.000Z"
  },
  "items": [
    {
      "id": 1,
      "product_name": "Product Name",
      "product_sku": "SKU-001",
      "quantity": 2,
      "unit_price": 29.99,
      "total_price": 59.98
    }
  ],
  "tracking": [
    {
      "status": "pending",
      "message": "Order placed successfully",
      "created_at": "2024-01-01T00:00:00.000Z"
    },
    {
      "status": "shipped",
      "message": "Order has been shipped",
      "created_at": "2024-01-02T00:00:00.000Z"
    }
  ]
}
```

### Track Order (Public)
**GET** `/api/orders/track/:orderNumber`

No authentication required.

---

## Discount Service (`/api/discounts`)

### Get Active Discounts
**GET** `/api/discounts/discounts`

**Response:**
```json
{
  "discounts": [
    {
      "code": "SAVE10",
      "description": "Save 10% on your order",
      "type": "percentage",
      "value": 10,
      "min_purchase_amount": 50,
      "valid_until": "2024-12-31T23:59:59.000Z"
    }
  ]
}
```

### Validate Discount
**POST** `/api/discounts/discounts/validate`

Requires authentication.

**Request Body:**
```json
{
  "code": "SAVE10",
  "subtotal": 100
}
```

**Response:**
```json
{
  "valid": true,
  "discount_id": 1,
  "discount_amount": "10.00",
  "description": "Save 10% on your order"
}
```

---

## Admin Service (`/api/admin`)

All endpoints require admin authentication.

### Get Dashboard Stats
**GET** `/api/admin/dashboard/stats`

**Response:**
```json
{
  "stats": {
    "total_users": 1000,
    "total_products": 500,
    "total_orders": 250,
    "total_revenue": 15000.00,
    "pending_orders": 15,
    "low_stock_products": 5
  }
}
```

---

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "error": "Error message description"
}
```

Common HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error
