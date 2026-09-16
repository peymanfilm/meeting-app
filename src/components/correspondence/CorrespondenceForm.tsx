import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { useCorrespondenceStore } from '@/stores/correspondenceStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAuthStore } from '@/stores/authStore';
import Modal from '@/components/ui/Modal';
import { jalaliToIso, todayJalali } from '@/utils/jalali';
import { correspondenceSchema } from '@/utils/schemas';
import type { CorrespondenceType, Priority } from '@/types';
import { CORRESPONDENCE_TYPE_LABELS, PRIORITY_LABELS } from '@/types';

type FormData = z.infer<typeof correspondenceSchema>;

interface CorrespondenceFormProps {
  open: boolean;
  onClose: () => void;
  defaultType?: CorrespondenceType;
}

export default function CorrespondenceForm({ open, onClose, defaultType = 'correspondence' }: CorrespondenceFormProps) {
  const addItem = useCorrespondenceStore((s) => s.addItem);
  const { units, periods } = useSettingsStore();
  const user = useAuthStore((s) => s.user);
  const activePeriod = periods.find((p) => !p.isClosed);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(correspondenceSchema),
    defaultValues: {
      type: defaultType,
      issueDate: todayJalali(),
      priority: 'normal',
    },
  });

  const onSubmit = (data: FormData) => {
    addItem({
      referenceNumber: data.referenceNumber || null,
      type: data.type,
      subject: data.subject,
      description: data.description,
      issuerName: data.issuerName,
      issuerUnit: units.find((u) => u.id === data.targetUnitId)?.name || '',
      targetUnitId: data.targetUnitId,
      issueDate: jalaliToIso(data.issueDate),
      deadline: jalaliToIso(data.deadline),
      priority: data.priority as Priority,
      attachmentPath: data.attachmentPath || null,
      periodId: activePeriod?.id || 'p1',
      createdBy: user?.id || '',
      responseDate: null,
      responseDescription: null,
      qualityCompleteness: null,
      qualityAccuracy: null,
      qualityDocumentation: null,
    });
    reset();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="ثبت پیگیری جدید" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">نوع</label>
            <select {...register('type')} className="input">
              {Object.entries(CORRESPONDENCE_TYPE_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">شماره (اختیاری برای دستورات شفاهی)</label>
            <input {...register('referenceNumber')} className="input" placeholder="مثلاً ۱۴۰۴/۱۲۳" />
          </div>

          <div>
            <label className="label">تاریخ صدور (جلالی)</label>
            <input {...register('issueDate')} className={`input ${errors.issueDate ? 'input-error' : ''}`} placeholder="1404/07/01" />
            {errors.issueDate && <p className="text-danger-600 text-xs mt-1">{errors.issueDate.message}</p>}
          </div>

          <div>
            <label className="label">مهلت پاسخ/اجرا (جلالی)</label>
            <input {...register('deadline')} className={`input ${errors.deadline ? 'input-error' : ''}`} placeholder="1404/07/15" />
            {errors.deadline && <p className="text-danger-600 text-xs mt-1">{errors.deadline.message}</p>}
          </div>

          <div className="md:col-span-2">
            <label className="label">موضوع</label>
            <input {...register('subject')} className={`input ${errors.subject ? 'input-error' : ''}`} placeholder="موضوع مکاتبه" />
            {errors.subject && <p className="text-danger-600 text-xs mt-1">{errors.subject.message}</p>}
          </div>

          <div>
            <label className="label">صادرکننده</label>
            <input {...register('issuerName')} className={`input ${errors.issuerName ? 'input-error' : ''}`} placeholder="نام صادرکننده" />
            {errors.issuerName && <p className="text-danger-600 text-xs mt-1">{errors.issuerName.message}</p>}
          </div>

          <div>
            <label className="label">مخاطب (واحد سازمانی)</label>
            <select {...register('targetUnitId')} className={`input ${errors.targetUnitId ? 'input-error' : ''}`}>
              <option value="">انتخاب کنید</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
            {errors.targetUnitId && <p className="text-danger-600 text-xs mt-1">{errors.targetUnitId.message}</p>}
          </div>

          <div>
            <label className="label">اولویت</label>
            <select {...register('priority')} className="input">
              {Object.entries(PRIORITY_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">فایل پیوست (اختیاری)</label>
            <input {...register('attachmentPath')} className="input" placeholder="آدرس فایل" />
          </div>

          <div className="md:col-span-2">
            <label className="label">شرح</label>
            <textarea {...register('description')} className={`input min-h-[100px] ${errors.description ? 'input-error' : ''}`} placeholder="شرح کامل" />
            {errors.description && <p className="text-danger-600 text-xs mt-1">{errors.description.message}</p>}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">انصراف</button>
          <button type="submit" className="btn-primary flex-1">ثبت</button>
        </div>
      </form>
    </Modal>
  );
}
