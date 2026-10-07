import { ProductForm } from '@/components/admin/product-form';

export const metadata = { title: 'New product' };

export default function NewProductPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">New product</h2>
      <ProductForm />
    </div>
  );
}