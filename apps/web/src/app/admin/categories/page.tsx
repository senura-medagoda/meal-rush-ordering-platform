'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { ApiError, apiFetch } from '@/lib/api';
import { useApiData } from '@/hooks/use-api-data';
import type { Category } from '@/lib/types';
import { ErrorBox, Loading } from '@/components/admin/ui';

export default function AdminCategoriesPage() {
  const { data, error, loading, refetch } = useApiData<Category[]>('/categories');
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  async function run(action: () => Promise<unknown>) {
    setActionError(null);
    try {
      await action();
      refetch();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Something went wrong');
    }
  }

  function onCreate(e: FormEvent) {
    e.preventDefault();
    if (newName.trim().length < 2) return setActionError('Category name must be at least 2 characters');
    run(async () => {
      await apiFetch('/categories', { method: 'POST', body: JSON.stringify({ name: newName.trim() }) });
      setNewName('');
    });
  }

  function onRename(id: number) {
    if (editName.trim().length < 2) return setActionError('Category name must be at least 2 characters');
    run(async () => {
      await apiFetch(`/categories/${id}`, { method: 'PATCH', body: JSON.stringify({ name: editName.trim() }) });
      setEditingId(null);
    });
  }

  function onDelete(c: Category) {
    if (!window.confirm(`Delete category "${c.name}"?`)) return;
    run(() => apiFetch(`/categories/${c.id}`, { method: 'DELETE' }));
  }

  const input = 'rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-500';

  return (
    <div className="max-w-2xl space-y-4">
      <form onSubmit={onCreate} className="flex gap-2">
        <input
          className={`${input} flex-1`}
          placeholder="New category name"
          value={newName}
          maxLength={40}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button className="rounded-xl bg-orange-600 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-700">Add</button>
      </form>

      {(error || actionError) && <ErrorBox message={(error ?? actionError)!} />}
      {loading && !data && <Loading />}

      <ul className="divide-y divide-stone-100 rounded-2xl border border-stone-200 bg-white shadow-sm">
        {data?.map((c) => (
          <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            {editingId === c.id ? (
              <div className="flex flex-1 gap-2">
                <input className={`${input} flex-1`} value={editName} maxLength={40} onChange={(e) => setEditName(e.target.value)} />
                <button onClick={() => onRename(c.id)} className="text-sm font-semibold text-orange-600 hover:underline">
                  Save
                </button>
                <button onClick={() => setEditingId(null)} className="text-sm font-semibold text-stone-500 hover:underline">
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-stone-500">{c._count?.products ?? 0} products</p>
                </div>
                <div className="space-x-3 text-sm">
                  <button
                    onClick={() => {
                      setEditingId(c.id);
                      setEditName(c.name);
                    }}
                    className="font-semibold text-orange-600 hover:underline"
                  >
                    Rename
                  </button>
                  <button onClick={() => onDelete(c)} className="font-semibold text-red-600 hover:underline">
                    Delete
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
      <p className="text-xs text-stone-500">A category that still has products cannot be deleted. Move or remove its products first.</p>
    </div>
  );
}