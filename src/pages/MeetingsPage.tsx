import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Plus,
  CalendarDays,
  MapPin,
  Clock,
  Users,
  ClipboardList,
  Trash2,
  Eye,
  Link2,
} from 'lucide-react';
import { useMeetingStore } from '@/stores/meetingStore';
import { useCorrespondenceStore } from '@/stores/correspondenceStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAuthStore } from '@/stores/authStore';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { toJalaliWithTime, toJalali, jalaliToIso, todayJalali } from '@/utils/jalali';
import { meetingSchema } from '@/utils/schemas';
import type { z } from 'zod';
import type { Meeting } from '@/types';

type MeetingFormData = z.infer<typeof meetingSchema>;

export default function MeetingsPage() {
  const { meetings, addMeeting, addDecision, deleteMeeting } = useMeetingStore();
  const { items, addItem } = useCorrespondenceStore();
  const { units, users, periods } = useSettingsStore();
  const user = useAuthStore((s) => s.user);

  const [showForm, setShowForm] = useState(false);
  const [viewMeeting, setViewMeeting] = useState<Meeting | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const activePeriod = periods.find((p) => !p.isClosed);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<MeetingFormData>({
    resolver: zodResolver(meetingSchema),
    defaultValues: {
      date: todayJalali(),
      time: '08:00',
      duration: 60,
      participantIds: [],
      relatedItemId: '',
      agenda: '',
      decisions: [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'decisions' });

  const openNew = () => {
    reset({
      title: '',
      location: '',
      date: todayJalali(),
      time: '08:00',
      duration: 60,
      agenda: '',
      relatedItemId: '',
      participantIds: [],
      decisions: [],
    });
    setShowForm(true);
  };

  const onSubmit = (data: MeetingFormData) => {
    const datetime = jalaliToIso(data.date, data.time);

    const newMeeting = addMeeting({
      title: data.title,
      location: data.location,
      datetime,
      duration: Number(data.duration),
      agenda: data.agenda || '',
      participantIds: data.participantIds,
      decisions: [],
      relatedItemId: data.relatedItemId || null,
      createdBy: user?.id || '',
    });

    // Each decision automatically creates a follow-up item in the decisions module
    data.decisions.forEach((dec) => {
      const newItemId = addItem({
        referenceNumber: null,
        type: 'decision',
        subject: dec.content,
        description: `مصوبه جلسه «${data.title}» مورخ ${toJalali(datetime)}`,
        issuerName: data.title,
        issuerUnit: units.find((u) => u.id === dec.responsibleUnitId)?.name || '',
        targetUnitId: dec.responsibleUnitId,
        issueDate: datetime,
        deadline: jalaliToIso(dec.deadline),
        priority: 'important',
        attachmentPath: null,
        periodId: activePeriod?.id || 'p1',
        createdBy: user?.id || '',
        responseDate: null,
        responseDescription: null,
        qualityCompleteness: null,
        qualityAccuracy: null,
        qualityDocumentation: null,
      });

      addDecision(newMeeting.id, {
        content: dec.content,
        responsibleUnitId: dec.responsibleUnitId,
        deadline: jalaliToIso(dec.deadline),
        correspondenceItemId: newItemId,
      });
    });

    setShowForm(false);
  };

  const visibleMeetings =
    user?.role === 'admin'
      ? meetings
      : meetings.filter(
          (m) =>
            m.participantIds.includes(user?.id || '') || m.createdBy === user?.id,
        );

  const sortedMeetings = [...visibleMeetings].sort(
    (a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime(),
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">مدیریت جلسات</h1>
          <p className="text-gray-500 mt-1">
            {sortedMeetings.length} جلسه — زیرمجموعه پیگیری‌ها
          </p>
        </div>
        <button onClick={openNew} className="btn-primary">
          <Plus size={18} />
          ثبت جلسه جدید
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedMeetings.map((meeting) => {
          const participants = meeting.participantIds
            .map((id) => users.find((u) => u.id === id))
            .filter(Boolean);
          return (
            <div
              key={meeting.id}
              className="card p-5 hover:shadow-card-hover transition-all duration-200 group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-accent-100 text-accent-700 flex items-center justify-center">
                  <CalendarDays size={22} />
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setViewMeeting(meeting)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-primary-600 transition-colors"
                    title="مشاهده"
                  >
                    <Eye size={16} />
                  </button>
                  {user?.role === 'admin' && (
                    <button
                      onClick={() => setDeleteId(meeting.id)}
                      className="p-1.5 rounded-lg hover:bg-danger-50 text-gray-500 hover:text-danger-600 transition-colors"
                      title="حذف"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
              <h3 className="font-bold text-gray-800 mb-2 line-clamp-1">{meeting.title}</h3>
              <div className="space-y-1.5 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="shrink-0" />
                  <span>{toJalaliWithTime(meeting.datetime)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="shrink-0" />
                  <span className="truncate">{meeting.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={14} className="shrink-0" />
                  <span>{participants.length} شرکت‌کننده</span>
                </div>
                {meeting.decisions.length > 0 && (
                  <div className="flex items-center gap-2 text-accent-700">
                    <ClipboardList size={14} className="shrink-0" />
                    <span>{meeting.decisions.length} مصوبه (تبدیل به پیگیری)</span>
                  </div>
                )}
                {meeting.relatedItemId && (
                  <div className="flex items-center gap-2 text-primary-600">
                    <Link2 size={14} className="shrink-0" />
                    <span>پیوند به پیگیری</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {sortedMeetings.length === 0 && (
          <div className="card p-12 col-span-full flex flex-col items-center gap-3 text-gray-400">
            <CalendarDays size={40} />
            <p className="text-sm">جلسه‌ای ثبت نشده است</p>
          </div>
        )}
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="ثبت جلسه جدید" size="xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">عنوان جلسه</label>
              <input
                {...register('title')}
                className={`input ${errors.title ? 'input-error' : ''}`}
                placeholder="عنوان جلسه"
              />
              {errors.title && <p className="text-danger-600 text-xs mt-1">{errors.title.message}</p>}
            </div>
            <div>
              <label className="label">مکان</label>
              <input
                {...register('location')}
                className={`input ${errors.location ? 'input-error' : ''}`}
                placeholder="مکان جلسه"
              />
              {errors.location && (
                <p className="text-danger-600 text-xs mt-1">{errors.location.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">تاریخ (جلالی)</label>
                <input
                  {...register('date')}
                  className={`input ${errors.date ? 'input-error' : ''}`}
                  placeholder="۱۴۰۴/۰۷/۰۱"
                />
                {errors.date && <p className="text-danger-600 text-xs mt-1">{errors.date.message}</p>}
              </div>
              <div>
                <label className="label">ساعت</label>
                <input
                  {...register('time')}
                  dir="ltr"
                  className={`input text-left ${errors.time ? 'input-error' : ''}`}
                  placeholder="08:00"
                />
                {errors.time && <p className="text-danger-600 text-xs mt-1">{errors.time.message}</p>}
              </div>
            </div>
            <div>
              <label className="label">مدت (دقیقه)</label>
              <input type="number" {...register('duration')} className="input" />
              {errors.duration && (
                <p className="text-danger-600 text-xs mt-1">{errors.duration.message}</p>
              )}
            </div>
            <div>
              <label className="label">پیوند به پیگیری موجود (اختیاری)</label>
              <select {...register('relatedItemId')} className="input">
                <option value="">بدون پیوند</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.subject}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="label">دستور جلسه</label>
              <textarea
                {...register('agenda')}
                className="input min-h-[80px]"
                placeholder="دستور جلسه"
              />
            </div>
            <div className="md:col-span-2">
              <label className="label">
                شرکت‌کنندگان
                {errors.participantIds && (
                  <span className="text-danger-600 text-xs mr-2">
                    {errors.participantIds.message}
                  </span>
                )}
              </label>
              <div className="flex flex-wrap gap-2">
                {users.map((u) => (
                  <label
                    key={u.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      value={u.id}
                      {...register('participantIds')}
                      className="w-4 h-4 accent-primary-700"
                    />
                    <span className="text-sm text-gray-700">
                      {u.firstName} {u.lastName}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Decisions */}
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <label className="text-sm font-semibold text-gray-700">مصوبات جلسه</label>
                <p className="text-xs text-gray-400 mt-0.5">
                  هر مصوبه به صورت خودکار یک پیگیری در ماژول مصوبات ایجاد می‌کند
                </p>
              </div>
              <button
                type="button"
                onClick={() => append({ content: '', responsibleUnitId: '', deadline: todayJalali() })}
                className="btn-ghost text-sm"
              >
                <Plus size={16} />
                افزودن مصوبه
              </button>
            </div>
            <div className="space-y-3">
              {fields.map((field, idx) => (
                <div
                  key={field.id}
                  className="flex flex-col md:flex-row gap-2 bg-gray-50 rounded-lg p-3"
                >
                  <div className="flex-1">
                    <input
                      {...register(`decisions.${idx}.content` as const)}
                      className="input"
                      placeholder="محتوای مصوبه"
                    />
                  </div>
                  <div className="md:w-44">
                    <select {...register(`decisions.${idx}.responsibleUnitId` as const)} className="input">
                      <option value="">واحد مسئول</option>
                      {units.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:w-32">
                    <input
                      {...register(`decisions.${idx}.deadline` as const)}
                      className="input"
                      placeholder="مهلت (۱۴۰۴/۰۷/۱۵)"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(idx)}
                    className="p-2.5 rounded-lg hover:bg-danger-50 text-gray-400 hover:text-danger-600 transition-colors shrink-0 self-start"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              {fields.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">
                  مصوبه‌ای اضافه نشده است
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">
              انصراف
            </button>
            <button type="submit" className="btn-primary flex-1">
              ثبت جلسه
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={!!viewMeeting} onClose={() => setViewMeeting(null)} title="جزئیات جلسه" size="lg">
        {viewMeeting && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-gray-800">{viewMeeting.title}</h3>
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                <span className="flex items-center gap-1.5">
                  <Clock size={14} /> {toJalaliWithTime(viewMeeting.datetime)}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} /> {viewMeeting.location}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users size={14} /> {viewMeeting.participantIds.length} نفر
                </span>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">دستور جلسه</p>
              <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                {viewMeeting.agenda || '—'}
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">شرکت‌کنندگان</p>
              <div className="flex flex-wrap gap-2">
                {viewMeeting.participantIds.map((id) => {
                  const p = users.find((u) => u.id === id);
                  if (!p) return null;
                  return (
                    <div
                      key={id}
                      className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5"
                    >
                      <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">
                        {p.firstName[0]}
                      </div>
                      <span className="text-sm text-gray-700">
                        {p.firstName} {p.lastName}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {viewMeeting.decisions.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">مصوبات</p>
                <div className="space-y-2">
                  {viewMeeting.decisions.map((dec) => {
                    const unit = units.find((u) => u.id === dec.responsibleUnitId);
                    return (
                      <div
                        key={dec.id}
                        className="bg-accent-50 rounded-lg p-3 border-r-2 border-accent-500"
                      >
                        <p className="text-sm text-gray-700 mb-1">{dec.content}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>مسئول: {unit?.name}</span>
                          <span>مهلت: {toJalali(dec.deadline)}</span>
                          {dec.correspondenceItemId && (
                            <span className="text-primary-600 flex items-center gap-1">
                              <Link2 size={12} />
                              پیگیری ایجاد شد
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMeeting(deleteId)}
        title="حذف جلسه"
        message="آیا از حذف این جلسه اطمینان دارید؟ مصوبات ایجادشده در ماژول پیگیری‌ها باقی می‌مانند."
        confirmLabel="حذف"
      />
    </div>
  );
}
