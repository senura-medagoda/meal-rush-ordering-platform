export interface Category {
  id: number;
  name: string;
  slug: string;
  _count?: { products: number };
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: string;
  imageUrl: string | null;
  isVeg: boolean;
  isAvailable: boolean;
  stock: number;
  categoryId: number;
  category: { id: number; name: string; slug: string };
}

export interface Paginated<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export type PaymentMethod = 'PAYHERE' | 'WHATSAPP';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED';
export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export interface CreateOrderResponse {
  order: { orderNumber: string; total: string; paymentMethod: PaymentMethod };
  whatsappUrl?: string;
  payhere?: { action: string; fields: Record<string, string> };
}

export interface OrderTracking {
  orderNumber: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  subtotal: string;
  deliveryFee: string;
  total: string;
  createdAt: string;
  items: { productName: string; unitPrice: string; quantity: number }[];
}

export interface AdminOrderListItem {
  id: number;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  total: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  createdAt: string;
  _count: { items: number };
}

export interface AdminOrderDetail {
  id: number;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  deliveryAddress: string;
  deliveryCity: string;
  notes: string | null;
  subtotal: string;
  deliveryFee: string;
  total: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  createdAt: string;
  items: { id: number; productName: string; unitPrice: string; quantity: number }[];
  paymentLogs: {
    id: number;
    statusCode: number | null;
    payherePaymentId: string | null;
    createdAt: string;
    payload: Record<string, string | null>;
  }[];
}

export interface DashboardStats {
  ordersToday: number;
  revenueToday: string | number;
  pendingOrders: number;
  totalProducts: number;
  lowStock: { id: number; name: string; stock: number }[];
}