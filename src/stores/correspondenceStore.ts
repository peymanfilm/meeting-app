import { create } from 'zustand';
import type {
  CorrespondenceItem,
  CorrespondenceType,
  Priority,
  CorrespondenceStatus,
} from '@/types';
import { mockCorrespondence } from '@/mocks/data';
import { daysUntilDeadline } from '@/utils/jalali';

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
  addItem: (item: Omit<CorrespondenceItem, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => void;
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
  getFiltered: () => CorrespondenceItem[];
}

function computeStatus(deadline: string, responseDate: string | null): CorrespondenceStatus {
  if (responseDate) return 'completed';
  const days = daysUntilDeadline(deadline);
  if (days < 0) return 'overdue';
  if (days === 0) return 'near_deadline';
  if (days <= 3) return 'near_deadline';
  return 'in_progress';
}

export const useCorrespondenceStore = create<CorrespondenceState>((set, get) => ({
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
  addItem: (item) =>
    set((state) => ({
      items: [
        ...state.items,
        {
          ...item,
          id: `c${Date.now()}`,
          status: computeStatus(item.deadline, null),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    })),
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
  deleteItem: (id) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    })),
  completeItem: (id, response) =>
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
    })),
  refreshStatuses: () =>
    set((state) => ({
      items: state.items.map((item) => ({
        ...item,
        status: item.status === 'completed' ? 'completed' : computeStatus(item.deadline, item.responseDate),
      })),
    })),
  getFiltered: () => {
    const { items, filters } = get();
    return items.filter((item) => {
      if (filters.type !== 'all' && item.type !== filters.type) return false;
      if (filters.unitId !== 'all' && item.targetUnitId !== filters.unitId) return false;
      if (filters.status !== 'all' && item.status !== filters.status) return false;
      if (filters.dateFrom && new Date(item.issueDate) < new Date(filters.dateFrom)) return false;
      if (filters.dateTo && new Date(item.issueDate) > new Date(filters.dateTo)) return false;
      return true;
    });
  },
}));
