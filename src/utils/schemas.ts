import { z } from 'zod';
import { parseJalali, toEnglishDigits } from './jalali';
import { toGregorian } from 'jalaali-js';

/** Zod schema for a required jalali date field (e.g. 1404/07/01) */
export const jalaliDateSchema = z
  .string()
  .min(1, 'تاریخ الزامی است')
  .refine((v) => parseJalali(v) !== null, 'تاریخ نامعتبر است (نمونه: ۱۴۰۴/۰۷/۰۱)');

/** Zod schema for an optional jalali date field */
export const optionalJalaliDateSchema = z
  .string()
  .refine((v) => v === '' || parseJalali(v) !== null, 'تاریخ نامعتبر است (نمونه: ۱۴۰۴/۰۷/۰۱)')
  .optional()
  .or(z.literal(''));

/** `HH:mm` 24h time validation (Persian digits allowed) */
export const timeSchema = z
  .string()
  .min(1, 'ساعت الزامی است')
  .refine((v) => /^([01]?\d|2[0-3]):[0-5]\d$/.test(v), 'ساعت نامعتبر است (نمونه: ۰۸:۳۰)');

export const correspondenceSchema = z
  .object({
    type: z.enum(['correspondence', 'decision', 'verbal_order', 'directive']),
    referenceNumber: z.string().optional(),
    issueDate: jalaliDateSchema,
    subject: z.string().min(3, 'موضوع حداقل ۳ کاراکتر است'),
    issuerName: z.string().min(2, 'صادرکننده الزامی است'),
    targetUnitId: z.string().min(1, 'مخاطب الزامی است'),
    description: z.string().min(5, 'شرح حداقل ۵ کاراکتر است'),
    deadline: jalaliDateSchema,
    priority: z.enum(['normal', 'important', 'urgent']),
    attachmentPath: z.string().optional(),
  })
  .refine(
    (data) => {
      const issue = parseJalali(data.issueDate);
      const deadline = parseJalali(data.deadline);
      if (!issue || !deadline) return true; // handled by field errors
      const gi = toGregorian(issue.jy, issue.jm, issue.jd);
      const gd = toGregorian(deadline.jy, deadline.jm, deadline.jd);
      return new Date(gd.gy, gd.gm - 1, gd.gd) >= new Date(gi.gy, gi.gm - 1, gi.gd);
    },
    { message: 'مهلت نمی‌تواند قبل از تاریخ صدور باشد', path: ['deadline'] },
  );

export const meetingSchema = z.object({
  title: z.string().min(3, 'عنوان جلسه الزامی است'),
  location: z.string().min(2, 'مکان الزامی است'),
  date: jalaliDateSchema,
  time: timeSchema,
  duration: z.coerce.number().min(5, 'حداقل ۵ دقیقه').max(600, 'حداکثر ۶۰۰ دقیقه'),
  agenda: z.string().optional(),
  relatedItemId: z.string().optional(),
  participantIds: z.array(z.string()).min(1, 'حداقل یک شرکت‌کننده انتخاب کنید'),
  decisions: z.array(
    z.object({
      content: z.string().min(1, 'محتوای مصوبه الزامی است'),
      responsibleUnitId: z.string().min(1, 'واحد مسئول الزامی است'),
      deadline: jalaliDateSchema,
    }),
  ),
});
