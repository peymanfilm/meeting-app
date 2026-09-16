import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';
import { useSettingsStore } from './settingsStore';

interface AuthState {
  user: User | null;
  token: string | null;
  /** Mock JWT — later replaced by POST /auth/login (NestJS) */
  login: (username: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      login: (username, password) => {
        const { users, passwords } = useSettingsStore.getState();
        const user = users.find((u) => u.username === username.trim() && u.isActive);
        if (!user) {
          return { success: false, error: 'نام کاربری یا رمز عبور اشتباه است' };
        }
        if (passwords[username.trim()] !== password) {
          return { success: false, error: 'نام کاربری یا رمز عبور اشتباه است' };
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
