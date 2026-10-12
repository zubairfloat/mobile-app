export type Category = string;
export type CatalogCategory = {
  id: string;
  name: string;
  slug: string;
  image: string;
};
export type Product = {
  id: string;
  slug: string;
  title: string;
  category: Category;
  price: number;
  originalPrice?: number;
  rating?: number;
  reviews?: number;
  image: string;
  badge?: string;
  stock: number;
  colors: string[];
  description: string;
  features: string[];
  newest?: boolean;
  createdAt?: string;
  categoryId?: string;
};
export type CartItem = { product: Product; quantity: number; color: string };
