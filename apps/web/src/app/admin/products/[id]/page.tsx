'use client';

import { useParams } from 'next/navigation';
import { useApiData } from '@/hooks/use-api-data';
import type { Product } from '@/lib/types';
import { ProductForm } from '@/components/admin/product-form';
import { ErrorBox, Loading } from '@/components/admin/ui';

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const { data, error, loading } = useApiData<Product>(`/admin/products/${id}`);

  if (error) return <ErrorBox message={error} />;
  if (loading || !data) return <Loading />;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Edit: {data.name}</h2>
      <ProductForm key={data.id} product={data} />
    </div>
  );
}