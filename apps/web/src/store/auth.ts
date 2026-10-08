import { create } from 'zustand';
import { apiFetch } from '@/lib/api';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: 'CUSTOMER' | 'ADMIN';
}

interface AuthState {
  user: AuthUser | null;
  loaded: boolean;
  fetchMe: () => Promise<void>;
  login: (email: string, password: string) => Promise<AuthUser>;
  adminLogin: (email: string, password: string) => Promise<AuthUser>;
  register: (name: string, email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loaded: false,

  fetchMe: async () => {
    try {
      const user = await apiFetch<AuthUser>('/auth/me');
      set({ user, loaded: true });
    } catch {
      set({ user: null, loaded: true });
    }
  },

  login: async (email, password) => {
    const { user } = await apiFetch<{ user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    set({ user, loaded: true });
    return user;
  },

  adminLogin: async (email, password) => {
    const { user } = await apiFetch<{ user: AuthUser }>('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    set({ user, loaded: true });
    return user;
  },

  register: async (name, email, password) => {
    const { user } = await apiFetch<{ user: AuthUser }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    set({ user, loaded: true });
    return user;
  },

  logout: async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } finally {
      set({ user: null });
    }
  },
}));