import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Lock, FileBadge, CalendarRange, Snowflake } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSettingsStore } from '@/stores/settingsStore';
import { useCorrespondenceStore } from '@/stores/correspondenceStore';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { jalaliDateSchema } from '@/utils/schemas';
import { jalaliToIso, parseJalali } from '@/utils/jalali';
import { toGregorian } from 'jalaali-js';
import { calculateAllUnitReports } from '@/utils/scoring';
import type { Period } from '@/types';

const periodSchema = z
  .object({
    name: z.string().min(3, 'نام فصل الزامی است'),
    startDate: jalaliDateSchema,
    endDate: jalaliDateSchema,
  })
  .refine(
    (d) => {
      const s = parseJalali(d.startDate);
      const e = parseJalali(d.endDate);
      if (!s || !e) return true;
      const gs = toGregorian(s.jy, s.jm, s.jd);
      const ge = toGregorian(e.jy, e.jm, e.jd);
      return new Date(ge.gy, ge.gm - 1, ge.gd) > new Date(gs.gy, gs.gm - 1, gs.gd);
    },
    { message: 'تاریخ پایان باید بعد از شروع باشد', path: ['endDate'] },
  );

type PeriodFormData = z.infer<typeof periodSchema>;

export default function AdminPeriodsPage() {
  const { periods, addPeriod, closePeriod, units, scoring } = useSettingsStore();
  const items = useCorrespondenceStore((s) => s.items);

  const [showForm, setShowForm] = useState(false);
  const [closingPeriod, setClosingPeriod] = useState<Period | null>(null);
  const [viewingReport, setViewingReport] = useState<Period | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PeriodFormData>({ resolver: zodResolver(periodSchema) });

  const sortedPeriods = [...periods].sort((a, b) =>
    new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
  );

  const onSubmit = (data: PeriodFormData) => {
    addPeriod({
      name: data.name,
      startDate: jalaliToIso(data.startDate),
      endDate: jalaliToIso(data.endDate),
    });
    setShowForm(false);
    reset();
  };

  const handleConfirmClose = () => {
    if (closingPeriod) closePeriod(closingPeriod.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-800">دوره‌های ارزیابی فصلی</h2>
          <p className="text-xs text-gray-400 mt-1">
            بستن فصل، امتیازات را با تنظیمات لحظه بستن فریز می‌کند
          </p>
        </div>
        <button
          onClick={() => {
            reset();
            setShowForm(true);
          }}
          className="btn-primary"
        >
          <Plus size={18} />
          فصل جدید
        </button>
      </div>

      <div className="space-y-4">
        {sortedPeriods.map((p) => {
          const reportSettings = p.settings ?? scoring;
          const reports = calculateAllUnitReports(units, p.id, items, reportSettings);
          const totalItems = reports.reduce((acc, r) => acc + r.totalItems, 0);
          const topUnit = reports[0];
          return (
            <div key={p.id} className="card p-5">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                      p.isClosed ? 'bg-gray-100 text-gray-500' : 'bg-success-100 text-success-700'
                    }`}
                  >
                    {p.isClosed ? <Snowflake size={20} /> : <CalendarRange size={20} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-800">{p.name}</h3>
                      <span
                        className={`badge ${
                          p.isClosed
                            ? 'bg-gray-100 text-gray-500'
                            : 'bg-success-100 text-success-700'
                        }`}
                      >
                        {p.isClosed ? 'بسته‌شده (فریز)' : 'جاری'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {totalItems} پیگیری ثبت‌شده در این فصل
                      {topUnit && topUnit.totalItems > 0
                        ? ` — صدرنشین: ${topUnit.unitName} (${topUnit.finalScore})`
                        : ''}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setViewingReport(p)} className="btn-ghost text-sm">
                    <FileBadge size={16} />
                    مشاهده کارنامه
                  </button>
                  {!p.isClosed && (
                    <button
                      onClick={() => setClosingPeriod(p)}
                      className="btn-danger text-sm"
                    >
                      <Lock size={16} />
                      بستن فصل
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="ایجاد فصل جدید" size="sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">نام فصل</label>
            <input
              {...register('name')}
              className={`input ${errors.name ? 'input-error' : ''}`}
              placeholder="مثلاً فصل زمستان ۱۴۰۴"
            />
            {errors.name && <p className="text-danger-600 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="label">تاریخ شروع (جلالی)</label>
            <input
              {...register('startDate')}
              className={`input ${errors.startDate ? 'input-error' : ''}`}
              placeholder="۱۴۰۴/۱۰/۰۱"
            />
            {errors.startDate && (
              <p className="text-danger-600 text-xs mt-1">{errors.startDate.message}</p>
            )}
          </div>
          <div>
            <label className="label">تاریخ پایان (جلالی)</label>
            <input
              {...register('endDate')}
              className={`input ${errors.endDate ? 'input-error' : ''}`}
              placeholder="۱۴۰۴/۱۲/۲۹"
            />
            {errors.endDate && (
              <p className="text-danger-600 text-xs mt-1">{errors.endDate.message}</p>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">
              انصراف
            </button>
            <button type="submit" className="btn-primary flex-1">
              ایجاد فصل
            </button>
          </div>
        </form>
      </Modal>

      {/* Close confirm */}
      <ConfirmDialog
        open={!!closingPeriod}
        onClose={() => setClosingPeriod(null)}
        onConfirm={handleConfirmClose}
        title="بستن فصل"
        message={`آیا از بستن «${closingPeriod?.name}» اطمینان دارید؟ پس از بستن، امتیازات فریز شده و دیگر قابل تغییر نخواهند بود.`}
        confirmLabel="بستن فصل"
      />

      {/* Report view */}
      <Modal
        open={!!viewingReport}
        onClose={() => setViewingReport(null)}
        title={`کارنامه ${viewingReport?.name || ''}`}
        size="lg"
      >
        {viewingReport && (
          <div className="table-wrapper">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="sticky-table-header">
                  <tr>
                    <th className="text-right px-4 py-3 font-semibold">رتبه</th>
                    <th className="text-right px-4 py-3 font-semibold">واحد</th>
                    <th className="text-right px-4 py-3 font-semibold">کل</th>
                    <th className="text-right px-4 py-3 font-semibold">به‌موقع</th>
                    <th className="text-right px-4 py-3 font-semibold">با تأخیر</th>
                    <th className="text-right px-4 py-3 font-semibold">گذشته</th>
                    <th className="text-right px-4 py-3 font-semibold">امتیاز</th>
                    <th className="text-right px-4 py-3 font-semibold">رتبه کیفی</th>
                  </tr>
                </thead>
                <tbody>
                  {calculateAllUnitReports(
                    units,
                    viewingReport.id,
                    items,
                    viewingReport.settings ?? scoring,
                  ).map((r) => (
                    <tr key={r.unitId} className="border-b border-gray-50">
                      <td className="px-4 py-3 text-gray-600">{r.rank}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{r.unitName}</td>
                      <td className="px-4 py-3 text-gray-600">{r.totalItems}</td>
                      <td className="px-4 py-3 text-success-600">{r.completedOnTime}</td>
                      <td className="px-4 py-3 text-warning-600">{r.completedLate}</td>
                      <td className="px-4 py-3 text-danger-600">{r.overdue}</td>
                      <td className="px-4 py-3 font-bold text-primary-700">{r.finalScore}</td>
                      <td className="px-4 py-3 text-gray-600">{r.rankLabel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
