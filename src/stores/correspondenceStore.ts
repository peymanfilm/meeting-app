import { create } from 'zustand';
import type {
  CorrespondenceItem,
  CorrespondenceType,
  Priority,
  CorrespondenceStatus,
} from '@/types';
import { mockCorrespondence } from '@/mocks/data';
import { daysUntilDeadline } from '@/utils/jalali';
import { syncAlerts } from '@/utils/alerts';
import { persist } from 'zustand/middleware';
import { useNotificationStore } from './notificationStore';

export interface CorrespondenceFilters {
  type: CorrespondenceType | 'all';
  unitId: string | 'all';
  status: CorrespondenceStatus | 'all';
  dateFrom: string | null;
  dateTo: string | null;
}

interface CorrespondenceState {
  items: CorrespondenceItem[];
  filters: CorrespondenceFilters;
  setFilters: (filters: Partial<CorrespondenceFilters>) => void;
  addItem: (
    item: Omit<CorrespondenceItem, 'id' | 'createdAt' | 'updatedAt' | 'status'>,
  ) => string;
  updateItem: (id: string, updates: Partial<CorrespondenceItem>) => void;
  deleteItem: (id: string) => void;
  completeItem: (
    id: string,
    response: {
      responseDate: string;
      responseDescription: string;
      qualityCompleteness: number;
      qualityAccuracy: number;
      qualityDocumentation: number;
    },
  ) => void;
  refreshStatuses: () => void;
}

function computeStatus(deadline: string, responseDate: string | null): CorrespondenceStatus {
  if (responseDate) return 'completed';
  const days = daysUntilDeadline(deadline);
  if (days < 0) return 'overdue';
  if (days === 0) return 'near_deadline';
  if (days <= 3) return 'near_deadline';
  return 'in_progress';
}

export const useCorrespondenceStore = create<CorrespondenceState>()(
  persist(
    (set, get) => ({
      items: mockCorrespondence,
  filters: {
    type: 'all',
    unitId: 'all',
    status: 'all',
    dateFrom: null,
    dateTo: null,
  },
  setFilters: (newFilters) =>
    set((state) => ({ filters: { ...state.filters, ...newFilters } })),
  addItem: (item) => {
    const id = `c${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    set((state) => ({
      items: [
        ...state.items,
        {
          ...item,
          id,
          status: computeStatus(item.deadline, null),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    }));
    syncAlerts();
    return id;
  },
  updateItem: (id, updates) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id
          ? {
              ...item,
              ...updates,
              updatedAt: new Date().toISOString(),
              status: updates.deadline
                ? computeStatus(updates.deadline, updates.responseDate ?? item.responseDate)
                : item.status,
            }
          : item,
      ),
    })),
  deleteItem: (id) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    }));
    useNotificationStore.getState().removeForItem(id);
  },
  completeItem: (id, response) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id
          ? {
              ...item,
              ...response,
              status: 'completed' as CorrespondenceStatus,
              updatedAt: new Date().toISOString(),
            }
          : item,
      ),
    }));
    syncAlerts();
  },
  refreshStatuses: () => {
    set((state) => {
      let changed = false;
      const next = state.items.map((item) => {
        const status =
          item.status === 'completed'
            ? 'completed'
            : computeStatus(item.deadline, item.responseDate);
        if (status !== item.status) changed = true;
        return status === item.status ? item : { ...item, status };
      });
      return changed ? { items: next } : {};
    });
    syncAlerts();
  },
    }),
    {
      name: 'correspondence-storage',
    },
  ),
);
