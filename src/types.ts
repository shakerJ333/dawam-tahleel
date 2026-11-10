/**
 * Data structures and types for the Fingerprint Attendance Analysis System
 */

export interface PunchRecord {
  id: string;
  name: string;
  date: string;
  school?: string;
  ts: number[];
  t?: number | null;
  in?: number | null;
  out?: number | null;
}

export interface AppConfig {
  start: number; // e.g. 465 = 07:45
  end: number;   // e.g. 740 = 12:20
  grace: number; // grace period in minutes
  egrace: number; // early departure grace period in minutes
  severe: number; // severe late threshold in minutes (default 60)
  from: number;   // valid time window start (default 300 = 05:00)
  to: number;     // valid time window end (default 1020 = 17:00)
  days: number[]; // work days: 0 (Sun) to 4 (Thu)
  hol: number;    // % attendance threshold to consider day an auto-holiday (default 20%)
  full: boolean;  // calculate late from start instead of grace end
  noExit: string; // date of universal exit machine failure
  pAbs: number;   // deduction per absence day
  pLate: number;  // deduction per late incident
  pLateMin: number; // deduction per late minute
  pEarly: number; // deduction per early departure incident
  pEarlyMin: number; // deduction per early departure minute
  pInc: number;   // deduction per incomplete punch
  single: number; // threshold before which single punch is considered 'in' (600 = 10:00)
  irrN: number;   // irregular punches count threshold
  few: number;    // threshold of attendance % to flag as few data
  aStreak: number; // warning alert: consecutive absence days
  aLate: number;   // warning alert: cumulative late minutes
  aDays: number;   // warning alert: repeated late days count
  singleAsAbsence: boolean; // count single punch (in without out, or out without in) as absence
}

export interface LateRecord {
  d: string;
  t: number;
  m: number;
}

export interface EarlyRecord {
  d: string;
  t: number;
  m: number;
}

export interface TeacherAnalysis {
  id: string;
  name: string;
  school: string;
  pres: number;
  abs: number;
  exc: number;
  late: LateRecord[];
  early: EarlyRecord[];
  inc: number;
  cells: Record<string, string>; // date -> 'ح' | 'غ' | 'ت' | 'م' | 'ب' | 'إ'
  lateMin: number;
  earlyMin: number;
  maxLate: number;
  maxStreak: number;
  severe: number;
  noOut: number;
  sus: number;
  skipN: number;
  due: number;
  few: boolean;
  irr: boolean;
  raw: PunchRecord[];
  att: number;
  pun: number;
  dep: number;
  cmp: number;
  score: number;
  grade: [string, string]; // [Label, Color]
}

export interface DayInfo {
  dow: number;
  cnt: number;
  type: 'work' | 'off' | 'weekend';
  auto: boolean;
}

export interface AnalysisResult {
  list: TeacherAnalysis[];
  ok: TeacherAnalysis[];
  dates: string[];
  info: Record<string, DayInfo>;
  work: string[];
  n: number;
  att: number;
  pun: number;
  avg: number;
  lateMin: number;
  earlyMin: number;
  abs: number;
  emps: Map<string, { id: string; name: string; school: string; m: Map<string, PunchRecord>; raw: PunchRecord[] }>;
  g: [string, string];
}

export interface DataQuality {
  read: number;
  skip: number;
  dup: number;
  wkend: number;
  single: number;
  outr: number;
  short: number;
  long: number;
  names: string[];
  ids: string[];
}

export interface ColumnIndexMap {
  id: number;
  name: number;
  date: number;
  in: number;
  out: number;
  school: number;
  datetime?: number;
  state?: number;
}

export interface ImportMeta {
  fileName: string;
  rawRows: (string | number | Date | null | undefined)[][];
  headerRow: number;
  ix: ColumnIndexMap;
  totalPunches: number;
  uniqueTeachers: number;
  pattern: string;
  dateRange: string;
}

export type TabKey =
  | 'dash'
  | 'sum'
  | 'daily'
  | 'late'
  | 'early'
  | 'abs'
  | 'matrix'
  | 'eval'
  | 'quality'
  | 'set';
