import { useNavigate } from 'react-router-dom';
import { Bell, LogOut, Search, Menu } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useSettingsStore } from '@/stores/settingsStore';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const unreadCount = useNotificationStore((s) =>
    user ? s.getUnreadCount(user.id) : 0,
  );
  const units = useSettingsStore((s) => s.units);
  const userUnit = units.find((u) => u.id === user?.unitId);

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors lg:hidden"
          title="منو"
        >
          <Menu size={22} />
        </button>
        <div className="relative hidden md:block">
          <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="جستجو..."
            className="input pr-10 w-64 text-sm py-2"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/notifications')}
          className="relative p-2.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
        >
          <Bell size={22} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -left-0.5 bg-danger-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-medium">
              {unreadCount}
            </span>
          )}
        </button>

        <div className="h-8 w-px bg-gray-200" />

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-800">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-500">{userUnit?.name}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary-700 text-white flex items-center justify-center text-sm font-bold">
            {user?.firstName?.[0]}
            {user?.lastName?.[0]}
          </div>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="p-2.5 rounded-lg hover:bg-danger-50 text-gray-500 hover:text-danger-600 transition-colors"
            title="خروج"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
