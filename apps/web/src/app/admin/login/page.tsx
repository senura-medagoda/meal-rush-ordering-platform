'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { ShieldCheck } from 'lucide-react';
import { ApiError } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

export default function AdminLoginPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const loaded = useAuthStore((s) => s.loaded);
  const adminLogin = useAuthStore((s) => s.adminLogin);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Already logged in as admin? Go straight to the panel
  useEffect(() => {
    if (loaded && user?.role === 'ADMIN') router.replace('/admin');
  }, [loaded, user, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await adminLogin(email, password);
      router.push('/admin');
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const input =
    'w-full rounded-xl border border-stone-600 bg-stone-800 px-4 py-3 text-sm text-white outline-none placeholder:text-stone-500 focus:border-orange-500';

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-3xl bg-stone-900 p-8 text-white shadow-xl">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-600">
            <ShieldCheck size={22} />
          </span>
          <div>
            <h1 className="text-xl font-extrabold">Admin sign in</h1>
            <p className="text-sm text-stone-400">Authorized staff only</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-300">Email</label>
            <input
              className={input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-300">Password</label>
            <input
              className={input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              maxLength={64}
              autoComplete="current-password"
            />
          </div>

          {error && <p className="rounded-xl bg-red-950 p-3 text-sm text-red-200">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-orange-600 py-3 font-semibold hover:bg-orange-700 disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}