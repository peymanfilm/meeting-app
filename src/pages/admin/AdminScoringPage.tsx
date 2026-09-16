import { useState } from 'react';
import { Save, Percent, Timer, Award, Calculator } from 'lucide-react';
import { useSettingsStore } from '@/stores/settingsStore';
import { QUALITY_INDICATOR_LABELS } from '@/types';

export default function AdminScoringPage() {
  const { scoring, updateScoring } = useSettingsStore();
  const [saved, setSaved] = useState(false);

  const [qualityWeight, setQualityWeight] = useState(scoring.qualityWeightPercent);
  const [timeWeight, setTimeWeight] = useState(scoring.timeWeightPercent);
  const [completeness, setCompleteness] = useState(scoring.qualityIndicatorWeights.completeness);
  const [accuracy, setAccuracy] = useState(scoring.qualityIndicatorWeights.accuracy);
  const [documentation, setDocumentation] = useState(scoring.qualityIndicatorWeights.documentation);
  const [onTimePenalty, setOnTimePenalty] = useState(scoring.penaltyConfig.onTimePenalty);
  const [late1to3, setLate1to3] = useState(scoring.penaltyConfig.late1to3Penalty);
  const [lateOver3, setLateOver3] = useState(scoring.penaltyConfig.lateOver3Penalty);
  const [thresholds, setThresholds] = useState(scoring.rankThresholds);

  const weightSum = qualityWeight + timeWeight;
  const qualitySum = completeness + accuracy + documentation;

  const handleSave = () => {
    updateScoring({
      qualityWeightPercent: qualityWeight,
      timeWeightPercent: timeWeight,
      qualityIndicatorWeights: { completeness, accuracy, documentation },
      penaltyConfig: { onTimePenalty, late1to3Penalty: late1to3, lateOver3Penalty: lateOver3 },
      rankThresholds: thresholds,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6">
      <div className="card p-5 bg-accent-50/50 border-accent-200">
        <p className="text-sm text-gray-600 leading-relaxed flex items-start gap-2">
          <Calculator size={18} className="shrink-0 mt-0.5 text-accent-600" />
          تغییرات فقط روی <strong>فصل‌های آینده</strong> اثر می‌گذارد؛ فصل‌های بسته‌شده با
          تنظیمات لحظه بستن (snapshot) فریز می‌مانند.
        </p>
      </div>

      {/* Formula */}
      <div className="card p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Percent size={20} className="text-primary-600" />
          فرمول محاسبه امتیاز کل
        </h2>
        <div className="bg-primary-50 rounded-xl p-4 text-center" dir="rtl">
          <p className="text-sm md:text-base font-bold text-primary-800 leading-loose">
            امتیاز کل = (میانگین کیفیت × وزن کیفیت٪) + (امتیاز زمان × وزن زمان٪)
          </p>
          <p className="text-xs text-primary-600 mt-2">
            نمونه فعلی: ({' '}
            <span className="font-bold">کیفیت {qualityWeight}٪</span> +{' '}
            <span className="font-bold">زمان {timeWeight}٪</span> )
          </p>
          {weightSum !== 100 && (
            <p className="text-xs text-danger-600 mt-2 font-medium">
              مجموع وزن‌ها {weightSum}٪ است — به صورت خودکار نرمال‌سازی می‌شود
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
          <div>
            <label className="label">وزن کیفیت محتوایی (٪)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={qualityWeight}
              onChange={(e) => setQualityWeight(Number(e.target.value))}
              className="input"
            />
          </div>
          <div>
            <label className="label">وزن زمان‌بندی (٪)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={timeWeight}
              onChange={(e) => setTimeWeight(Number(e.target.value))}
              className="input"
            />
          </div>
        </div>
      </div>

      {/* Quality indicators */}
      <div className="card p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-1">
          شاخص‌های کیفیت محتوایی
        </h2>
        <p className="text-xs text-gray-400 mb-5">
          وزن نسبی هر شاخص — هر شاخص از ۱ تا ۳ امتیاز دارد و میانگین وزنی آن مبنای امتیاز کیفیت است
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">{QUALITY_INDICATOR_LABELS.completeness}</label>
            <input
              type="number"
              min={1}
              max={10}
              value={completeness}
              onChange={(e) => setCompleteness(Number(e.target.value))}
              className="input"
            />
          </div>
          <div>
            <label className="label">{QUALITY_INDICATOR_LABELS.accuracy}</label>
            <input
              type="number"
              min={1}
              max={10}
              value={accuracy}
              onChange={(e) => setAccuracy(Number(e.target.value))}
              className="input"
            />
          </div>
          <div>
            <label className="label">{QUALITY_INDICATOR_LABELS.documentation}</label>
            <input
              type="number"
              min={1}
              max={10}
              value={documentation}
              onChange={(e) => setDocumentation(Number(e.target.value))}
              className="input"
            />
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          مجموع وزن‌های نسبی: {qualitySum} — درصد هر شاخص:{' '}
          {completeness}/{qualitySum}، {accuracy}/{qualitySum}، {documentation}/{qualitySum}
        </p>
      </div>

      {/* Time penalties */}
      <div className="card p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2">
          <Timer size={20} className="text-primary-600" />
          شاخص‌های زمان‌بندی
        </h2>
        <p className="text-xs text-gray-400 mb-5">
          امتیاز زمان از ۱۰۰ شروع می‌شود و بر اساس تأخیر، جریمه کسر می‌شود
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">پاسخ در روز موعد (کسر امتیاز)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={onTimePenalty}
              onChange={(e) => setOnTimePenalty(Number(e.target.value))}
              className="input"
            />
          </div>
          <div>
            <label className="label">تأخیر ۱ تا ۳ روز (کسر امتیاز)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={late1to3}
              onChange={(e) => setLate1to3(Number(e.target.value))}
              className="input"
            />
          </div>
          <div>
            <label className="label">تأخیر بیش از ۳ روز (کسر امتیاز)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={lateOver3}
              onChange={(e) => setLateOver3(Number(e.target.value))}
              className="input"
            />
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 mt-4 text-xs text-gray-500 space-y-1">
          <p>• پاسخ قبل از موعد: امتیاز کامل (۱۰۰)</p>
          <p>• پاسخ در روز موعد: {100 - onTimePenalty} امتیاز</p>
          <p>• تأخیر ۱-۳ روز: {100 - late1to3} امتیاز</p>
          <p>• تأخیر بیش از ۳ روز: {100 - lateOver3} امتیاز</p>
        </div>
      </div>

      {/* Rank thresholds */}
      <div className="card p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2">
          <Award size={20} className="text-primary-600" />
          رتبه‌بندی کیفی
        </h2>
        <p className="text-xs text-gray-400 mb-5">
          نام و آستانه امتیاز هر رتبه — مثال: ممتاز (۹۰+)، خوب (۷۵-۸۹)، متوسط (۶۰-۷۴)، ضعیف (زیر ۶۰)
        </p>
        <div className="space-y-3">
          {thresholds.map((t, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <input
                value={t.label}
                onChange={(e) => {
                  const next = [...thresholds];
                  next[idx] = { ...t, label: e.target.value };
                  setThresholds(next);
                }}
                className="input flex-1"
                placeholder="نام رتبه"
              />
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm text-gray-500 whitespace-nowrap">حداقل امتیاز:</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={t.minScore}
                  onChange={(e) => {
                    const next = [...thresholds];
                    next[idx] = { ...t, minScore: Number(e.target.value) };
                    setThresholds(next);
                  }}
                  className="input w-24"
                />
              </div>
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
