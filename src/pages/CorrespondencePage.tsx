import { useState, useMemo } from 'react';
import {
  Plus,
  Filter,
  Eye,
  CheckCircle2,
  Trash2,
  X,
  FileText,
  Paperclip,
} from 'lucide-react';
import { useCorrespondenceStore } from '@/stores/correspondenceStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAuthStore } from '@/stores/authStore';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badges';
import CorrespondenceForm from '@/components/correspondence/CorrespondenceForm';
import CompleteModal from '@/components/correspondence/CompleteModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Modal from '@/components/ui/Modal';
import { toJalali, daysUntilDeadline } from '@/utils/jalali';
import { CORRESPONDENCE_TYPE_LABELS } from '@/types';
import type { CorrespondenceItem, CorrespondenceType, CorrespondenceStatus } from '@/types';

const rowColors: Record<CorrespondenceStatus, string> = {
  pending: 'bg-white',
  in_progress: 'bg-white',
  near_deadline: 'bg-warning-50',
  overdue: 'bg-danger-50',
  completed: 'bg-success-50',
};

interface CorrespondencePageProps {
  defaultType?: CorrespondenceType | 'all';
  /** When provided (e.g. orders route), restricts the module to these types */
  defaultTypes?: CorrespondenceType[];
  title?: string;
}

export default function CorrespondencePage({
  defaultType = 'all',
  defaultTypes,
  title,
}: CorrespondencePageProps) {
  const { items, filters, setFilters, deleteItem } = useCorrespondenceStore();
  const { units } = useSettingsStore();
  const user = useAuthStore((s) => s.user);

  const [showForm, setShowForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [viewItem, setViewItem] = useState<CorrespondenceItem | null>(null);
  const [completeItem, setCompleteItem] = useState<CorrespondenceItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (user?.role === 'manager' && item.targetUnitId !== user.unitId) return false;
      if (defaultTypes && !defaultTypes.includes(item.type)) return false;
      if (filters.type !== 'all' && item.type !== filters.type) return false;
      if (filters.unitId !== 'all' && item.targetUnitId !== filters.unitId) return false;
      if (filters.status !== 'all' && item.status !== filters.status) return false;
      if (filters.dateFrom && new Date(item.issueDate) < new Date(filters.dateFrom)) return false;
      if (filters.dateTo && new Date(item.issueDate) > new Date(filters.dateTo)) return false;
      return true;
    });
  }, [items, filters, user, defaultTypes]);

  const pageTitle = title || 'مدیریت مکاتبات و پیگیری‌ها';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{pageTitle}</h1>
          <p className="text-gray-500 mt-1">{filteredItems.length} مورد یافت شد</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary"
          >
            <Filter size={18} />
            فیلترها
          </button>
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <Plus size={18} />
            ثبت جدید
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="card p-4 animate-slide-in">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">فیلترها</h3>
            <button
              onClick={() => setFilters({ type: 'all', unitId: 'all', status: 'all', dateFrom: null, dateTo: null })}
              className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <X size={14} />
              پاک کردن
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="label">نوع</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ type: e.target.value as CorrespondenceType | 'all' })}
                className="input"
              >
                <option value="all">همه</option>
                {(defaultTypes
                  ? (Object.entries(CORRESPONDENCE_TYPE_LABELS) as [CorrespondenceType, string][]).filter(
                      ([val]) => defaultTypes.includes(val),
                    )
                  : Object.entries(CORRESPONDENCE_TYPE_LABELS)
                ).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">واحد</label>
              <select
                value={filters.unitId}
                onChange={(e) => setFilters({ unitId: e.target.value })}
                className="input"
              >
                <option value="all">همه</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">وضعیت</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ status: e.target.value as CorrespondenceStatus | 'all' })}
                className="input"
              >
                <option value="all">همه</option>
                <option value="pending">در انتظار</option>
                <option value="in_progress">در جریان</option>
                <option value="near_deadline">نزدیک موعد</option>
                <option value="overdue">گذشته از موعد</option>
                <option value="completed">تکمیل‌شده</option>
              </select>
            </div>
            <div>
              <label className="label">از تاریخ</label>
              <input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => setFilters({ dateFrom: e.target.value || null })}
                className="input"
              />
            </div>
            <div>
              <label className="label">تا تاریخ</label>
              <input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => setFilters({ dateTo: e.target.value || null })}
                className="input"
              />
            </div>
          </div>
        </div>
      )}

      <div className="table-wrapper">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky-table-header">
              <tr>
                <th className="text-right px-4 py-3 font-semibold">شناسه</th>
                <th className="text-right px-4 py-3 font-semibold">نوع</th>
                <th className="text-right px-4 py-3 font-semibold">موضوع</th>
                <th className="text-right px-4 py-3 font-semibold">واحد مخاطب</th>
                <th className="text-right px-4 py-3 font-semibold">مهلت</th>
                <th className="text-right px-4 py-3 font-semibold">اولویت</th>
                <th className="text-right px-4 py-3 font-semibold">وضعیت</th>
                <th className="text-center px-4 py-3 font-semibold">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">
                    موردی یافت نشد
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const unit = units.find((u) => u.id === item.targetUnitId);
                  const daysLeft = daysUntilDeadline(item.deadline);
                  return (
                    <tr
                      key={item.id}
                      className={`${rowColors[item.status]} border-b border-gray-50 hover:bg-gray-50/50 transition-colors`}
                    >
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                        {item.referenceNumber || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-600">
                          {CORRESPONDENCE_TYPE_LABELS[item.type]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {item.attachmentPath && (
                            <Paperclip size={14} className="text-gray-400 shrink-0" />
                          )}
                          <span className="font-medium text-gray-800 truncate max-w-[200px]">
                            {item.subject}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{unit?.name || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-gray-700">{toJalali(item.deadline)}</span>
                          {item.status !== 'completed' && (
                            <span className={`text-xs ${daysLeft < 0 ? 'text-danger-600' : daysLeft <= 1 ? 'text-warning-600' : 'text-gray-400'}`}>
                              {daysLeft < 0 ? `${Math.abs(daysLeft)} روز تأخیر` : `${daysLeft} روز مانده`}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3"><PriorityBadge priority={item.priority} /></td>
                      <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setViewItem(item)}
                            className="p-1.5 rounded-lg hover:bg-primary-50 text-gray-500 hover:text-primary-600 transition-colors"
                            title="مشاهده"
                          >
                            <Eye size={16} />
                          </button>
                          {item.status !== 'completed' && (
                            <button
                              onClick={() => setCompleteItem(item)}
                              className="p-1.5 rounded-lg hover:bg-success-50 text-gray-500 hover:text-success-600 transition-colors"
                              title="ثبت پاسخ"
                            >
                              <CheckCircle2 size={16} />
                            </button>
                          )}
                          {user?.role === 'admin' && (
                            <button
                              onClick={() => setDeleteId(item.id)}
                              className="p-1.5 rounded-lg hover:bg-danger-50 text-gray-500 hover:text-danger-600 transition-colors"
                              title="حذف"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CorrespondenceForm
        open={showForm}
        onClose={() => setShowForm(false)}
        defaultType={
          defaultType === 'all' ? (defaultTypes ? defaultTypes[0] : 'correspondence') : defaultType
        }
      />

      <CompleteModal
        open={!!completeItem}
        onClose={() => setCompleteItem(null)}
        item={completeItem}
      />

      <Modal open={!!viewItem} onClose={() => setViewItem(null)} title="جزئیات پیگیری" size="lg">
        {viewItem && <CorrespondenceDetail item={viewItem} />}
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteItem(deleteId)}
        title="حذف پیگیری"
        message="آیا از حذف این پیگیری اطمینان دارید؟ این عملیات قابل بازگشت نیست."
        confirmLabel="حذف"
      />
    </div>
  );
}

function CorrespondenceDetail({ item }: { item: CorrespondenceItem }) {
  const { units } = useSettingsStore();
  const unit = units.find((u) => u.id === item.targetUnitId);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
        <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
          <FileText size={24} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-800">{item.subject}</h3>
          <p className="text-sm text-gray-500">{CORRESPONDENCE_TYPE_LABELS[item.type]} - {item.referenceNumber || 'بدون شماره'}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <DetailField label="صادرکننده" value={item.issuerName} />
        <DetailField label="واحد مخاطب" value={unit?.name || '—'} />
        <DetailField label="تاریخ صدور" value={toJalali(item.issueDate)} />
        <DetailField label="مهلت اجرا" value={toJalali(item.deadline)} />
        <DetailField label="اولویت" value={item.priority === 'urgent' ? 'فوری' : item.priority === 'important' ? 'مهم' : 'عادی'} />
        <DetailField label="وضعیت" value={item.status === 'completed' ? 'تکمیل‌شده' : item.status === 'overdue' ? 'گذشته از موعد' : item.status === 'near_deadline' ? 'نزدیک موعد' : item.status === 'in_progress' ? 'در جریان' : 'در انتظار'} />
      </div>

      <div>
        <p className="text-sm font-semibold text-gray-700 mb-1">شرح</p>
        <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-lg p-3">{item.description}</p>
      </div>

      {item.responseDescription && (
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-1">پاسخ</p>
          <p className="text-sm text-gray-600 leading-relaxed bg-success-50 rounded-lg p-3">{item.responseDescription}</p>
        </div>
      )}

      {item.attachmentPath && (
        <div className="flex items-center gap-2 text-sm text-primary-600 bg-primary-50 rounded-lg p-3">
          <Paperclip size={16} />
          {item.attachmentPath}
        </div>
      )}
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-gray-700">{value}</p>
    </div>
  );
}
