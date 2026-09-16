import { useMemo, useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
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
import { Printer, Trophy, FileSpreadsheet } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useCorrespondenceStore } from '@/stores/correspondenceStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { calculateAllUnitReports } from '@/utils/scoring';
import { todayJalali } from '@/utils/jalali';
import { STATUS_LABELS } from '@/types';
import type { UnitReport, CorrespondenceStatus } from '@/types';

const RANK_COLORS: Record<string, string> = {
  'ممتاز': '#16a34a',
  'خوب': '#0891b2',
  'متوسط': '#ca8a04',
  'ضعیف': '#dc2626',
};

export default function ReportsPage() {
  const user = useAuthStore((s) => s.user);
  const items = useCorrespondenceStore((s) => s.items);
  const { units, periods, scoring } = useSettingsStore();
  const printRef = useRef<HTMLDivElement>(null);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(
    () => periods.find((p) => !p.isClosed)?.id || periods[0]?.id || '',
  );

  const period = periods.find((p) => p.id === selectedPeriodId);
  // Snapshot settings of the closed period take precedence (frozen scores)
  const effectiveSettings = period?.settings ?? scoring;

  const visibleItems = useMemo(() => {
    if (user?.role === 'admin') return items;
    return items.filter((i) => i.targetUnitId === user?.unitId);
  }, [items, user]);

  const reports = useMemo<UnitReport[]>(() => {
    if (!period) return [];
    if (user?.role === 'manager') {
      const unit = units.find((u) => u.id === user.unitId);
      if (!unit) return [];
      const all = calculateAllUnitReports(units, period.id, items, effectiveSettings);
      return all.filter((r) => r.unitId === unit.id);
    }
    return calculateAllUnitReports(units, period.id, items, effectiveSettings);
  }, [units, period, items, effectiveSettings, user]);

  const statusSummary = useMemo(() => {
    const counts: Record<string, number> = {};
    visibleItems
      .filter((i) => i.periodId === selectedPeriodId)
      .forEach((i) => {
        counts[i.status] = (counts[i.status] || 0) + 1;
      });
    return Object.entries(counts).map(([status, value]) => ({
      status,
      value,
      label: STATUS_LABELS[status as CorrespondenceStatus] || status,
    }));
  }, [visibleItems, selectedPeriodId]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `کارنامه-${period?.name || 'فصل'}-${todayJalali()}`,
  });

  const statusColors: Record<string, string> = {
    pending: '#94a3b8',
    in_progress: '#3b82f6',
    near_deadline: '#eab308',
    overdue: '#ef4444',
    completed: '#22c55e',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">گزارش‌ها و کارنامه فصلی</h1>
          <p className="text-gray-500 mt-1">
            {user?.role === 'admin' ? 'عملکرد همه واحدها' : 'عملکرد واحد شما'}
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedPeriodId}
            onChange={(e) => setSelectedPeriodId(e.target.value)}
            className="input w-44"
          >
            {periods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.isClosed ? '(بسته‌شده)' : '(جاری)'}
              </option>
            ))}
          </select>
          <button onClick={() => handlePrint()} className="btn-primary">
            <Printer size={18} />
            استخراج PDF
          </button>
        </div>
      </div>

      {/* Printable area */}
      <div ref={printRef} className="space-y-6">
        <div className="hidden print:block mb-4 text-center">
          <h2 className="text-xl font-bold">کارنامه فصلی واحدهای سازمانی</h2>
          <p className="text-sm text-gray-500">{period?.name} — تاریخ چاپ: {todayJalali()}</p>
        </div>

        {/* Ranking table */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={20} className="text-warning-500" />
            <h2 className="text-lg font-bold text-gray-800">
              رتبه‌بندی واحدها — {period?.name}
            </h2>
          </div>
          <div className="table-wrapper">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="sticky-table-header">
                  <tr>
                    <th className="text-right px-4 py-3 font-semibold">رتبه</th>
                    <th className="text-right px-4 py-3 font-semibold">واحد</th>
                    <th className="text-right px-4 py-3 font-semibold">کل موارد</th>
                    <th className="text-right px-4 py-3 font-semibold">به‌موقع</th>
                    <th className="text-right px-4 py-3 font-semibold">با تأخیر</th>
                    <th className="text-right px-4 py-3 font-semibold">گذشته از موعد</th>
                    <th className="text-right px-4 py-3 font-semibold">میانگین کیفیت</th>
                    <th className="text-right px-4 py-3 font-semibold">امتیاز زمان</th>
                    <th className="text-right px-4 py-3 font-semibold">امتیاز نهایی</th>
                    <th className="text-right px-4 py-3 font-semibold">رتبه کیفی</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-10 text-gray-400">
                        داده‌ای برای این فصل وجود ندارد
                      </td>
                    </tr>
                  ) : (
                    reports.map((r) => (
                      <tr
                        key={r.unitId}
                        className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <span
                            className={`w-7 h-7 rounded-full inline-flex items-center justify-center text-xs font-bold ${
                              r.rank === 1
                                ? 'bg-warning-100 text-warning-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {r.rank}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-800">{r.unitName}</td>
                        <td className="px-4 py-3 text-gray-600">{r.totalItems}</td>
                        <td className="px-4 py-3 text-success-600">{r.completedOnTime}</td>
                        <td className="px-4 py-3 text-warning-600">{r.completedLate}</td>
                        <td className="px-4 py-3 text-danger-600">{r.overdue}</td>
                        <td className="px-4 py-3 text-gray-600">{r.avgQualityScore}</td>
                        <td className="px-4 py-3 text-gray-600">{r.avgTimeScore}</td>
                        <td className="px-4 py-3 font-bold text-primary-700">{r.finalScore}</td>
                        <td className="px-4 py-3">
                          <span
                            className="badge text-white"
                            style={{ backgroundColor: RANK_COLORS[r.rankLabel] || '#94a3b8' }}
                          >
                            {r.rankLabel}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">مقایسه امتیاز واحدها</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={reports.map((r) => ({ name: r.unitName, امتیاز: r.finalScore }))}
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
                <Bar dataKey="امتیاز" radius={[8, 8, 0, 0]} fill="oklch(45% 0.15 250)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">توزیع وضعیت پیگیری‌ها</h2>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={statusSummary}
                  dataKey="value"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label
                >
                  {statusSummary.map((entry) => (
                    <Cell
                      key={entry.status}
                      fill={statusColors[entry.status] || '#94a3b8'}
                    />
                  ))}
                </Pie>
                <Legend
                  formatter={(value) => (
                    <span style={{ fontFamily: 'Vazirmatn', fontSize: 12 }}>{value}</span>
                  )}
                />
                <Tooltip
                  contentStyle={{
                    fontFamily: 'Vazirmatn',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed item table per unit (admin only) */}
        {user?.role === 'admin' && reports.length > 0 && (
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileSpreadsheet size={20} className="text-primary-600" />
              <h2 className="text-lg font-bold text-gray-800">جزئیات کارنامه واحدها</h2>
            </div>
            <div className="space-y-6">
              {reports.map((r) => (
                <div key={r.unitId}>
                  <h3 className="text-sm font-bold text-gray-700 mb-2 border-r-2 border-primary-500 pr-2">
                    {r.unitName} — امتیاز {r.finalScore} ({r.rankLabel})
                  </h3>
                  {r.items.length === 0 ? (
                    <p className="text-xs text-gray-400 px-4">موردی ثبت نشده است</p>
                  ) : (
                    <div className="table-wrapper">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="sticky-table-header">
                            <tr>
                              <th className="text-right px-3 py-2.5 font-semibold">موضوع</th>
                              <th className="text-right px-3 py-2.5 font-semibold">مهلت</th>
                              <th className="text-right px-3 py-2.5 font-semibold">وضعیت</th>
                            </tr>
                          </thead>
                          <tbody>
                            {r.items.map((item) => (
                              <tr key={item.id} className="border-b border-gray-50">
                                <td className="px-3 py-2.5 text-gray-700">{item.subject}</td>
                                <td className="px-3 py-2.5 text-gray-500 text-xs">
                                  {new Date(item.deadline).toLocaleDateString('fa-IR')}
                                </td>
                                <td className="px-3 py-2.5 text-xs">
                                  {STATUS_LABELS[item.status]}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
