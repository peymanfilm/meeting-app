import { useMemo } from 'react';
import { CheckCheck, Bell, BellOff } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useCorrespondenceStore } from '@/stores/correspondenceStore';
import { NotificationBadge } from '@/components/ui/Badges';
import { toJalaliWithTime } from '@/utils/jalali';
import { NOTIFICATION_LEVEL_LABELS } from '@/types';
import type { NotificationLevel } from '@/types';

const levelDot: Record<NotificationLevel, string> = {
  pre_warning: 'bg-success-500',
  warning: 'bg-warning-500',
  critical: 'bg-orange-500',
  overdue: 'bg-danger-500',
};

export default function NotificationsPage() {
  const user = useAuthStore((s) => s.user);
  const notifications = useNotificationStore((s) => s.notifications);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);
  const items = useCorrespondenceStore((s) => s.items);

  const myNotifications = useMemo(
    () =>
      notifications
        .filter((n) => n.userId === user?.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [notifications, user],
  );

  const unreadCount = myNotifications.filter((n) => !n.isRead).length;

  const countsByLevel = useMemo(() => {
    const counts: Record<NotificationLevel, number> = {
      pre_warning: 0,
      warning: 0,
      critical: 0,
      overdue: 0,
    };
    myNotifications.forEach((n) => {
      counts[n.level]++;
    });
    return counts;
  }, [myNotifications]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">اعلان‌های درون‌سامانه‌ای</h1>
          <p className="text-gray-500 mt-1">
            {unreadCount > 0 ? `${unreadCount} اعلان خوانده‌نشده` : 'همه اعلان‌ها خوانده شده‌اند'}
          </p>
        </div>
        <button
          onClick={() => user && markAllAsRead(user.id)}
          disabled={unreadCount === 0}
          className="btn-secondary disabled:opacity-40"
        >
          <CheckCheck size={18} />
          علامت‌گذاری همه به‌عنوان خوانده‌شده
        </button>
      </div>

      {/* Level summary - سطوح پلکانی */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {(
          [
            { level: 'pre_warning', dot: 'bg-success-500' },
            { level: 'warning', dot: 'bg-warning-500' },
            { level: 'critical', dot: 'bg-orange-500' },
            { level: 'overdue', dot: 'bg-danger-500' },
          ] as const
        ).map(({ level, dot }) => (
          <div key={level} className="card p-4 flex items-center gap-3">
            <span className={`w-3 h-3 rounded-full ${dot} shrink-0`} />
            <div>
              <p className="text-xs text-gray-500">{NOTIFICATION_LEVEL_LABELS[level]}</p>
              <p className="text-xl font-bold text-gray-800">{countsByLevel[level]}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {myNotifications.length === 0 ? (
          <div className="card p-12 flex flex-col items-center gap-3 text-gray-400">
            <BellOff size={40} />
            <p className="text-sm">اعلانی وجود ندارد</p>
          </div>
        ) : (
          myNotifications.map((notif) => {
            const item = items.find((i) => i.id === notif.itemId);
            return (
              <div
                key={notif.id}
                onClick={() => !notif.isRead && markAsRead(notif.id)}
                className={`card p-4 flex items-start gap-3 cursor-pointer transition-all hover:shadow-card-hover ${
                  notif.isRead ? 'opacity-70' : 'border-r-4'
                } ${!notif.isRead ? 'border-r-primary-600' : ''}`}
              >
                <span className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${levelDot[notif.level]}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <NotificationBadge level={notif.level} />
                    {!notif.isRead && (
                      <span className="text-xs font-medium text-primary-600">جدید</span>
                    )}
                    <span className="text-xs text-gray-400 mr-auto">
                      {toJalaliWithTime(notif.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{notif.message}</p>
                  {item && (
                    <p className="text-xs text-gray-400 mt-1">
                      واحد مخاطب مورد پیگیری: {item.referenceNumber || '—'}
                    </p>
                  )}
                </div>
                <Bell
                  size={16}
                  className={`shrink-0 mt-1 ${notif.isRead ? 'text-gray-300' : 'text-primary-500'}`}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
