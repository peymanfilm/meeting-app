import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ScoringSettings, Period, User, Unit } from '@/types';
import { defaultScoringSettings, mockPeriods, mockUsers, mockUnits } from '@/mocks/data';

interface SettingsState {
  scoring: ScoringSettings;
  periods: Period[];
  users: User[];
  units: Unit[];
  /** username → password (mock; fase ۳ moves to DB) */
  passwords: Record<string, string>;
  updateScoring: (updates: Partial<ScoringSettings>) => void;
  addPeriod: (period: { name: string; startDate: string; endDate: string }) => void;
  closePeriod: (id: string) => void;
  addUser: (user: Omit<User, 'id' | 'createdAt'> & { password: string }) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  resetPassword: (id: string, newPassword: string) => void;
  renameUnit: (id: string, name: string) => void;
}

const defaultPasswords: Record<string, string> = {
  moaven: '123456',
  modir_pajoohesh: '123456',
  modir_nashr: '123456',
  modir_tovzi: '123456',
  modir_mali: '123456',
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      scoring: defaultScoringSettings,
      periods: mockPeriods,
      users: mockUsers,
      units: mockUnits,
      passwords: defaultPasswords,

      updateScoring: (updates) =>
        set((state) => ({ scoring: { ...state.scoring, ...updates } })),

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

      addUser: ({ password, ...user }) =>
        set((state) => {
          const id = `user${Date.now()}`;
          return {
            users: [
              ...state.users,
              { ...user, id, createdAt: new Date().toISOString() },
            ],
            passwords: { ...state.passwords, [user.username]: password },
          };
        }),

      updateUser: (id, updates) =>
        set((state) => ({
          users: state.users.map((u) => (u.id === id ? { ...u, ...updates } : u)),
        })),

      deleteUser: (id) =>
        set((state) => ({
          users: state.users.filter((u) => u.id !== id),
        })),

      resetPassword: (id, newPassword) =>
        set((state) => {
          const target = state.users.find((x) => x.id === id);
          if (!target) return {};
          return {
            passwords: { ...state.passwords, [target.username]: newPassword },
          };
        }),

      renameUnit: (id, name) =>
        set((state) => ({
          units: state.units.map((u) => (u.id === id ? { ...u, name } : u)),
        })),
    }),
    {
      name: 'settings-storage',
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<SettingsState>;
        return {
          ...current,
          ...p,
          scoring: { ...current.scoring, ...(p.scoring ?? {}) },
        };
      },
    },
  ),
);
