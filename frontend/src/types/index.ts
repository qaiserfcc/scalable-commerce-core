export interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  compare_at_price?: number;
  sku: string;
  category_id?: number;
  category_name?: string;
  stock_quantity: number;
  image_url?: string;
  images?: string;
  is_active: boolean;
  featured: boolean;
  created_at: string;
}

export interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
  price: number;
  product: Product;
}

export interface Cart {
  cart_id: number;
  items: CartItem[];
  subtotal: string;
  item_count: number;
}

export interface Order {
  id: number;
  order_number: string;
  status: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  shipping_amount: number;
  total_amount: number;
  shipping_address: string;
  payment_method: string;
  payment_status: string;
  created_at: string;
}

export interface OrderItem {
  id: number;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface OrderTracking {
  status: string;
  message: string;
  created_at: string;
}

export interface Discount {
  code: string;
  description: string;
  type: string;
  value: number;
  min_purchase_amount?: number;
  valid_until?: string;
}

export interface Address {
  id?: number;
  address_line1: string;
  address_line2?: string;
  city: string;
  state?: string;
  postal_code: string;
  country: string;
  is_default?: boolean;
}
