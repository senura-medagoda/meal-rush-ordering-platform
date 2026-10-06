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