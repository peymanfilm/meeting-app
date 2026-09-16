import { NavLink, Outlet } from 'react-router-dom';
import { Users, Settings, Bell, CalendarDays, BarChart3, ShieldCheck } from 'lucide-react';

const tabs = [
  { to: '/admin/users', label: 'مدیریت کاربران', icon: Users },
  { to: '/admin/scoring', label: 'تنظیمات امتیازدهی', icon: Settings },
  { to: '/admin/alerts', label: 'تنظیمات هشدارها', icon: Bell },
  { to: '/admin/periods', label: 'دوره‌های فصلی', icon: CalendarDays },
  { to: '/admin/reports', label: 'گزارش‌های مدیریتی', icon: BarChart3 },
];

export default function AdminLayout() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-primary-700 text-white flex items-center justify-center">
          <ShieldCheck size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">پنل مدیریت</h1>
          <p className="text-sm text-gray-500">تنظیمات سامانه — فقط معاون (ادمین کل)</p>
        </div>
      </div>

      <div className="card p-2 flex gap-1 overflow-x-auto">
        {tabs.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-primary-700 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </div>

      <Outlet />
    </div>
  );
}
