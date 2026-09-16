import jalaali from 'jalaali-js';

export function toJalali(isoDate: string): string {
  const d = new Date(isoDate);
  const j = jalaali.toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  return `${j.jy}/${String(j.jm).padStart(2, '0')}/${String(j.jd).padStart(2, '0')}`;
}

export function toJalaliWithTime(isoDate: string): string {
  const d = new Date(isoDate);
  const j = jalaali.toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return `${j.jy}/${String(j.jm).padStart(2, '0')}/${String(j.jd).padStart(2, '0')} - ${time}`;
}

export function jalaliToIso(jalaliStr: string): string {
  const [jy, jm, jd] = jalaliStr.split('/').map(Number);
  const g = jalaali.toGregorian(jy, jm, jd);
  return new Date(g.gy, g.gm - 1, g.gd).toISOString();
}

export function todayJalali(): string {
  const d = new Date();
  const j = jalaali.toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  return `${j.jy}/${String(j.jm).padStart(2, '0')}/${String(j.jd).padStart(2, '0')}`;
}

export function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1).getTime();
  const d2 = new Date(date2).getTime();
  return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
}

export function daysUntilDeadline(deadline: string): number {
  return daysBetween(new Date().toISOString(), deadline);
}

export function isThisWeek(isoDate: string): boolean {
  const d = new Date(isoDate);
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);
  return d >= startOfWeek && d < endOfWeek;
}

export function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function getJalaliMonthName(month: number): string {
  const months = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
  ];
  return months[month - 1] || '';
}
