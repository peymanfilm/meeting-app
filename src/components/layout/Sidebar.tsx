import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  ClipboardCheck,
  Megaphone,
  Users,
  Bell,
  BarChart3,
  Settings,
  CalendarDays,
  ChevronLeft,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';

const mainNav = [
  { to: '/dashboard', label: 'داشبورد', icon: LayoutDashboard },
  { to: '/correspondence', label: 'مدیریت مکاتبات', icon: FileText },
  { to: '/decisions', label: 'مصوبات', icon: ClipboardCheck },
  { to: '/orders', label: 'دستورات و ابلاغیه‌ها', icon: Megaphone },
  { to: '/meetings', label: 'جلسات', icon: CalendarDays },
  { to: '/reports', label: 'گزارش‌ها و کارنامه', icon: BarChart3 },
  { to: '/notifications', label: 'اعلان‌ها', icon: Bell },
];

const adminNav = [
  { to: '/admin/users', label: 'مدیریت کاربران', icon: Users },
  { to: '/admin/scoring', label: 'تنظیمات امتیازدهی', icon: Settings },
  { to: '/admin/alerts', label: 'تنظیمات هشدارها', icon: Bell },
  { to: '/admin/periods', label: 'دوره‌های فصلی', icon: CalendarDays },
  { to: '/admin/reports', label: 'گزارش‌های مدیریتی', icon: BarChart3 },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const user = useAuthStore((s) => s.user);
  const unreadCount = useNotificationStore((s) =>
    user ? s.getUnreadCount(user.id) : 0,
  );

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `nav-item ${isActive ? 'nav-item-active' : 'nav-item-inactive'}`;

  return (
    <aside
      className={`${
        collapsed ? 'w-20' : 'w-72'
      } bg-white border-l border-gray-200 flex flex-col transition-all duration-300 shrink-0 h-screen sticky top-0`}
    >
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary-700 flex items-center justify-center text-white shrink-0">
              <FileText size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-gray-800 leading-tight">
                سامانه مدیریت
              </span>
              <span className="text-xs text-gray-500 leading-tight">
                جلسات و مکاتبات
              </span>
            </div>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <ChevronLeft
            size={18}
            className={`transition-transform ${collapsed ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {!collapsed && (
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
            منوی اصلی
          </p>
        )}
        {mainNav.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink key={item.to} to={item.to} className={navItemClass} end>
              <Icon size={20} className="shrink-0" />
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && item.to === '/notifications' && unreadCount > 0 && (
                <span className="mr-auto bg-danger-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </NavLink>
          );
        })}

        {user?.role === 'admin' && (
          <>
            <div className="pt-4">
              {!collapsed && (
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
                  پنل مدیریت
                </p>
              )}
              {collapsed && <div className="border-t border-gray-100 mx-2 my-2" />}
            </div>
            {adminNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink key={item.to} to={item.to} className={navItemClass} end>
                  <Icon size={20} className="shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              );
            })}
          </>
        )}
      </nav>

      {!collapsed && (
        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-gray-50">
            <div className="w-9 h-9 rounded-full bg-primary-700 text-white flex items-center justify-center text-sm font-bold shrink-0">
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium text-gray-800 truncate">
                {user?.firstName} {user?.lastName}
              </span>
              <span className="text-xs text-gray-500 truncate">
                {user?.role === 'admin' ? 'معاون (ادمین کل)' : 'مدیر کل'}
              </span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
