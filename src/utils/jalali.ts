import {
  toJalaali,
  toGregorian,
  jalaaliMonthLength,
} from 'jalaali-js';

/** Convert Persian/Arabic digits to ASCII digits */
export function toEnglishDigits(s: string): string {
  const fa = '۰۱۲۳۴۵۶۷۸۹';
  const ar = '٠١٢٣٤٥٦٧٨٩';
  return s.replace(/[۰-۹٠-٩]/g, (d) => {
    const i = fa.indexOf(d);
    return String(i >= 0 ? i : ar.indexOf(d));
  });
}

/** Normalize user input (1404-07-03, ۱۴۰۴/۷/۳, 1404/7/3, …) to canonical `jy/jm/jd` */
export function normalizeJalali(input: string): string {
  const cleaned = toEnglishDigits(input)
    .replace(/[^\d]/g, '/')
    .replace(/\/+/g, '/')
    .replace(/^\/|\/$/g, '');
  const parts = cleaned.split('/').filter(Boolean);
  if (parts.length >= 3) return parts.slice(0, 3).join('/');
  return cleaned;
}

/** Parse and validate a jalali date string; returns null when invalid */
export function parseJalali(input: string): { jy: number; jm: number; jd: number } | null {
  const s = normalizeJalali(input);
  const parts = s.split('/').map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return null;
  const [jy, jm, jd] = parts;
  if (jy < 1300 || jy > 1500) return null;
  if (jm < 1 || jm > 12) return null;
  const maxDay = jalaaliMonthLength(jy, jm);
  if (jd < 1 || jd > maxDay) return null;
  return { jy, jm, jd };
}

/** Convert jalali string (optional `HH:mm`) to ISO date string; Invalid Date when input is bad */
export function jalaliToIso(jalaliStr: string, time?: string): string {
  const p = parseJalali(jalaliStr);
  if (!p) return new Date(NaN).toISOString();
  const [hh, mm] = (time ? toEnglishDigits(time) : '12:00').split(':').map(Number);
  const g = toGregorian(p.jy, p.jm, p.jd);
  const d = new Date(g.gy, g.gm - 1, g.gd, hh || 0, mm || 0, 0, 0);
  return d.toISOString();
}

export function toJalali(isoDate: string): string {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return '—';
  const j = toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  return `${j.jy}/${String(j.jm).padStart(2, '0')}/${String(j.jd).padStart(2, '0')}`;
}

export function toJalaliWithTime(isoDate: string): string {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return '—';
  const j = toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return `${j.jy}/${String(j.jm).padStart(2, '0')}/${String(j.jd).padStart(2, '0')} - ${time}`;
}

export function todayJalali(): string {
  const d = new Date();
  const j = toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  return `${j.jy}/${String(j.jm).padStart(2, '0')}/${String(j.jd).padStart(2, '0')}`;
}

export function daysBetween(date1: string, date2: string): number {
  const a = new Date(date1);
  const b = new Date(date2);
  a.setHours(12, 0, 0, 0);
  b.setHours(12, 0, 0, 0);
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
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

export function addDaysToJalali(jalaliStr: string, days: number): string {
  const iso = jalaliToIso(jalaliStr);
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return toJalali(d.toISOString());
}
