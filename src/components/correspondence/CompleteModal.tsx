import { useForm } from 'react-hook-form';
import { useCorrespondenceStore } from '@/stores/correspondenceStore';
import Modal from '@/components/ui/Modal';
import { todayJalali, jalaliToIso } from '@/utils/jalali';
import type { CorrespondenceItem } from '@/types';

interface FormData {
  responseDate: string;
  responseDescription: string;
  qualityCompleteness: number;
  qualityAccuracy: number;
  qualityDocumentation: number;
}

interface CompleteModalProps {
  open: boolean;
  onClose: () => void;
  item: CorrespondenceItem | null;
}

export default function CompleteModal({ open, onClose, item }: CompleteModalProps) {
  const completeItem = useCorrespondenceStore((s) => s.completeItem);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      responseDate: todayJalali(),
      qualityCompleteness: 2,
      qualityAccuracy: 2,
      qualityDocumentation: 2,
    },
  });

  if (!item) return null;

  const onSubmit = (data: FormData) => {
    completeItem(item.id, {
      responseDate: jalaliToIso(data.responseDate),
      responseDescription: data.responseDescription,
      qualityCompleteness: Number(data.qualityCompleteness),
      qualityAccuracy: Number(data.qualityAccuracy),
      qualityDocumentation: Number(data.qualityDocumentation),
    });
    reset();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={`ثبت پاسخ - ${item.subject}`} size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label">تاریخ پاسخ (جلالی)</label>
          <input {...register('responseDate')} className="input" placeholder="1404/07/01" />
        </div>

        <div>
          <label className="label">شرح پاسخ</label>
          <textarea {...register('responseDescription')} className="input min-h-[80px]" placeholder="توضیحات پاسخ" />
        </div>

        <div className="bg-gray-50 rounded-xl p-4 space-y-4">
          <p className="text-sm font-semibold text-gray-700">امتیازدهی کیفیت محتوا (۱ تا ۳)</p>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="label">کامل بودن پاسخ</label>
              <select {...register('qualityCompleteness')} className="input">
                <option value={1}>۱ - ناقص</option>
                <option value={2}>۲ - متوسط</option>
                <option value={3}>۳ - کامل</option>
              </select>
            </div>

            <div>
              <label className="label">دقت و صحت محتوا</label>
              <select {...register('qualityAccuracy')} className="input">
                <option value={1}>۱ - پایین</option>
                <option value={2}>۲ - متوسط</option>
                <option value={3}>۳ - بالا</option>
              </select>
            </div>

            <div>
              <label className="label">ارائه مستندات پشتیبان</label>
              <select {...register('qualityDocumentation')} className="input">
                <option value={1}>۱ - بدون مستند</option>
                <option value={2}>۲ - مستند جزئی</option>
                <option value={3}>۳ - مستند کامل</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">انصراف</button>
          <button type="submit" className="btn-primary flex-1">ثبت پاسخ</button>
        </div>
      </form>
    </Modal>
  );
}
