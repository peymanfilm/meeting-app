import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, CalendarDays, MapPin, Clock, Users, ClipboardList, Trash2, Eye, Link2 } from 'lucide-react';
import { useMeetingStore } from '@/stores/meetingStore';
import { useCorrespondenceStore } from '@/stores/correspondenceStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAuthStore } from '@/stores/authStore';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { toJalaliWithTime, toJalali, jalaliToIso, todayJalali } from '@/utils/jalali';
import type { Meeting } from '@/types';

interface MeetingFormData {
  title: string;
  location: string;
  datetime: string;
  duration: number;
  agenda: string;
  participantIds: string[];
  relatedItemId: string;
  decisions: { content: string; responsibleUnitId: string; deadline: string }[];
}

export default function MeetingsPage() {
  const { meetings, addMeeting, deleteMeeting } = useMeetingStore();
  const { items, addItem } = useCorrespondenceStore();
  const { units, users, periods } = useSettingsStore();
  const user = useAuthStore((s) => s.user);

  const [showForm, setShowForm] = useState(false);
  const [viewMeeting, setViewMeeting] = useState<Meeting | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [decisions, setDecisions] = useState<MeetingFormData['decisions']>([]);

  const activePeriod = periods.find((p) => !p.isClosed);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MeetingFormData>({
    defaultValues: {
      datetime: todayJalali(),
      duration: 60,
      participantIds: [],
      relatedItemId: '',
      decisions: [],
    },
  });

  const visibleMeetings =
    user?.role === 'admin'
      ? meetings
      : meetings.filter(
          (m) => m.participantIds.includes(user?.id || '') || m.createdBy === user?.id,
        );

  const onSubmit = (data: MeetingFormData) => {
    const newMeeting = addMeeting({
      title: data.title,
      location: data.location,
      datetime: jalaliToIso(data.datetime),
      duration: Number(data.duration),
      agenda: data.agenda,
      participantIds: data.participantIds,
      decisions: [],
      relatedItemId: data.relatedItemId || null,
      createdBy: user?.id || '',
    });

    // Auto-create correspondence items for each decision
    decisions.forEach((dec) => {
      const newItem = addItem({
        referenceNumber: null,
        type: 'decision',
        subject: dec.content,
        description: `مصوبه جلسه: ${data.title}`,
        issuerName: data.title,
        issuerUnit: 'دفتر معاونت',
        targetUnitId: dec.responsibleUnitId,
        issueDate: jalaliToIso(data.datetime),
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
      // Link decision to the new correspondence item
      useMeetingStore.setState((state) => ({
        meetings: state.meetings.map((m) =>
          m.id === newMeeting.id
            ? {
                ...m,
                decisions: [
                  ...m.decisions,
                  {
                    id: `d${Date.now()}_${Math.random()}`,
                    meetingId: m.id,
                    content: dec.content,
                    responsibleUnitId: dec.responsibleUnitId,
                    deadline: jalaliToIso(dec.deadline),
                    correspondenceItemId: newItem,
                  },
                ],
              }
            : m,
        ),
      }));
    });

    setDecisions([]);
    reset();
    setShowForm(false);
  };

  const addDecisionRow = () => {
    setDecisions([...decisions, { content: '', responsibleUnitId: '', deadline: todayJalali() }]);
  };

  const removeDecisionRow = (idx: number) => {
    setDecisions(decisions.filter((_, i) => i !== idx));
  };

  const updateDecisionRow = (idx: number, field: string, value: string) => {
    setDecisions(
      decisions.map((d, i) => (i === idx ? { ...d, [field]: value } : d)),
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">مدیریت جلسات</h1>
          <p className="text-gray-500 mt-1">{visibleMeetings.length} جلسه ثبت شده</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus size={18} />
          ثبت جلسه جدید
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleMeetings.map((meeting) => {
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
                  >
                    <Eye size={16} />
                  </button>
                  {user?.role === 'admin' && (
                    <button
                      onClick={() => setDeleteId(meeting.id)}
                      className="p-1.5 rounded-lg hover:bg-danger-50 text-gray-500 hover:text-danger-600 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
              <h3 className="font-bold text-gray-800 mb-2 line-clamp-1">{meeting.title}</h3>
              <div className="space-y-1.5 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Clock size={14} />
                  {toJalaliWithTime(meeting.datetime)}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={14} />
                  {meeting.location}
                </div>
                <div className="flex items-center gap-2">
                  <Users size={14} />
                  {participants.length} شرکت‌کننده
                </div>
                {meeting.decisions.length > 0 && (
                  <div className="flex items-center gap-2">
                    <ClipboardList size={14} />
                    {meeting.decisions.length} مصوبه
                  </div>
                )}
                {meeting.relatedItemId && (
                  <div className="flex items-center gap-2 text-primary-600">
                    <Link2 size={14} />
                    پیوند به پیگیری
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="ثبت جلسه جدید" size="xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">عنوان جلسه</label>
              <input {...register('title', { required: 'عنوان الزامی است' })} className={`input ${errors.title ? 'input-error' : ''}`} placeholder="عنوان" />
            </div>
            <div>
              <label className="label">مکان</label>
              <input {...register('location', { required: 'مکان الزامی است' })} className={`input ${errors.location ? 'input-error' : ''}`} placeholder="مکان جلسه" />
            </div>
            <div>
              <label className="label">تاریخ و ساعت (جلالی)</label>
              <input {...register('datetime', { required: 'تاریخ الزامی است' })} className={`input ${errors.datetime ? 'input-error' : ''}`} placeholder="1404/07/01" />
            </div>
            <div>
              <label className="label">مدت (دقیقه)</label>
              <input type="number" {...register('duration')} className="input" />
            </div>
            <div>
              <label className="label">پیوند به پیگیری (اختیاری)</label>
              <select {...register('relatedItemId')} className="input">
                <option value="">بدون پیوند</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>{item.subject}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="label">دستور جلسه</label>
              <textarea {...register('agenda')} className="input min-h-[80px]" placeholder="دستور جلسه" />
            </div>
            <div className="md:col-span-2">
              <label className="label">شرکت‌کنندگان</label>
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

          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-gray-700">مصوبات جلسه</label>
              <button type="button" onClick={addDecisionRow} className="btn-ghost text-sm">
                <Plus size={16} />
                افزودن مصوبه
              </button>
            </div>
            <div className="space-y-3">
              {decisions.map((dec, idx) => (
                <div key={idx} className="flex flex-col md:flex-row gap-2 bg-gray-50 rounded-lg p-3">
                  <input
                    value={dec.content}
                    onChange={(e) => updateDecisionRow(idx, 'content', e.target.value)}
                    className="input flex-1"
                    placeholder="محتوای مصوبه"
                  />
                  <select
                    value={dec.responsibleUnitId}
                    onChange={(e) => updateDecisionRow(idx, 'responsibleUnitId', e.target.value)}
                    className="input md:w-48"
                  >
                    <option value="">واحد مسئول</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                  <input
                    value={dec.deadline}
                    onChange={(e) => updateDecisionRow(idx, 'deadline', e.target.value)}
                    className="input md:w-32"
                    placeholder="مهلت"
                  />
                  <button
                    type="button"
                    onClick={() => removeDecisionRow(idx)}
                    className="p-2.5 rounded-lg hover:bg-danger-50 text-gray-400 hover:text-danger-600 transition-colors shrink-0"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              {decisions.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">
                  مصوبه‌ای اضافه نشده است
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">انصراف</button>
            <button type="submit" className="btn-primary flex-1">ثبت جلسه</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!viewMeeting} onClose={() => setViewMeeting(null)} title="جزئیات جلسه" size="lg">
        {viewMeeting && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-gray-800">{viewMeeting.title}</h3>
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                <span className="flex items-center gap-1.5"><Clock size={14} /> {toJalaliWithTime(viewMeeting.datetime)}</span>
                <span className="flex items-center gap-1.5"><MapPin size={14} /> {viewMeeting.location}</span>
                <span className="flex items-center gap-1.5"><Users size={14} /> {viewMeeting.participantIds.length} نفر</span>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">دستور جلسه</p>
              <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{viewMeeting.agenda}</p>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">شرکت‌کنندگان</p>
              <div className="flex flex-wrap gap-2">
                {viewMeeting.participantIds.map((id) => {
                  const p = users.find((u) => u.id === id);
                  if (!p) return null;
                  return (
                    <div key={id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5">
                      <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">
                        {p.firstName[0]}
                      </div>
                      <span className="text-sm text-gray-700">{p.firstName} {p.lastName}</span>
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
                      <div key={dec.id} className="bg-accent-50 rounded-lg p-3 border-r-2 border-accent-500">
                        <p className="text-sm text-gray-700 mb-1">{dec.content}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>مسئول: {unit?.name}</span>
                          <span>مهلت: {toJalali(dec.deadline)}</span>
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
        message="آیا از حذف این جلسه اطمینان دارید؟"
        confirmLabel="حذف"
      />
    </div>
  );
}
