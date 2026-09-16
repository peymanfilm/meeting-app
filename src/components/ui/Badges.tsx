import type { CorrespondenceStatus, Priority, NotificationLevel } from '@/types';
import { STATUS_LABELS, PRIORITY_LABELS, NOTIFICATION_LEVEL_LABELS } from '@/types';

const statusStyles: Record<CorrespondenceStatus, string> = {
  pending: 'bg-gray-100 text-gray-600',
  in_progress: 'bg-primary-100 text-primary-700',
  near_deadline: 'bg-warning-100 text-warning-700',
  overdue: 'bg-danger-100 text-danger-700',
  completed: 'bg-success-100 text-success-700',
};

const priorityStyles: Record<Priority, string> = {
  normal: 'bg-gray-100 text-gray-600',
  important: 'bg-warning-100 text-warning-700',
  urgent: 'bg-danger-100 text-danger-700',
};

const notificationStyles: Record<NotificationLevel, string> = {
  pre_warning: 'bg-success-100 text-success-700',
  warning: 'bg-warning-100 text-warning-700',
  critical: 'bg-orange-100 text-orange-700',
  overdue: 'bg-danger-100 text-danger-700',
};

export function StatusBadge({ status }: { status: CorrespondenceStatus }) {
  return (
    <span className={`badge ${statusStyles[status]}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
      {STATUS_LABELS[status]}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={`badge ${priorityStyles[priority]}`}>
      {PRIORITY_LABELS[priority]}
    </span>
  );
}

export function NotificationBadge({ level }: { level: NotificationLevel }) {
  return (
    <span className={`badge ${notificationStyles[level]}`}>
      {NOTIFICATION_LEVEL_LABELS[level]}
    </span>
  );
}
