import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ScoringSettings, Period, User, Unit } from '@/types';
import { defaultScoringSettings, mockPeriods, mockUsers, mockUnits } from '@/mocks/data';

interface SettingsState {
  scoring: ScoringSettings;
  periods: Period[];
  users: User[];
  units: Unit[];
  updateScoring: (updates: Partial<ScoringSettings>) => void;
  updateScoringField: <K extends keyof ScoringSettings>(key: K, value: ScoringSettings[K]) => void;
  addPeriod: (period: Omit<Period, 'id' | 'isClosed' | 'settings'>) => void;
  closePeriod: (id: string) => void;
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  resetPassword: (id: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      scoring: defaultScoringSettings,
      periods: mockPeriods,
      users: mockUsers,
      units: mockUnits,
      updateScoring: (updates) =>
        set((state) => ({ scoring: { ...state.scoring, ...updates } })),
      updateScoringField: (key, value) =>
        set((state) => ({ scoring: { ...state.scoring, [key]: value } })),
      addPeriod: (period) =>
        set((state) => ({
          periods: [
            ...state.periods,
            {
              ...period,
              id: `p${Date.now()}`,
              isClosed: false,
              settings: null,
            },
          ],
        })),
      closePeriod: (id) =>
        set((state) => ({
          periods: state.periods.map((p) =>
            p.id === id
              ? { ...p, isClosed: true, settings: { ...get().scoring } }
              : p,
          ),
        })),
      addUser: (user) =>
        set((state) => ({
          users: [
            ...state.users,
            {
              ...user,
              id: `user${Date.now()}`,
              createdAt: new Date().toISOString(),
            },
          ],
        })),
      updateUser: (id, updates) =>
        set((state) => ({
          users: state.users.map((u) => (u.id === id ? { ...u, ...updates } : u)),
        })),
      deleteUser: (id) =>
        set((state) => ({
          users: state.users.filter((u) => u.id !== id),
        })),
      resetPassword: () => {
        // Mock: just log
        console.log('Password reset (mock)');
      },
    }),
    {
      name: 'settings-storage',
    },
  ),
);
