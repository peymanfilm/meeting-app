import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Notification, NotificationLevel } from '@/types';
import { mockNotifications } from '@/mocks/data';

const LEVEL_ORDER: Record<NotificationLevel, number> = {
  pre_warning: 0,
  warning: 1,
  critical: 2,
  overdue: 3,
};

interface NotificationState {
  notifications: Notification[];
  getUserNotifications: (userId: string) => Notification[];
  getUnreadCount: (userId: string) => number;
  markAsRead: (id: string) => void;
  markAllAsRead: (userId: string) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => void;
  /** Batch-add notifications, deduplicating (user, item, level) pairs */
  addNotifications: (
    batch: Omit<Notification, 'id' | 'createdAt' | 'isRead'>[],
  ) => void;
  /** Mark all other-level notifications for (user, item) as read when `level` supersedes them */
  downgradeOlderLevels: (userId: string, itemId: string, level: NotificationLevel) => void;
  removeForItem: (itemId: string) => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: mockNotifications,

      getUserNotifications: (userId) =>
        get()
          .notifications.filter((n) => n.userId === userId)
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          ),

      getUnreadCount: (userId) =>
        get().notifications.filter((n) => n.userId === userId && !n.isRead).length,

      markAsRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n,
          ),
        })),

      markAllAsRead: (userId) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.userId === userId ? { ...n, isRead: true } : n,
          ),
        })),

      addNotification: (notification) =>
        set((state) => ({
          notifications: [
            ...state.notifications,
            {
              ...notification,
              id: `n${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
              isRead: false,
              createdAt: new Date().toISOString(),
            },
          ],
        })),

      addNotifications: (batch) =>
        set((state) => {
          const deduped = batch.filter(
            (n) =>
              !state.notifications.some(
                (x) =>
                  x.userId === n.userId &&
                  x.itemId === n.itemId &&
                  x.level === n.level,
              ),
          );
          if (deduped.length === 0) return {};
          const now = Date.now();
          const created: Notification[] = deduped.map((n, i) => ({
            ...n,
            id: `n${now}_${i}_${Math.random().toString(36).slice(2, 7)}`,
            isRead: false,
            createdAt: new Date(now + i).toISOString(),
          }));
          return { notifications: [...state.notifications, ...created] };
        }),

      downgradeOlderLevels: (userId, itemId, level) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.userId === userId &&
            n.itemId === itemId &&
            n.level !== level &&
            LEVEL_ORDER[n.level] < LEVEL_ORDER[level]
              ? { ...n, isRead: true }
              : n,
          ),
        })),

      removeForItem: (itemId) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.itemId !== itemId),
        })),
    }),
    {
      name: 'notifications-storage',
    },
  ),
);
