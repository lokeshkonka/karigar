import { create } from 'zustand';

export type UserRole = 'OWNER' | 'MANAGER' | 'TECHNICIAN' | 'CUSTOMER' | null;

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  garage_id?: string;
  avatar_url?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

// In a real app with Supabase, this would persist/sync with Supabase Auth Session
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => set({ user: null, isLoading: false }),
}));
