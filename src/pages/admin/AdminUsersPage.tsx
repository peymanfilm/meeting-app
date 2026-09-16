import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Pencil, Power, KeyRound, Trash2, Building2 } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAuthStore } from '@/stores/authStore';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { ROLE_LABELS } from '@/types';
import type { User } from '@/types';

const userSchema = z.object({
  firstName: z.string().min(2, 'نام الزامی است'),
  lastName: z.string().min(2, 'نام‌خانوادگی الزامی است'),
  username: z.string().min(3, 'نام کاربری حداقل ۳ کاراکتر').regex(/^[a-zA-Z0-9_.]+$/, 'فقط حروف لاتین، عدد، نقطه و زیرخط'),
  password: z.string().min(6, 'رمز حداقل ۶ کاراکتر').or(z.literal('')),
  unitId: z.string().min(1, 'واحد سازمانی الزامی است'),
  role: z.enum(['admin', 'manager']),
});

type UserFormData = z.infer<typeof userSchema>;

export default function AdminUsersPage() {
  const { users, units, addUser, updateUser, deleteUser, resetPassword, renameUnit } =
    useSettingsStore();
  const currentUser = useAuthStore((s) => s.user);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [resetId, setResetId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [unitEdits, setUnitEdits] = useState<Record<string, string>>({});

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: { role: 'manager' },
  });

  const openNew = () => {
    setEditing(null);
    reset({ firstName: '', lastName: '', username: '', password: '', unitId: units[0]?.id || '', role: 'manager' });
    setShowForm(true);
  };

  const openEdit = (u: User) => {
    setEditing(u);
    reset({
      firstName: u.firstName,
      lastName: u.lastName,
      username: u.username,
      password: '',
      unitId: u.unitId,
      role: u.role,
    });
    setShowForm(true);
  };

  const onSubmit = (data: UserFormData) => {
    if (editing) {
      updateUser(editing.id, {
        firstName: data.firstName,
        lastName: data.lastName,
        username: data.username,
        unitId: data.unitId,
        role: data.role,
      });
    } else {
      if (data.password.length < 6) {
        setError('password', { message: 'رمز حداقل ۶ کاراکتر' });
        return;
      }
      addUser({ ...data, isActive: true });
    }
    setShowForm(false);
  };

  const handleToggleActive = (u: User) => {
    if (u.id === currentUser?.id) return; // cannot deactivate self
    updateUser(u.id, { isActive: !u.isActive });
  };

  const handleResetPassword = () => {
    if (resetId && newPassword.length >= 6) {
      resetPassword(resetId, newPassword);
      setResetId(null);
      setNewPassword('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Organizational units */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Building2 size={20} className="text-primary-600" />
          <h2 className="text-lg font-bold text-gray-800">واحدهای سازمانی</h2>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          نام واحدها قابل تنظیم است (کد واحدها ثابت است)
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {units.map((u) => (
            <div key={u.id} className="flex items-center gap-2">
              <input
                value={unitEdits[u.id] ?? u.name}
                onChange={(e) => setUnitEdits({ ...unitEdits, [u.id]: e.target.value })}
                className="input"
              />
              <button
                onClick={() => {
                  const name = (unitEdits[u.id] ?? u.name).trim();
                  if (name && name !== u.name) {
                    renameUnit(u.id, name);
                  }
                }}
                className="btn-ghost shrink-0 px-3"
                title="ذخیره نام"
              >
                <Pencil size={15} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Users table */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-lg font-bold text-gray-800">کاربران سامانه ({users.length})</h2>
        <button onClick={openNew} className="btn-primary">
          <Plus size={18} />
          افزودن کاربر
        </button>
      </div>

      <div className="table-wrapper">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky-table-header">
              <tr>
                <th className="text-right px-4 py-3 font-semibold">نام و نام‌خانوادگی</th>
                <th className="text-right px-4 py-3 font-semibold">نام کاربری</th>
                <th className="text-right px-4 py-3 font-semibold">واحد سازمانی</th>
                <th className="text-right px-4 py-3 font-semibold">نقش</th>
                <th className="text-right px-4 py-3 font-semibold">وضعیت</th>
                <th className="text-center px-4 py-3 font-semibold">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const unit = units.find((x) => x.id === u.unitId);
                const isSelf = u.id === currentUser?.id;
                return (
                  <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {u.firstName} {u.lastName}
                      {isSelf && <span className="text-xs text-gray-400"> (شما)</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">{u.username}</td>
                    <td className="px-4 py-3 text-gray-600">{unit?.name || '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`badge ${
                          u.role === 'admin'
                            ? 'bg-primary-100 text-primary-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {ROLE_LABELS[u.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`badge ${
                          u.isActive
                            ? 'bg-success-100 text-success-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {u.isActive ? 'فعال' : 'غیرفعال'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEdit(u)}
                          className="p-1.5 rounded-lg hover:bg-primary-50 text-gray-500 hover:text-primary-600 transition-colors"
                          title="ویرایش"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleToggleActive(u)}
                          disabled={isSelf}
                          className="p-1.5 rounded-lg hover:bg-warning-50 text-gray-500 hover:text-warning-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title={u.isActive ? 'غیرفعال‌سازی' : 'فعال‌سازی'}
                        >
                          <Power size={16} />
                        </button>
                        <button
                          onClick={() => setResetId(u.id)}
                          className="p-1.5 rounded-lg hover:bg-accent-50 text-gray-500 hover:text-accent-600 transition-colors"
                          title="ریست رمز عبور"
                        >
                          <KeyRound size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteId(u.id)}
                          disabled={isSelf}
                          className="p-1.5 rounded-lg hover:bg-danger-50 text-gray-500 hover:text-danger-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title="حذف"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editing ? 'ویرایش کاربر' : 'افزودن کاربر جدید'}
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">نام</label>
              <input {...register('firstName')} className={`input ${errors.firstName ? 'input-error' : ''}`} />
              {errors.firstName && <p className="text-danger-600 text-xs mt-1">{errors.firstName.message}</p>}
            </div>
            <div>
              <label className="label">نام‌خانوادگی</label>
              <input {...register('lastName')} className={`input ${errors.lastName ? 'input-error' : ''}`} />
              {errors.lastName && <p className="text-danger-600 text-xs mt-1">{errors.lastName.message}</p>}
            </div>
            <div>
              <label className="label">نام کاربری</label>
              <input
                {...register('username')}
                dir="ltr"
                className={`input text-left ${errors.username ? 'input-error' : ''}`}
              />
              {errors.username && <p className="text-danger-600 text-xs mt-1">{errors.username.message}</p>}
            </div>
            <div>
              <label className="label">{editing ? 'رمز (فقط برای ریست)' : 'رمز عبور'}</label>
              <input
                {...register('password')}
                dir="ltr"
                type="password"
                disabled={!!editing}
                className={`input text-left ${errors.password ? 'input-error' : ''} ${editing ? 'opacity-50' : ''}`}
              />
              {errors.password && <p className="text-danger-600 text-xs mt-1">{errors.password.message}</p>}
            </div>
            <div>
              <label className="label">واحد سازمانی</label>
              <select {...register('unitId')} className="input">
                {units.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">نقش</label>
              <select {...register('role')} className="input">
                <option value="manager">مدیر کل</option>
                <option value="admin">معاون (ادمین کل)</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">
              انصراف
            </button>
            <button type="submit" className="btn-primary flex-1">
              {editing ? 'ذخیره تغییرات' : 'افزودن'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Reset password modal */}
      <Modal
        open={!!resetId}
        onClose={() => setResetId(null)}
        title="ریست رمز عبور"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="label">رمز عبور جدید (حداقل ۶ کاراکتر)</label>
            <input
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              dir="ltr"
              type="password"
              className="input text-left"
            />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setResetId(null)} className="btn-secondary flex-1">
              انصراف
            </button>
            <button onClick={handleResetPassword} className="btn-primary flex-1" disabled={newPassword.length < 6}>
              تغییر رمز
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteUser(deleteId)}
        title="حذف کاربر"
        message="آیا از حذف این کاربر اطمینان دارید؟ این عملیات قابل بازگشت نیست."
        confirmLabel="حذف"
      />
    </div>
  );
}
