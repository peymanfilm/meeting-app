import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { AlertOctagon, Trophy, TrendingUp, BarChart3 } from 'lucide-react';
import { useCorrespondenceStore } from '@/stores/correspondenceStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { calculateAllUnitReports } from '@/utils/scoring';
import { daysUntilDeadline, toJalali } from '@/utils/jalali';
import { CORRESPONDENCE_TYPE_LABELS } from '@/types';

const UNIT_COLORS = ['#1d4ed8', '#0891b2', '#16a34a', '#ca8a04', '#dc2626'];

export default function AdminReportsPage() {
  const items = useCorrespondenceStore((s) => s.items);
  const { units, periods, scoring } = useSettingsStore();
  const [periodId, setPeriodId] = useState(
    () => periods.find((p) => !p.isClosed)?.id || periods[0]?.id || '',
  );

  const period = periods.find((p) => p.id === periodId);
  const effectiveSettings = period?.settings ?? scoring;

  const reports = useMemo(
    () =>
      period
        ? calculateAllUnitReports(units, period.id, items, effectiveSettings)
        : [],
    [units, period, items, effectiveSettings],
  );

  // Multi-period trend data (one line per unit)
  const trendData = useMemo(() => {
    const sorted = [...periods].sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    );
    return sorted.map((p) => {
      const rs = calculateAllUnitReports(units, p.id, items, p.settings ?? scoring);
      const row: Record<string, string | number> = { name: p.name };
      rs.forEach((r) => {
        row[r.unitName] = r.finalScore;
      });
      return row;
    });
  }, [periods, units, items, scoring]);

  // Overdue items grouped by unit
  const overdueByUnit = useMemo(() => {
    return units
      .map((u) => ({
        unit: u,
        items: items.filter(
          (i) => i.targetUnitId === u.id && i.periodId === periodId && i.status === 'overdue',
        ),
      }))
      .filter((g) => g.items.length > 0);
  }, [units, items, periodId]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <BarChart3 size={20} className="text-primary-600" />
            گزارش‌های مدیریتی
          </h2>
          <p className="text-xs text-gray-400 mt-1">مقایسه عملکرد واحدها و روند فصول</p>
        </div>
        <select value={periodId} onChange={(e) => setPeriodId(e.target.value)} className="input w-44">
          {periods.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} {p.isClosed ? '(بسته‌شده)' : '(جاری)'}
            </option>
          ))}
        </select>
      </div>

      {/* Unit comparison for selected period */}
      <div className="card p-6">
        <h3 className="font-bold text-gray-800 mb-4">
          مقایسه عملکرد واحدها — {period?.name}
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={reports.map((r) => ({
              name: r.unitName,
              امتیاز: r.finalScore,
              کیفیت: r.avgQualityScore,
              زمان: r.avgTimeScore,
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
            <Legend formatter={(v) => <span style={{ fontFamily: 'Vazirmatn', fontSize: 12 }}>{v}</span>} />
            <Bar dataKey="امتیاز" fill={UNIT_COLORS[0]} radius={[6, 6, 0, 0]} />
            <Bar dataKey="کیفیت" fill={UNIT_COLORS[1]} radius={[6, 6, 0, 0]} />
            <Bar dataKey="زمان" fill={UNIT_COLORS[2]} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Trend across periods */}
      <div className="card p-6">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <TrendingUp size={18} className="text-primary-600" />
          روند امتیاز واحدها در فصول مختلف
        </h3>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={trendData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
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
            <Legend formatter={(v) => <span style={{ fontFamily: 'Vazirmatn', fontSize: 12 }}>{v}</span>} />
            {units.map((u, idx) => (
              <Line
                key={u.id}
                type="monotone"
                dataKey={u.name}
                stroke={UNIT_COLORS[idx % UNIT_COLORS.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Overdue items by unit */}
      <div className="card p-6">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <AlertOctagon size={18} className="text-danger-500" />
          موارد گذشته از موعد به تفکیک واحد
        </h3>
        {overdueByUnit.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">
            در این فصل مورد گذشته از موعدی وجود ندارد ✓
          </p>
        ) : (
          <div className="space-y-5">
            {overdueByUnit.map(({ unit, items: overdueItems }) => (
              <div key={unit.id}>
                <h4 className="text-sm font-bold text-gray-700 mb-2 border-r-2 border-danger-500 pr-2">
                  {unit.name} ({overdueItems.length} مورد)
                </h4>
                <div className="table-wrapper">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky-table-header">
                        <tr>
                          <th className="text-right px-4 py-2.5 font-semibold">نوع</th>
                          <th className="text-right px-4 py-2.5 font-semibold">موضوع</th>
                          <th className="text-right px-4 py-2.5 font-semibold">مهلت</th>
                          <th className="text-right px-4 py-2.5 font-semibold">تأخیر</th>
                        </tr>
                      </thead>
                      <tbody>
                        {overdueItems.map((i) => (
                          <tr key={i.id} className="border-b border-gray-50">
                            <td className="px-4 py-2.5 text-xs text-gray-500">
                              {CORRESPONDENCE_TYPE_LABELS[i.type]}
                            </td>
                            <td className="px-4 py-2.5 text-gray-700">{i.subject}</td>
                            <td className="px-4 py-2.5 text-gray-500 text-xs">
                              {toJalali(i.deadline)}
                            </td>
                            <td className="px-4 py-2.5 text-danger-600 text-xs font-medium">
                              {Math.abs(daysUntilDeadline(i.deadline))} روز
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Final ranking */}
      <div className="card p-6">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Trophy size={18} className="text-warning-500" />
          جدول رتبه‌بندی نهایی — {period?.name}
        </h3>
        <div className="table-wrapper">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky-table-header">
                <tr>
                  <th className="text-right px-4 py-3 font-semibold">رتبه</th>
                  <th className="text-right px-4 py-3 font-semibold">واحد</th>
                  <th className="text-right px-4 py-3 font-semibold">امتیاز نهایی</th>
                  <th className="text-right px-4 py-3 font-semibold">رتبه کیفی</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.unitId} className="border-b border-gray-50">
                    <td className="px-4 py-3 font-bold text-gray-700">{r.rank}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{r.unitName}</td>
                    <td className="px-4 py-3 font-bold text-primary-700">{r.finalScore}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`badge ${
                          r.rankLabel === 'ممتاز'
                            ? 'bg-success-100 text-success-700'
                            : r.rankLabel === 'خوب'
                              ? 'bg-primary-100 text-primary-700'
                              : r.rankLabel === 'متوسط'
                                ? 'bg-warning-100 text-warning-700'
                                : 'bg-danger-100 text-danger-700'
                        }`}
                      >
                        {r.rankLabel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
