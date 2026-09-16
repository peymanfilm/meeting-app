import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  CalendarDays,
  TrendingUp,
  FileText,
  ArrowLeft,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useCorrespondenceStore } from '@/stores/correspondenceStore';
import { useMeetingStore } from '@/stores/meetingStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { calculateAllUnitReports } from '@/utils/scoring';
import { isThisWeek, toJalali } from '@/utils/jalali';
import { StatusBadge, NotificationBadge } from '@/components/ui/Badges';

const STATUS_COLORS: Record<string, string> = {
  pending: '#94a3b8',
  in_progress: '#3b82f6',
  near_deadline: '#eab308',
  overdue: '#ef4444',
  completed: '#22c55e',
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const allItems = useCorrespondenceStore((s) => s.items);
  const meetings = useMeetingStore((s) => s.meetings);
  const notifications = useNotificationStore((s) => s.notifications);
  const { units, scoring, periods } = useSettingsStore();

  const items = useMemo(() => {
    if (user?.role === 'admin') return allItems;
    return allItems.filter((i) => i.targetUnitId === user?.unitId);
  }, [allItems, user]);

  const stats = useMemo(() => {
    const pending = items.filter(
      (i) => i.status === 'pending' || i.status === 'in_progress',
    ).length;
    const overdue = items.filter((i) => i.status === 'overdue').length;
    const completed = items.filter((i) => i.status === 'completed').length;
    const thisWeekMeetings = meetings.filter((m) => isThisWeek(m.datetime)).length;
    return { pending, overdue, completed, thisWeekMeetings };
  }, [items, meetings]);

  const userNotifications = useMemo(
    () => notifications.filter((n) => n.userId === user?.id).slice(0, 5),
    [notifications, user],
  );

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((i) => {
      counts[i.status] = (counts[i.status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      label: STATUS_LABELS_FA[name] || name,
    }));
  }, [items]);

  const activePeriod = periods.find((p) => !p.isClosed);
  const unitReports = useMemo(() => {
    if (!activePeriod || user?.role !== 'admin') return [];
    return calculateAllUnitReports(units, activePeriod.id, allItems, scoring);
  }, [units, activePeriod, allItems, scoring, user]);

  const statCards = [
    {
      label: 'در انتظار',
      value: stats.pending,
      icon: Clock,
      color: 'bg-primary-100 text-primary-700',
      ringColor: 'from-primary-500 to-primary-700',
    },
    {
      label: 'گذشته از موعد',
      value: stats.overdue,
      icon: AlertTriangle,
      color: 'bg-danger-100 text-danger-700',
      ringColor: 'from-danger-500 to-danger-700',
    },
    {
      label: 'تکمیل‌شده',
      value: stats.completed,
      icon: CheckCircle2,
      color: 'bg-success-100 text-success-700',
      ringColor: 'from-success-500 to-success-700',
    },
    {
      label: 'جلسات این هفته',
      value: stats.thisWeekMeetings,
      icon: CalendarDays,
      color: 'bg-accent-100 text-accent-700',
      ringColor: 'from-accent-500 to-accent-700',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          سلام، {user?.firstName} {user?.lastName}
        </h1>
        <p className="text-gray-500 mt-1">
          {user?.role === 'admin'
            ? 'نمای کلی از وضعیت سامانه'
            : 'نمای کلی از وضعیت واحد شما'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="card p-5 hover:shadow-card-hover transition-all duration-200 group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{card.label}</p>
                  <p className="text-3xl font-bold text-gray-800">{card.value}</p>
                </div>
                <div
                  className={`w-12 h-12 rounded-xl ${card.color} flex items-center justify-center group-hover:scale-110 transition-transform`}
                >
                  <Icon size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-800">توزیع وضعیت پیگیری‌ها</h2>
            <TrendingUp size={20} className="text-primary-600" />
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={statusData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12, fontFamily: 'Vazirmatn' }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  fontFamily: 'Vazirmatn',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                }}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#94a3b8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-800">آخرین هشدارها</h2>
            <button
              onClick={() => navigate('/notifications')}
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              همه
              <ArrowLeft size={14} />
            </button>
          </div>
          <div className="space-y-3">
            {userNotifications.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">هشداری وجود ندارد</p>
            ) : (
              userNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3 rounded-lg border-r-2 ${
                    notif.isRead
                      ? 'bg-gray-50 border-gray-200'
                      : 'bg-primary-50 border-primary-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <NotificationBadge level={notif.level} />
                    <span className="text-xs text-gray-400">{toJalali(notif.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{notif.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {user?.role === 'admin' && unitReports.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-800">
              عملکرد واحدها - {activePeriod?.name}
            </h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={unitReports.map((r) => ({
                name: r.unitName,
                امتیاز: r.finalScore,
              }))}
              margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: 'Vazirmatn' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  fontFamily: 'Vazirmatn',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                }}
              />
              <Bar dataKey="امتیاز" radius={[8, 8, 0, 0]} fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">آخرین پیگیری‌ها</h2>
          <button
            onClick={() => navigate('/correspondence')}
            className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            مشاهده همه
            <ArrowLeft size={14} />
          </button>
        </div>
        <div className="space-y-2">
          {items.slice(0, 5).map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => navigate('/correspondence')}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                  <FileText size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{item.subject}</p>
                  <p className="text-xs text-gray-400">
                    موعد: {toJalali(item.deadline)}
                  </p>
                </div>
              </div>
              <StatusBadge status={item.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const STATUS_LABELS_FA: Record<string, string> = {
  pending: 'در انتظار',
  in_progress: 'در جریان',
  near_deadline: 'نزدیک موعد',
  overdue: 'گذشته از موعد',
  completed: 'تکمیل‌شده',
};
