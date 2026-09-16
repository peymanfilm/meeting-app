import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';
import { mockUsers } from '@/mocks/data';

interface AuthState {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      login: (username, password) => {
        const user = mockUsers.find((u) => u.username === username && u.isActive);
        if (!user) {
          return { success: false, error: 'نام کاربری یا رمز عبور اشتباه است' };
        }
        if (password.length < 3) {
          return { success: false, error: 'رمز عبور اشتباه است' };
        }
        const token = `mock-jwt-${user.id}-${Date.now()}`;
        set({ user, token });
        return { success: true };
      },
      logout: () => set({ user: null, token: null }),
      updateUser: (user) => set({ user }),
    }),
    {
      name: 'auth-storage',
    },
  ),
);
