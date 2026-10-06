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