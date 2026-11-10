/**
 * Processing engine and mathematical analysis for fingerprint attendance logs.
 */

import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  AppConfig,
  AnalysisResult,
  ColumnIndexMap,
  DataQuality,
  DayInfo,
  ImportMeta,
  PunchRecord,
  TeacherAnalysis,
} from '../types';

export const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export const DEFAULT_CONFIG: AppConfig = {
  start: 465, // 07:45
  end: 740,   // 12:20
  grace: 0,
  egrace: 0,
  severe: 60,
  from: 300,  // 05:00
  to: 1020,   // 17:00
  days: [0, 1, 2, 3, 4], // Sun to Thu
  hol: 20,
  full: false,
  noExit: '',
  pAbs: 1,
  pLate: 0.05,
  pLateMin: 0.005,
  pEarly: 0.1,
  pEarlyMin: 0.002,
  pInc: 0.1,
  single: 600, // 10:00
  irrN: 3,
  few: 20,
  aStreak: 3,
  aLate: 120,
  aDays: 5,
  singleAsAbsence: true,
};

export const dg = (s: unknown): string =>
  String(s ?? '')
    .replace(/[٠-٩]/g, c => '0123456789'['٠١٢٣٤٥٦٧٨٩'.indexOf(c)])
    .replace(/[۰-۹]/g, c => String(c.charCodeAt(0) - 1776));

export const clean = (s: unknown): string => dg(s).replace(/\s+/g, ' ').trim();

export const esc = (s: unknown): string =>
  String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] || c));

export const p2 = (n: number): string => String(n).padStart(2, '0');

export const fm = (m: number | null | undefined): string =>
  m == null ? '' : `${p2(Math.floor(m / 60))}:${p2(m % 60)}`;

export const hm = (m: number): string =>
  `${Math.floor(m / 60)}:${p2(Math.round(m % 60))}`;

export const pc = (x: number): string => `${(x * 100).toFixed(1)}%`;

export const toM = (s: unknown): number => {
  const m = String(s).match(/(\d+):(\d+)/);
  return m ? +m[1] * 60 + +m[2] : 0;
};

export const dn = (d: string): string =>
  DAYS[new Date(d + 'T00:00:00Z').getUTCDay()];

export const norm = (s: unknown): string =>
  clean(s).replace(/[أإآء]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه');

export const normSearch = (s: unknown): string =>
  dg(s || '')
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآءؤئ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\s\-_]+/g, ' ')
    .trim();

export function parseTime(v: unknown): number | null {
  if (v === '' || v == null) return null;
  if (typeof v === 'number') {
    const frac = v >= 1 ? v % 1 : v;
    return Math.round(frac * 1440);
  }
  const s = dg(String(v)).trim();
  if (!s) return null;

  // Match 12-hour or 24-hour time with optional seconds and AM/PM or ص/م
  const m = s.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm|[صم])?/i);
  if (m) {
    let h = +m[1];
    const min = +m[2];
    const period = m[4] ? m[4].toLowerCase() : '';
    if (period === 'pm' || period === 'م') {
      if (h < 12) h += 12;
    } else if (period === 'am' || period === 'ص') {
      if (h === 12) h = 0;
    }
    return h * 60 + min;
  }

  // Fallback: 4 digits like 0745 or 1230
  const m4 = s.match(/^(\d{2})(\d{2})$/);
  if (m4) {
    const h = +m4[1],
      min = +m4[2];
    if (h < 24 && min < 60) return h * 60 + min;
  }

  return null;
}

export function parseDate(v: unknown): string | null {
  if (v === '' || v == null) return null;
  let y: number | undefined, m: number | undefined, d: number | undefined;

  if (typeof v === 'number') {
    const t = new Date(Date.UTC(1899, 11, 30) + Math.floor(v) * 864e5);
    y = t.getUTCFullYear();
    m = t.getUTCMonth() + 1;
    d = t.getUTCDate();
  } else if (v instanceof Date) {
    y = v.getFullYear();
    m = v.getMonth() + 1;
    d = v.getDate();
  } else {
    const s = dg(String(v)).trim();
    if (!s) return null;

    let r = s.match(/(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})/);
    if (r) {
      y = +r[1];
      m = +r[2];
      d = +r[3];
    } else {
      r = s.match(/(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})/);
      if (r) {
        const p1 = +r[1],
          p2 = +r[2];
        const yr = +r[3];
        if (p1 > 12) {
          d = p1;
          m = p2;
        } else if (p2 > 12) {
          m = p1;
          d = p2;
        } else {
          d = p1;
          m = p2;
        }
        y = yr;
      } else {
        return null;
      }
    }
  }

  if (!y || !m || !d || y < 1970 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return null;
  return `${y}-${p2(m)}-${p2(d)}`;
}

export const SYN: Record<string, string[]> = {
  id: [
    'الرقم الوزاري', 'رقم الموظف', 'الرقم الوظيفي', 'الرقم', 'رقم الهوية', 'كود الموظف',
    'رقم المستخدم', 'رقم البصمة', 'المعرف', 'رقم التسجيل', 'الرمز', 'رقم السجل',
    'id', 'emp id', 'employee id', 'user id', 'pin', 'ac-no', 'no.', 'enroll no',
    'userid', 'empid', 'code', 'badge', 'no'
  ],
  name: [
    'الاسم', 'اسم الموظف', 'اسم المعلم', 'اسم المعلمة', 'اسم الموظف/المعلم', 'الاسم الكامل',
    'اسم صاحب البصمة', 'الموظف', 'المعلم', 'اسم المستخدم', 'اسم العضو',
    'name', 'employee name', 'staff name', 'user name', 'enrollee name', 'emp name',
    'full name', 'person name'
  ],
  date: [
    'التاريخ', 'تاريخ', 'تاريخ الحضور', 'تاريخ الدوام', 'تاريخ البصمة', 'يوم العمل',
    'date', 'attendance date', 'work date', 'log date', 'punch date', 'trans date', 'day'
  ],
  in: [
    'اول تسجيل دخول', 'أول تسجيل دخول', 'وقت الدخول', 'الدخول', 'دخول', 'وقت الحضور', 'حضور',
    'دخول 1', 'حضور 1', 'أول بصمة', 'بصمة الدخول', 'أول حركة', 'حركة الدخول', 'بداية الدوام',
    'تسجيل الدخول', 'check in', 'in time', 'time in', 'clock in', 'sign in', 'c/in',
    'in1', 'in', 'cin'
  ],
  out: [
    'اخر تسجيل خروج', 'آخر تسجيل خروج', 'وقت الخروج', 'الخروج', 'خروج', 'وقت الانصراف', 'انصراف',
    'خروج 1', 'انصراف 1', 'آخر بصمة', 'بصمة الخروج', 'آخر حركة', 'حركة الخروج', 'نهاية الدوام',
    'تسجيل الخروج', 'check out', 'out time', 'time out', 'clock out', 'sign out', 'c/out',
    'out1', 'out', 'cout'
  ],
  datetime: [
    'التاريخ والوقت', 'الوقت والتاريخ', 'وقت وتاريخ', 'تاريخ ووقت', 'وقت البصمة', 'ساعة البصمة',
    'تاريخ/وقت', 'وقت الحركة', 'تاريخ وحركة', 'وقت التسجيل', 'datetime', 'date time',
    'date/time', 'timestamp', 'punch time', 'log time', 'time'
  ],
  school: [
    'المدرسة', 'المدرسه', 'القسم', 'الفرع', 'الإدارة', 'الاداره', 'الجهة', 'مقر العمل',
    'الوحدة', 'المركز', 'department', 'school', 'branch', 'dept', 'location', 'company'
  ],
  state: [
    'نوع الحركة', 'الحالة', 'الحركة', 'نوع البصمة', 'حالة البصمة',
    'status', 'state', 'type', 'event', 'action'
  ]
};

export function findHeaderRow(rows: unknown[][]): {
  headerRow: number;
  score: number;
  ix: Partial<ColumnIndexMap>;
} {
  let bestRow = 0;
  let maxScore = -1;
  let bestIx: Partial<ColumnIndexMap> = {};

  const limit = Math.min(25, rows.length);
  for (let r = 0; r < limit; r++) {
    const row = rows[r];
    if (!row || !row.length) continue;
    const hd = row.map(cell => norm(String(cell ?? '')));
    const ix: Record<string, number> = {};
    let score = 0;

    for (const k in SYN) {
      ix[k] = hd.findIndex(h => h && SYN[k].some(s => h === norm(s) || h.includes(norm(s))));
      if (ix[k] >= 0) {
        score += (k === 'id' || k === 'name' || k === 'date' || k === 'in') ? 3 : 1;
      }
    }

    if (ix.datetime != null && ix.datetime >= 0) score += 4;

    if (score > maxScore) {
      maxScore = score;
      bestRow = r;
      bestIx = ix as unknown as Partial<ColumnIndexMap>;
    }
  }

  return { headerRow: bestRow, score: maxScore, ix: bestIx };
}

export function guessColumnsFromData(
  dataRows: unknown[][],
  headers: unknown[],
  detectedIx: Partial<ColumnIndexMap>
): ColumnIndexMap {
  const ix: ColumnIndexMap = {
    id: detectedIx.id ?? -1,
    name: detectedIx.name ?? -1,
    date: detectedIx.date ?? -1,
    in: detectedIx.in ?? -1,
    out: detectedIx.out ?? -1,
    school: detectedIx.school ?? -1,
    datetime: detectedIx.datetime ?? -1,
    state: detectedIx.state ?? -1,
  };

  const sample = dataRows.slice(0, 20);
  if (!sample.length) return ix;

  const colCount = Math.max(...sample.map(r => r.length));

  for (let c = 0; c < colCount; c++) {
    if (Object.values(ix).includes(c)) continue;
    const values = sample.map(r => r[c]).filter(v => v !== '' && v != null);
    if (!values.length) continue;

    if (ix.date < 0 && values.filter(v => parseDate(v) != null).length >= values.length * 0.6) {
      ix.date = c;
      continue;
    }

    if (values.filter(v => parseTime(v) != null).length >= values.length * 0.6) {
      if (ix.in < 0) {
        ix.in = c;
        continue;
      } else if (ix.out < 0 && ix.in !== c) {
        ix.out = c;
        continue;
      }
    }

    if (
      ix.id < 0 &&
      values.filter(v => {
        const s = String(v).trim();
        return /^\d{3,12}$/.test(s) || /^[A-Z0-9-]{3,12}$/i.test(s);
      }).length >= values.length * 0.7
    ) {
      ix.id = c;
      continue;
    }

    if (
      ix.name < 0 &&
      values.filter(v => {
        const s = String(v).trim();
        return /[\u0600-\u06FF]/.test(s) && s.includes(' ');
      }).length >= values.length * 0.6
    ) {
      ix.name = c;
      continue;
    }
  }

  return ix;
}

export function gradeScore(s: number): [string, string] {
  return s >= 9
    ? ['ممتاز', '#5fd3a0']
    : s >= 8
    ? ['جيد جداً', '#7cc4ee']
    : s >= 7
    ? ['جيد', '#c8dc5a']
    : s >= 5
    ? ['مقبول', '#f5b955']
    : ['ضعيف', '#f08a80'];
}

export function ingestFileRows(
  rows: unknown[][],
  manualConfig: { headerRow: number; ix: ColumnIndexMap } | null,
  fileName: string,
  cfg: AppConfig
): {
  recs: PunchRecord[];
  Q: DataQuality;
  min: string;
  max: string;
  schools: string[];
  importMeta: ImportMeta;
} {
  if (!rows || !rows.length) throw new Error('الملف فارغ أو تعذّرت قراءته.');

  let headerRow = 0;
  let ix: ColumnIndexMap;

  if (manualConfig) {
    headerRow = manualConfig.headerRow;
    ix = manualConfig.ix;
  } else {
    const found = findHeaderRow(rows);
    headerRow = found.headerRow;
    ix = guessColumnsFromData(rows.slice(headerRow + 1), rows[headerRow], found.ix);

    if (ix.datetime != null && ix.datetime >= 0) {
      if (ix.date < 0) ix.date = ix.datetime;
      if (ix.in < 0) ix.in = ix.datetime;
    }

    const missingRequired = ['id', 'name', 'date', 'in'].filter(
      k => (ix as unknown as Record<string, number>)[k] == null || (ix as unknown as Record<string, number>)[k] < 0
    );
    if (missingRequired.length) {
      const err = new Error('COLUMN_MAPPING_REQUIRED');
      (err as unknown as { rawRows: unknown[][]; headerRow: number; ix: ColumnIndexMap }).rawRows = rows;
      (err as unknown as { rawRows: unknown[][]; headerRow: number; ix: ColumnIndexMap }).headerRow = headerRow;
      (err as unknown as { rawRows: unknown[][]; headerRow: number; ix: ColumnIndexMap }).ix = ix;
      throw err;
    }
  }

  const Q: DataQuality = {
    read: 0,
    skip: 0,
    dup: 0,
    wkend: 0,
    single: 0,
    outr: 0,
    short: 0,
    long: 0,
    names: [],
    ids: [],
  };

  const map = new Map<string, { id: string; name: string; date: string; school: string; ts: number[] }>();
  const nm = new Map<string, Set<string>>();
  const idn = new Map<string, Set<string>>();

  const dataRows = rows.slice(headerRow + 1);

  for (const r of dataRows) {
    if (!r || !r.length) continue;
    const id = clean(r[ix.id]);
    const name = clean(r[ix.name])
      .replace(/\s*\/\s*new\b/gi, '')
      .replace(/\s+1$/, '')
      .trim();

    const dateVal = r[ix.date];
    const date = parseDate(dateVal);

    let inTime = parseTime(r[ix.in]);
    const outTime = ix.out >= 0 && ix.out !== ix.in ? parseTime(r[ix.out]) : null;

    if (!inTime && dateVal) {
      inTime = parseTime(dateVal);
    }

    if (!id || !name || !date) {
      Q.skip++;
      continue;
    }
    Q.read++;

    const dow = new Date(date + 'T00:00:00Z').getUTCDay();
    if (dow >= 5) Q.wkend++;

    const k = id + '|' + date;
    const ts = [inTime, outTime].filter((t): t is number => t != null);

    if (map.has(k)) {
      Q.dup++;
      map.get(k)!.ts.push(...ts);
    } else {
      const school = ix.school >= 0 && r[ix.school] ? clean(r[ix.school]) : '';
      map.set(k, { id, name, date, school, ts });
    }

    if (!idn.has(id)) idn.set(id, new Set());
    idn.get(id)!.add(name);

    if (!nm.has(name)) nm.set(name, new Set());
    nm.get(name)!.add(id);
  }

  const recs: PunchRecord[] = [];
  map.forEach(r => {
    if (!r.ts.length) {
      Q.skip++;
      return;
    }
    const a = Math.min(...r.ts),
      b = Math.max(...r.ts);
    const recItem: PunchRecord = { id: r.id, name: r.name, date: r.date, school: r.school, ts: r.ts };
    if (a === b) {
      recItem.t = a;
      Q.single++;
    } else {
      recItem.in = a;
      recItem.out = b;
      const d = b - a;
      if (d < 60) Q.short++;
      if (d > 600) Q.long++;
    }
    if (a < cfg.from || b > cfg.to) Q.outr++;
    recs.push(recItem);
  });

  idn.forEach((v, k) => {
    if (v.size > 1) Q.names.push(k + ': ' + [...v].join(' / '));
  });
  nm.forEach((v, k) => {
    if (v.size > 1) Q.ids.push(k + ': ' + [...v].join(' / '));
  });

  if (!recs.length) {
    throw new Error('لا توجد سجلات صالحة في الملف بعد المعالجة. يرجى مراجعة أعمدة التواريخ والأوقات.');
  }

  const ds = recs.map(r => r.date).sort();
  const min = ds[0];
  const max = ds[ds.length - 1];
  const schools = [...new Set(recs.map(r => r.school))].filter(Boolean) as string[];

  const importMeta: ImportMeta = {
    fileName: fileName || 'ملف البصمة',
    rawRows: rows as (string | number | Date | null | undefined)[][],
    headerRow,
    ix,
    totalPunches: Q.read,
    uniqueTeachers: new Set(recs.map(r => r.id)).size,
    pattern:
      ix.out >= 0 && ix.out !== ix.in
        ? 'سجل حضور وانصراف يومي مباشر (دخول وخروج)'
        : 'سجل حركات البصمة المجمعة (حركات متتالية)',
    dateRange: `${min} إلى ${max}`,
  };

  return { recs, Q, min, max, schools, importMeta };
}

export function analyzeRecords(
  recs: PunchRecord[],
  cfg: AppConfig,
  filters: {
    school?: string;
    from?: string;
    to?: string;
    delE?: Record<string, boolean>;
    skip?: Record<string, boolean>;
    exc?: Record<string, boolean>;
    noE?: Record<string, boolean>;
    ov?: Record<string, string>;
  }
): AnalysisResult {
  const c = cfg;
  const emps = new Map<
    string,
    { id: string; name: string; school: string; m: Map<string, PunchRecord>; raw: PunchRecord[] }
  >();
  const odd: Record<string, number> = {};

  const delE = filters.delE || {};
  const skip = filters.skip || {};
  const exc = filters.exc || {};
  const noE = filters.noE || {};
  const ov = filters.ov || {};

  recs
    .filter(
      r => (!filters.school || r.school === filters.school) && !delE[r.id] && !skip[r.id + '|' + r.date]
    )
    .forEach(r => {
      if (!emps.has(r.id)) {
        emps.set(r.id, { id: r.id, name: r.name, school: r.school || '', m: new Map(), raw: [] });
      }
      const e = emps.get(r.id)!;
      e.raw.push(r);
      const ts = [r.t, r.in, r.out].filter((t): t is number => t != null);
      const bad = Math.min(...ts) < c.from || Math.max(...ts) > c.to;
      const dow = new Date(r.date + 'T00:00:00Z').getUTCDay();
      if (bad || !c.days.includes(dow)) {
        odd[r.id] = (odd[r.id] || 0) + 1;
      }
      if (!bad) e.m.set(r.date, r);
    });

  const ds = recs.map(r => r.date).sort();
  const min = filters.from || ds[0] || '';
  const max = filters.to || ds[ds.length - 1] || '';

  const dates: string[] = [];
  if (min && max) {
    for (
      let t = Date.parse(min + 'T00:00:00Z');
      t <= Date.parse(max + 'T00:00:00Z');
      t += 864e5
    ) {
      dates.push(new Date(t).toISOString().slice(0, 10));
    }
  }

  const info: Record<string, DayInfo> = {};
  const n = emps.size;

  dates.forEach(d => {
    const dow = new Date(d + 'T00:00:00Z').getUTCDay();
    let cnt = 0;
    emps.forEach(e => {
      if (e.m.has(d)) cnt++;
    });
    let type: 'work' | 'off' | 'weekend' = !c.days.includes(dow)
      ? 'weekend'
      : cnt < (c.hol / 100) * n
      ? 'off'
      : 'work';
    if (ov[d]) type = ov[d] as 'work' | 'off' | 'weekend';
    info[d] = { dow, cnt, type, auto: !ov[d] };
  });

  const work = dates.filter(
    d => info[d].type === 'work' && (!filters.from || d >= filters.from) && (!filters.to || d <= filters.to)
  );
  const list: TeacherAnalysis[] = [];

  emps.forEach(e => {
    const o: TeacherAnalysis = {
      id: e.id,
      name: e.name,
      school: e.school,
      pres: 0,
      abs: 0,
      exc: 0,
      late: [],
      early: [],
      inc: 0,
      cells: {},
      lateMin: 0,
      earlyMin: 0,
      maxLate: 0,
      maxStreak: 0,
      severe: 0,
      noOut: 0,
      sus: 0,
      skipN: 0,
      due: 0,
      few: false,
      irr: false,
      raw: e.raw,
      att: 0,
      pun: 0,
      dep: 0,
      cmp: 0,
      score: 10,
      grade: ['ممتاز', '#5fd3a0'],
    };
    let cur = 0;

    work.forEach(d => {
      if (skip[e.id + '|' + d]) {
        o.skipN++;
        return;
      }
      const r = e.m.get(d);
      const nx = c.noExit && d === c.noExit;

      if (!r) {
        if (exc[e.id + '|' + d]) {
          o.exc++;
          o.cells[d] = 'إ';
          cur = 0;
        } else {
          o.abs++;
          o.cells[d] = 'غ';
          cur++;
          o.maxStreak = Math.max(o.maxStreak, cur);
        }
        return;
      }

      let a = r.in;
      let b = r.out;
      if (r.t != null) {
        if (r.t < c.single) {
          a = r.t;
          b = null;
        } else {
          a = null;
          b = r.t;
        }
      }

      if (a != null && b == null && !nx) o.noOut++;
      if (a != null && b != null && (b - a < 60 || b - a > 600)) o.sus++;

      // Single punch rule: in without out, or out without in
      const isSinglePunch = (a != null && b == null && !nx && !noE[e.id + '|' + d]) || (a == null && b != null);

      if (c.singleAsAbsence && isSinglePunch) {
        if (exc[e.id + '|' + d]) {
          o.exc++;
          o.cells[d] = 'إ';
          cur = 0;
        } else {
          o.abs++;
          o.cells[d] = 'غ';
          cur++;
          o.maxStreak = Math.max(o.maxStreak, cur);
        }
        o.inc++;
        return;
      }

      cur = 0;
      o.pres++;

      let code = 'ح';
      if (a != null && a > c.start + c.grace) {
        const lm = a - (c.full ? c.start : c.start + c.grace);
        o.late.push({ d, t: a, m: lm });
        o.lateMin += lm;
        o.maxLate = Math.max(o.maxLate, lm);
        if (lm >= c.severe) o.severe++;
        code = 'ت';
      }
      if (a != null && b != null && b < c.end - c.egrace && !nx && !noE[e.id + '|' + d]) {
        const em = c.end - c.egrace - b;
        o.early.push({ d, t: b, m: em });
        o.earlyMin += em;
        if (code === 'ح') code = 'م';
      }
      if ((a == null || b == null) && !(nx && b == null)) {
        o.inc++;
        if (code === 'ح') code = 'ب';
      }
      o.cells[d] = code;
    });

    o.due = work.length - o.exc - o.skipN;
    o.few = (o.pres / Math.max(1, work.length)) * 100 < c.few;
    o.irr = (odd[e.id] || 0) >= c.irrN;
    o.sus += odd[e.id] || 0;

    const P = o.pres || 1;
    o.att = o.due ? o.pres / o.due : 0;
    o.pun = (o.pres - o.late.length) / P;
    o.dep = (o.pres - o.early.length) / P;
    o.cmp = (o.pres - o.inc) / P;
    o.score = Math.max(
      0,
      10 -
        o.abs * c.pAbs -
        o.late.length * c.pLate -
        o.lateMin * c.pLateMin -
        o.early.length * c.pEarly -
        o.earlyMin * c.pEarlyMin -
        o.inc * c.pInc
    );
    o.grade = o.irr ? ['غير منتظم', '#bbb'] : gradeScore(o.score);
    list.push(o);
  });

  const ok = list.filter(o => !o.few && !o.irr);
  const sum = (a: TeacherAnalysis[], f: (item: TeacherAnalysis) => number) =>
    a.reduce((s, o) => s + f(o), 0);
  const due = sum(ok, o => o.due);
  const pr = sum(ok, o => o.pres);

  const res: AnalysisResult = {
    list,
    ok,
    dates,
    info,
    work,
    n: ok.length,
    att: due ? pr / due : 0,
    pun: pr ? (pr - sum(ok, o => o.late.length)) / pr : 0,
    avg: ok.length ? sum(ok, o => o.score) / ok.length : 0,
    lateMin: sum(ok, o => o.lateMin),
    earlyMin: sum(ok, o => o.earlyMin),
    abs: sum(ok, o => o.abs),
    emps,
    g: gradeScore(ok.length ? sum(ok, o => o.score) / ok.length : 0),
  };

  return res;
}

export function generateSampleData(): (string | number)[][] {
  const teachers = [
    { id: '104101', name: 'أحمد بن عبد الرحمن الشريف', profile: 'perfect' },
    { id: '104102', name: 'محمد بن إبراهيم القحطاني', profile: 'perfect' },
    { id: '104103', name: 'خالد بن ناصر الغامدي', profile: 'mild_late' },
    { id: '104104', name: 'عبد الله بن صالح العمري', profile: 'mild_early' },
    { id: '104105', name: 'سعد بن فهد العتيبي', profile: 'occasional_abs' },
    { id: '104106', name: 'فهد بن عبد العزيز الدوسري', profile: 'severe_late' },
    { id: '104107', name: 'إبراهيم بن يوسف المطيري', profile: 'perfect' },
    { id: '104108', name: 'سلطان بن حمود الحربي', profile: 'frequent_late' },
    { id: '104109', name: 'عمر بن عبد الكريم المالكي', profile: 'single_punch' },
    { id: '104110', name: 'طارق بن منصور الزهراني', profile: 'streak_abs' },
    { id: '104111', name: 'ياسر بن أحمد الشهري', profile: 'perfect' },
    { id: '104112', name: 'وليد بن خالد القرني', profile: 'mild_late' },
    { id: '104113', name: 'ماجد بن سالم السبيعي', profile: 'few_days' },
    { id: '104114', name: 'حسام بن عبد الله الثقفي', profile: 'perfect' },
    { id: '104115', name: 'سامي بن ناصر الشمراني', profile: 'irregular' },
  ];

  const dates: string[] = [];
  for (let d = 1; d <= 31; d++) {
    const dt = `2026-10-${p2(d)}`;
    const dow = new Date(dt + 'T00:00:00Z').getUTCDay();
    if (dow >= 0 && dow <= 4) {
      if (d !== 15) dates.push(dt); // 15 is off
    }
  }

  const rows: (string | number)[][] = [
    ['الرقم الوزاري', 'اسم المعلم', 'التاريخ', 'اول تسجيل دخول', 'اخر تسجيل خروج', 'المدرسة'],
  ];

  teachers.forEach(t => {
    dates.forEach((d, dIdx) => {
      let skipDay = false;
      let inM: number | null = 450 + Math.floor(Math.random() * 12); // 07:30 - 07:42
      let outM: number | null = 742 + Math.floor(Math.random() * 15); // 12:22 - 12:37

      if (t.profile === 'perfect') {
        // punctual
      } else if (t.profile === 'mild_late') {
        if (dIdx % 5 === 2) inM = 478 + Math.floor(Math.random() * 10); // 07:58
      } else if (t.profile === 'frequent_late') {
        if (dIdx % 3 === 0) inM = 485 + Math.floor(Math.random() * 15); // 08:05 - 08:20
      } else if (t.profile === 'severe_late') {
        if (dIdx === 6) inM = 545; // 09:05 (80m)
        if (dIdx === 14) inM = 530; // 08:50 (65m)
      } else if (t.profile === 'mild_early') {
        if (dIdx % 4 === 1) outM = 715; // 11:55
      } else if (t.profile === 'occasional_abs') {
        if (dIdx === 4 || dIdx === 11) skipDay = true;
      } else if (t.profile === 'streak_abs') {
        if (dIdx >= 8 && dIdx <= 11) skipDay = true;
      } else if (t.profile === 'single_punch') {
        if (dIdx === 3 || dIdx === 12) outM = null;
      } else if (t.profile === 'few_days') {
        if (dIdx > 4) skipDay = true;
      } else if (t.profile === 'irregular') {
        if (dIdx % 4 === 0) {
          inM = 240; // 04:00
          outM = 1100; // 18:20
        }
      }

      if (!skipDay) {
        rows.push([
          t.id,
          t.name,
          d,
          fm(inM),
          outM != null ? fm(outM) : '',
          'مدرسة الأمل الثانوية للبنين',
        ]);
      }
    });
  });

  return rows;
}

const fitW = (ws: XLSX.WorkSheet) => {
  const a = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as unknown[][];
  ws['!cols'] = (a[0] || []).map((_, i) => ({
    wch: Math.min(60, Math.max(...a.map(q => String(q[i] ?? '').length)) + 3),
  }));
};

export function exportToExcel(R: AnalysisResult, Q: DataQuality, schoolName = 'المدرسة'): void {
  const wb = XLSX.utils.book_new();

  const add = (n: string, a: (string | number | boolean | null)[][]) => {
    const w = XLSX.utils.aoa_to_sheet(a);
    fitW(w);
    XLSX.utils.book_append_sheet(wb, w, n);
  };

  add('ملخص عام', [
    ['المعلمون النشطون', R.n],
    ['أيام الدوام الفعلي', R.work.length],
    ['نسبة الحضور', pc(R.att)],
    ['إجمالي دقائق التأخير', R.lateMin],
    ['إجمالي دقائق المغادرة', R.earlyMin],
    ['إجمالي أيام الغياب', R.abs],
    ['التقييم الكلي', `${R.avg.toFixed(2)} - ${R.g[0]}`],
  ]);

  const SUMH = [
    'م', 'اسم المعلم الكامل', 'الرقم الوزاري', 'أيام الحضور', 'أيام الغياب',
    'أيام التأخير', 'مجموع دقائق التأخير', 'متوسط التأخير (د/يوم)', 'أيام المغادرة',
    'مجموع دقائق المغادرة', 'خروج غير مسجل', 'بصمات مشكوكة', 'التقييم / 10', 'التقدير'
  ];

  const sortedList = R.list
    .filter(o => !o.irr)
    .sort((x, y) => y.score - x.score)
    .concat(R.list.filter(o => o.irr));

  const sumRows = sortedList.map((o, i) => [
    i + 1,
    o.name + (o.few ? ' (بيانات ناقصة)' : o.irr ? ' (غير منتظم)' : ''),
    o.id,
    o.pres,
    o.abs,
    o.late.length,
    o.lateMin,
    o.late.length ? Math.round(o.lateMin / o.late.length) : 0,
    o.early.length,
    o.earlyMin,
    o.noOut,
    o.sus,
    o.irr ? '' : +o.score.toFixed(1),
    o.irr ? 'غير منتظم' : o.grade[0],
  ]);

  const t = (idx: number) =>
    sumRows.reduce((q, x) => q + (typeof x[idx] === 'number' ? (x[idx] as number) : 0), 0);
  const sc = sortedList.filter(o => !o.irr && !o.few);

  const totRow = [
    '',
    'الإجمالي العام لكادر المدرسة',
    '',
    t(3),
    t(4),
    t(5),
    t(6),
    t(5) ? Math.round(t(6) / t(5)) : 0,
    t(8),
    t(9),
    t(10),
    t(11),
    sc.length ? +(sc.reduce((q, o) => q + o.score, 0) / sc.length).toFixed(1) : '',
    '',
  ];

  const wsSum = XLSX.utils.aoa_to_sheet([SUMH, ...sumRows, totRow]);
  wsSum['!autofilter'] = {
    ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: sumRows.length, c: 13 } }),
  };
  fitW(wsSum);
  XLSX.utils.book_append_sheet(wb, wsSum, 'ملخص المعلمين');

  wb.Workbook = { Views: [{ RTL: true }] };
  const cleanSchool = schoolName.replace(/[\s\/\\:*?"<>|]+/g, '_');
  XLSX.writeFile(wb, `تقرير_بصمة_الدوام_${cleanSchool}.xlsx`);
}

export function downloadTemplate(): void {
  const wb = XLSX.utils.book_new();
  const headers = ['الرقم الوزاري', 'اسم المعلم', 'التاريخ', 'اول تسجيل دخول', 'اخر تسجيل خروج', 'المدرسة'];
  const sampleRows = [
    headers,
    ['102341', 'أحمد بن عبد الرحمن الشريف', '2026-10-04', '07:35', '12:25', 'مدرسة الأمل الثانوية'],
    ['102341', 'أحمد بن عبد الرحمن الشريف', '2026-10-05', '07:40', '12:20', 'مدرسة الأمل الثانوية'],
    ['102342', 'خالد بن محمد الغامدي', '2026-10-04', '07:55', '12:22', 'مدرسة الأمل الثانوية'],
    ['102343', 'عبد الله بن علي العمري', '2026-10-04', '07:30', '12:05', 'مدرسة الأمل الثانوية'],
    ['102344', 'عمر بن طارق الحربي', '2026-10-04', '07:42', '12:30', 'مدرسة الأمل الثانوية'],
  ];
  const ws = XLSX.utils.aoa_to_sheet(sampleRows);
  fitW(ws);
  XLSX.utils.book_append_sheet(wb, ws, 'سجل_البصمة');
  wb.Workbook = { Views: [{ RTL: true }] };
  XLSX.writeFile(wb, 'نموذج_بصمة_الدوام.xlsx');
}

export async function exportToPdf(
  elementId: string,
  tabTitle: string,
  schoolName: string,
  orientation: 'landscape' | 'portrait' = 'landscape'
): Promise<void> {
  const src = document.getElementById(elementId);
  if (!src) throw new Error('عنصر التقرير غير موجود للطباعة.');

  // Create an off-screen clone with exact table styles, full unclipped width, and no interactive noise
  const clone = src.cloneNode(true) as HTMLElement;
  clone.id = 'pdf-render-clone';
  clone.classList.remove('dark');
  clone.style.position = 'fixed';
  clone.style.top = '-99999px';
  clone.style.left = '0';
  clone.style.zIndex = '-9999';
  clone.style.backgroundColor = '#ffffff';
  clone.style.color = '#141c19';
  clone.style.direction = 'rtl';
  clone.style.boxSizing = 'border-box';
  clone.style.padding = '16px';
  clone.style.fontFamily = 'Tajawal, Cairo, sans-serif';

  // Ensure Print Header and Print Footer are visible
  const printHeads = clone.querySelectorAll('.printhead');
  printHeads.forEach(el => {
    const htmlEl = el as HTMLElement;
    htmlEl.style.display = 'block';
    htmlEl.classList.remove('hidden');
  });

  const printFoots = clone.querySelectorAll('.printfoot');
  printFoots.forEach(el => {
    const htmlEl = el as HTMLElement;
    htmlEl.style.display = 'flex';
    htmlEl.classList.remove('hidden');
  });

  // Remove interactive and filter elements
  const noPrintEls = clone.querySelectorAll('.noprint, nav, button, input, select');
  noPrintEls.forEach(el => {
    const tr = el.closest('tr');
    if (tr && tr.classList.contains('noprint')) {
      tr.remove();
    } else {
      (el as HTMLElement).style.display = 'none';
    }
  });

  // Remove action column headers & cells
  const actionCols = clone.querySelectorAll('th.noprint, td.noprint');
  actionCols.forEach(col => col.remove());

  // Unwrap overflow scrollbars so all columns expand to full width
  const overflowWrappers = clone.querySelectorAll('.overflow-x-auto, div[class*="overflow"]');
  overflowWrappers.forEach(el => {
    const htmlEl = el as HTMLElement;
    htmlEl.style.overflow = 'visible';
    htmlEl.style.maxWidth = 'none';
    htmlEl.style.width = '100%';
    htmlEl.style.boxShadow = 'none';
  });

  // Neutralize sticky cell positioning for canvas rendering
  const allCells = clone.querySelectorAll('th, td');
  allCells.forEach(cell => {
    const htmlCell = cell as HTMLElement;
    htmlCell.style.position = 'static';
    htmlCell.style.boxShadow = 'none';
    htmlCell.style.whiteSpace = 'nowrap';
  });

  // Temporarily attach clone to DOM to measure scroll widths and offsets
  document.body.appendChild(clone);

  // Measure the table's natural scroll width
  const table = clone.querySelector('table');
  const naturalWidth = table ? Math.max(table.scrollWidth + 30, 1400) : 1500;
  clone.style.width = `${naturalWidth}px`;
  clone.style.maxWidth = `${naturalWidth}px`;
  if (table) {
    table.style.width = '100%';
    table.style.minWidth = '100%';
  }

  try {
    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: naturalWidth + 100,
    });

    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = orientation === 'landscape' ? 297 : 210;
    const pageHeight = orientation === 'landscape' ? 210 : 297;
    const margin = 8;
    const printableWidth = pageWidth - margin * 2;
    const printableHeight = pageHeight - margin * 2;

    const totalImgHeight = (canvas.height * printableWidth) / canvas.width;

    if (totalImgHeight <= printableHeight) {
      pdf.addImage(
        canvas.toDataURL('image/jpeg', 0.98),
        'JPEG',
        margin,
        margin,
        printableWidth,
        totalImgHeight
      );
      pdf.setFontSize(8);
      pdf.setTextColor(100);
      pdf.text('نظام تحليل بصمة الدوام — صفحة 1 من 1', pageWidth / 2, pageHeight - 3, { align: 'center' });
    } else {
      // Find row boundary cut points to avoid slicing text rows in half
      const scale = canvas.height / clone.offsetHeight;
      const rowCutPoints: number[] = [];
      const trs = clone.querySelectorAll('tr');
      trs.forEach(tr => {
        const bottom = ((tr as HTMLElement).offsetTop + (tr as HTMLElement).offsetHeight) * scale;
        if (bottom > 0) rowCutPoints.push(bottom);
      });
      rowCutPoints.sort((a, b) => a - b);

      const maxSliceHeight = (canvas.width * printableHeight) / printableWidth;
      let renderedHeight = 0;
      let pageIndex = 1;

      // Estimate total pages for footer text
      const estimatedPages = Math.ceil(canvas.height / maxSliceHeight);

      while (renderedHeight < canvas.height - 2) {
        if (pageIndex > 1) pdf.addPage();

        const remainingHeight = canvas.height - renderedHeight;
        let sliceHeight = Math.min(remainingHeight, maxSliceHeight);

        // If not the final slice, align to the closest clean table row bottom
        if (remainingHeight > maxSliceHeight) {
          const idealCut = renderedHeight + maxSliceHeight;
          const candidate = [...rowCutPoints]
            .reverse()
            .find(pt => pt <= idealCut && pt >= renderedHeight + maxSliceHeight * 0.65);

          if (candidate) {
            sliceHeight = candidate - renderedHeight;
          }
        }

        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceHeight;

        const pctx = pageCanvas.getContext('2d');
        if (pctx) {
          pctx.fillStyle = '#ffffff';
          pctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
          pctx.drawImage(
            canvas,
            0,
            renderedHeight,
            canvas.width,
            sliceHeight,
            0,
            0,
            canvas.width,
            sliceHeight
          );
        }

        const sliceImgHeight = (sliceHeight * printableWidth) / canvas.width;
        pdf.addImage(
          pageCanvas.toDataURL('image/jpeg', 0.98),
          'JPEG',
          margin,
          margin,
          printableWidth,
          sliceImgHeight
        );

        pdf.setFontSize(8);
        pdf.setTextColor(100);
        pdf.text(
          `نظام تحليل بصمة الدوام — صفحة ${pageIndex} من ${Math.max(pageIndex, estimatedPages)}`,
          pageWidth / 2,
          pageHeight - 3,
          { align: 'center' }
        );

        renderedHeight += sliceHeight;
        pageIndex++;
      }
    }

    const cleanSchool = (schoolName || 'المدرسة').replace(/[\s\/\\:*?"<>|]+/g, '_');
    const cleanTitle = (tabTitle || 'تقرير_الدوام').replace(/[\s\/\\:*?"<>|]+/g, '_');
    const dateStr = new Date().toISOString().slice(0, 10);
    pdf.save(`${cleanTitle}_${cleanSchool}_${dateStr}.pdf`);
  } finally {
    clone.remove();
  }
}
