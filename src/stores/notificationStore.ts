import { create } from 'zustand';
import type { Notification, NotificationLevel } from '@/types';
import { mockNotifications } from '@/mocks/data';

interface NotificationState {
  notifications: Notification[];
  getUserNotifications: (userId: string) => Notification[];
  getUnreadCount: (userId: string) => number;
  markAsRead: (id: string) => void;
  markAllAsRead: (userId: string) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: mockNotifications,
  getUserNotifications: (userId) =>
    get()
      .notifications.filter((n) => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
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
          id: `n${Date.now()}`,
          isRead: false,
          createdAt: new Date().toISOString(),
        },
      ],
    })),
}));
