import { useState } from 'react';
import { Save, BellRing, RotateCcw } from 'lucide-react';
import { useSettingsStore } from '@/stores/settingsStore';
import type { NotificationLevel } from '@/types';
import { NOTIFICATION_LEVEL_LABELS } from '@/types';

const LEVEL_DOT: Record<NotificationLevel, string> = {
  pre_warning: 'bg-success-500',
  warning: 'bg-warning-500',
  critical: 'bg-orange-500',
  overdue: 'bg-danger-500',
};

const DEFAULT_TEMPLATES: Record<NotificationLevel, string> = {
  pre_warning: '{subject} - {days} روز تا موعد',
  warning: '{subject} - {days} روز تا موعد (هشدار)',
  critical: '{subject} - امروز روز موعد است',
  overdue: '{subject} - {days} روز گذشته از موعد',
};

export default function AdminAlertsPage() {
  const { scoring, updateScoring } = useSettingsStore();
  const [preWarningDays, setPreWarningDays] = useState(scoring.preWarningDays);
  const [warningDays, setWarningDays] = useState(scoring.warningDays);
  const [templates, setTemplates] = useState(scoring.alertTemplates);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateScoring({
      preWarningDays,
      warningDays,
      alertTemplates: templates,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const resetTemplates = () => setTemplates(DEFAULT_TEMPLATES);

  const levelDescriptions: Record<NotificationLevel, string> = {
    pre_warning: `سبز — ${preWarningDays} روز مانده به موعد`,
    warning: `زرد — ${warningDays} روز مانده به موعد`,
    critical: 'نارنجی — روز موعد',
    overdue: 'قرمز — گذشته از موعد',
  };

  return (
    <div className="space-y-6">
      {/* Thresholds */}
      <div className="card p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2">
          <BellRing size={20} className="text-primary-600" />
          آستانه سطوح هشدار
        </h2>
        <p className="text-xs text-gray-400 mb-5">
          سطوح پلکانی هشدار به صورت خودکار بر اساس روزهای مانده به موعد اعمال می‌شود
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">پیش‌هشدار (روز مانده به موعد)</label>
            <input
              type="number"
              min={1}
              max={30}
              value={preWarningDays}
              onChange={(e) => setPreWarningDays(Number(e.target.value))}
              className="input"
            />
            <p className="text-xs text-gray-400 mt-1">پیش‌فرض: ۳ روز</p>
          </div>
          <div>
            <label className="label">هشدار (روز مانده به موعد)</label>
            <input
              type="number"
              min={0}
              max={10}
              value={warningDays}
              onChange={(e) => setWarningDays(Number(e.target.value))}
              className="input"
            />
            <p className="text-xs text-gray-400 mt-1">پیش‌فرض: ۱ روز</p>
          </div>
        </div>

        {/* Visual hierarchy preview */}
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {(
            ['pre_warning', 'warning', 'critical', 'overdue'] as NotificationLevel[]
          ).map((level) => (
            <div key={level} className="rounded-xl border border-gray-100 p-3 bg-gray-50/50">
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`w-3 h-3 rounded-full ${LEVEL_DOT[level]}`} />
                <span className="text-sm font-medium text-gray-700">
                  {NOTIFICATION_LEVEL_LABELS[level]}
                </span>
              </div>
              <p className="text-xs text-gray-400">{levelDescriptions[level]}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Templates */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-bold text-gray-800">پیام‌های قالب هشدارها</h2>
          <button onClick={resetTemplates} className="btn-ghost text-xs">
            <RotateCcw size={14} />
            بازگردانی پیش‌فرض
          </button>
        </div>
        <p className="text-xs text-gray-400 mb-5">
          از <code dir="ltr" className="bg-gray-100 px-1 rounded">{'{subject}'}</code> برای موضوع و{' '}
          <code dir="ltr" className="bg-gray-100 px-1 rounded">{'{days}'}</code> برای تعداد روز استفاده کنید
        </p>
        <div className="space-y-4">
          {(
            ['pre_warning', 'warning', 'critical', 'overdue'] as NotificationLevel[]
          ).map((level) => (
            <div key={level}>
              <label className="label flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${LEVEL_DOT[level]}`} />
                {NOTIFICATION_LEVEL_LABELS[level]}
              </label>
              <input
                value={templates[level]}
                onChange={(e) =>
                  setTemplates({ ...templates, [level]: e.target.value })
                }
                className="input"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={handleSave} className="btn-primary px-8">
          <Save size={18} />
          ذخیره تنظیمات
        </button>
      </div>
      {saved && (
        <p className="text-success-600 text-sm text-center animate-fade-in">
          ✓ تنظیمات با موفقیت ذخیره شد
        </p>
      )}
    </div>
  );
}
