export type UserRole = 'admin' | 'manager';

export type CorrespondenceType =
  | 'correspondence'
  | 'decision'
  | 'verbal_order'
  | 'directive';

export type Priority = 'normal' | 'important' | 'urgent';

export type CorrespondenceStatus =
  | 'pending'
  | 'in_progress'
  | 'near_deadline'
  | 'overdue'
  | 'completed';

export type NotificationLevel = 'pre_warning' | 'warning' | 'critical' | 'overdue';

export interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  unitId: string;
  isActive: boolean;
  createdAt: string;
}

export interface Unit {
  id: string;
  name: string;
  code: string;
}

export interface CorrespondenceItem {
  id: string;
  referenceNumber: string | null;
  type: CorrespondenceType;
  subject: string;
  description: string;
  issuerName: string;
  issuerUnit: string;
  targetUnitId: string;
  issueDate: string; // ISO date string
  deadline: string; // ISO date string
  priority: Priority;
  status: CorrespondenceStatus;
  attachmentPath: string | null;
  periodId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  // Response data (for scoring)
  responseDate: string | null;
  responseDescription: string | null;
  qualityCompleteness: number | null; // 1-3
  qualityAccuracy: number | null; // 1-3
  qualityDocumentation: number | null; // 1-3
}

export interface MeetingDecision {
  id: string;
  meetingId: string;
  content: string;
  responsibleUnitId: string;
  deadline: string;
  correspondenceItemId: string | null;
}

export interface Meeting {
  id: string;
  title: string;
  location: string;
  datetime: string;
  duration: number; // minutes
  agenda: string;
  participantIds: string[];
  decisions: MeetingDecision[];
  relatedItemId: string | null;
  createdBy: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  itemId: string;
  level: NotificationLevel;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface Period {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isClosed: boolean;
  settings: ScoringSettings | null; // snapshot when closed
}

export interface RankThreshold {
  label: string;
  minScore: number;
  color: string;
}

export interface PenaltyConfig {
  onTimePenalty: number; // minus X for on-day
  late1to3Penalty: number; // minus Y
  lateOver3Penalty: number; // minus Z
}

export interface ScoringSettings {
  qualityWeightPercent: number; // e.g. 60
  timeWeightPercent: number; // e.g. 40
  preWarningDays: number;
  warningDays: number;
  /** Relative weight of each quality indicator (sum is normalized, values 1-10) */
  qualityIndicatorWeights: {
    completeness: number; // کامل بودن پاسخ
    accuracy: number; // دقت و صحت محتوا
    documentation: number; // ارائه مستندات پشتیبان
  };
  rankThresholds: RankThreshold[];
  penaltyConfig: PenaltyConfig;
  alertTemplates: {
    pre_warning: string;
    warning: string;
    critical: string;
    overdue: string;
  };
}

export interface UnitScoreRecord {
  id: string;
  periodId: string;
  unitId: string;
  totalItems: number;
  completedOnTime: number;
  completedLate: number;
  overdue: number;
  avgQualityScore: number;
  avgTimeScore: number;
  finalScore: number;
  rank: number;
  rankLabel: string;
  frozenAt: string;
}

export interface UnitReport {
  unitId: string;
  unitName: string;
  periodId: string;
  totalItems: number;
  completedOnTime: number;
  completedLate: number;
  overdue: number;
  pendingItems: number;
  avgQualityScore: number;
  avgTimeScore: number;
  finalScore: number;
  rank: number;
  rankLabel: string;
  items: CorrespondenceItem[];
}

export const CORRESPONDENCE_TYPE_LABELS: Record<CorrespondenceType, string> = {
  correspondence: 'مکاتبه',
  decision: 'مصوبه',
  verbal_order: 'دستور شفاهی',
  directive: 'ابلاغیه',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  normal: 'عادی',
  important: 'مهم',
  urgent: 'فوری',
};

export const STATUS_LABELS: Record<CorrespondenceStatus, string> = {
  pending: 'در انتظار',
  in_progress: 'در جریان',
  near_deadline: 'نزدیک موعد',
  overdue: 'گذشته از موعد',
  completed: 'تکمیل‌شده',
};

export const NOTIFICATION_LEVEL_LABELS: Record<NotificationLevel, string> = {
  pre_warning: 'پیش‌هشدار',
  warning: 'هشدار',
  critical: 'هشدار بحرانی',
  overdue: 'تأخیر',
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'معاون',
  manager: 'مدیر کل',
};

export const QUALITY_INDICATOR_LABELS = {
  completeness: 'کامل بودن پاسخ',
  accuracy: 'دقت و صحت محتوا',
  documentation: 'ارائه مستندات پشتیبان',
} as const;
