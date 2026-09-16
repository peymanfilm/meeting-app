import type { Notification, NotificationLevel } from '@/types';
import { daysUntilDeadline } from './jalali';
import { useSettingsStore } from '@/stores/settingsStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useCorrespondenceStore } from '@/stores/correspondenceStore';

/**
 * In-app hierarchical alert system (سطوح پلکانی):
 * 🟢 پیش‌هشدار (pre_warning) — X days before deadline
 * 🟡 هشدار (warning) — Y days before
 * 🟠 بحرانی (critical) — deadline day
 * 🔴 تأخیر (overdue) — past deadline
 * One unread notification per (user, item, active level); earlier levels auto-marked read.
 */
export function syncAlerts(): void {
  const { items } = useCorrespondenceStore.getState();
  const { users, scoring } = useSettingsStore.getState();
  const notif = useNotificationStore.getState();
  const { preWarningDays, warningDays, alertTemplates } = scoring;

  const open = items.filter(
    (i) =>
      i.status === 'pending' ||
      i.status === 'in_progress' ||
      i.status === 'near_deadline' ||
      i.status === 'overdue',
  );
  if (open.length === 0) return;

  const toCreate: Omit<Notification, 'id' | 'createdAt' | 'isRead'>[] = [];

  for (const item of open) {
    const days = daysUntilDeadline(item.deadline);
    let level: NotificationLevel | null = null;
    if (days < 0) level = 'overdue';
    else if (days === 0) level = 'critical';
    else if (days <= warningDays) level = 'warning';
    else if (days <= preWarningDays) level = 'pre_warning';
    if (!level) continue;

    for (const u of users) {
      const isTarget = u.role === 'admin' || u.unitId === item.targetUnitId;
      if (!isTarget) continue;
      if (!u.isActive) continue;

      const exists = notif.notifications.some(
        (n) => n.userId === u.id && n.itemId === item.id && n.level === level,
      );
      if (exists) continue;

      const template = alertTemplates[level];
      const message = template
        .replace('{subject}', item.subject)
        .replace('{days}', String(Math.abs(days)));

      toCreate.push({ userId: u.id, itemId: item.id, level, message });

      // Supersede older alert levels of the same item for this user
      notif.downgradeOlderLevels(u.id, item.id, level);
    }
  }

  if (toCreate.length > 0) {
    notif.addNotifications(toCreate);
  }
}
