import React, { useState, useMemo } from 'react';
import { AnalysisResult, AppConfig } from '../../types';
import { dn, fm, normSearch } from '../../utils/engine';
import {
  X,
  Check,
  AlertTriangle,
  UserX,
  LogIn,
  LogOut,
  CalendarX,
  ShieldAlert,
  Info,
  CheckCircle2,
  Filter,
} from 'lucide-react';

interface AbsenceTabProps {
  analysis: AnalysisResult;
  cfg: AppConfig;
  onUpdateCfg?: (key: keyof AppConfig, value: unknown) => void;
  excusedMap: Record<string, boolean>;
  onToggleExcuse: (key: string) => void;
  onSkipRecord: (key: string) => void;
}

export type AbsenceCategory = 'all' | 'no_punches' | 'in_only' | 'out_only' | 'excused';

export const AbsenceTab: React.FC<AbsenceTabProps> = ({
  analysis,
  cfg,
  onUpdateCfg,
  excusedMap,
  onToggleExcuse,
  onSkipRecord,
}) => {
  const [filters, setFilters] = useState<Record<number, string>>({});
  const [activeCategory, setActiveCategory] = useState<AbsenceCategory>('all');
  const [sortCol, setSortCol] = useState<number>(1); // Default sort by Teacher Name
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Extract raw absence rows based on user conditions
  const rawRows = useMemo(() => {
    const rows: {
      idx: number;
      name: string;
      id: string;
      date: string;
      dateDisplay: string;
      dayName: string;
      inTime: string;
      outTime: string;
      rawIn: number | null;
      rawOut: number | null;
      absenceType: 'no_punches' | 'in_only' | 'out_only';
      absenceTypeLabel: string;
      note: string;
      isExcused: boolean;
      key: string;
    }[] = [];

    // Filter teachers and sort alphabetically by Arabic name
    analysis.list
      .filter(o => !o.irr && !o.few)
      .slice()
      .sort((x, y) => x.name.localeCompare(y.name, 'ar'))
      .forEach(o => {
        const emp = analysis.emps.get(o.id);
        const ks = emp ? [...emp.m.keys()] : [];
        const mk = ks.sort();

        analysis.work.forEach(d => {
          const r = emp?.m.get(d);
          const c = o.cells[d];
          const isExcused = c === 'إ' || !!excusedMap[`${o.id}|${d}`];

          let a: number | null = null;
          let b: number | null = null;

          if (r) {
            a = r.in ?? null;
            b = r.out ?? null;
            if (r.t != null) {
              if (r.t < cfg.single) {
                a = r.t;
                b = null;
              } else {
                a = null;
                b = r.t;
              }
            }
          }

          const hasNoPunches = !r || (a == null && b == null);
          const hasInOnly = a != null && b == null;
          const hasOutOnly = a == null && b != null;

          // Check if this date/day qualifies as absence:
          // Condition 1: Neither in nor out punches exist -> Considered Absent
          // Condition 2: Has in punch but no out, or has out punch but no in -> Counted as Absent
          let absenceType: 'no_punches' | 'in_only' | 'out_only' | null = null;
          let absenceTypeLabel = '';

          if (hasNoPunches) {
            absenceType = 'no_punches';
            absenceTypeLabel = 'غياب كامل (لا توجد بصمة دخول ولا خروج)';
          } else if (hasInOnly) {
            absenceType = 'in_only';
            absenceTypeLabel = 'غياب (له بصمة دخول فقط دون تسجيل خروج)';
          } else if (hasOutOnly) {
            absenceType = 'out_only';
            absenceTypeLabel = 'غياب (له بصمة خروج فقط دون تسجيل دخول)';
          }

          // If it is an absence condition or marked as absent/excused
          if (!absenceType) return;

          // If singleAsAbsence is disabled, only include single punches if explicitly allowed, but default is included
          if (!cfg.singleAsAbsence && (absenceType === 'in_only' || absenceType === 'out_only') && c !== 'غ' && c !== 'إ') {
            return;
          }

          let note = '';
          if (isExcused) {
            note = 'إجازة / غياب مبرَّر رسمياً';
          } else if (absenceType === 'no_punches') {
            const monthPunches = ks.filter(k => k.slice(0, 7) === d.slice(0, 7));
            if (!monthPunches.length) {
              note = 'لا توجد أي بصمات للمعلم خلال هذا الشهر';
            } else if (d < monthPunches[0]) {
              note = 'تاريخ قبل أول بصمة مسجلة للمعلم في الشهر';
            } else if (d > monthPunches[monthPunches.length - 1]) {
              note = 'تاريخ بعد آخر بصمة مسجلة للمعلم في الشهر';
            } else {
              note = 'غياب اعتيادي كامل (عدم الحضور للمدرسة)';
            }
          } else if (absenceType === 'in_only') {
            note = `وُجدت بصمة دخول (${fm(a)})، ولكن لم تُسجل بصمة خروج`;
          } else if (absenceType === 'out_only') {
            note = `وُجدت بصمة خروج (${fm(b)})، ولكن لم تُسجل بصمة دخول`;
          }

          rows.push({
            idx: 0,
            name: o.name,
            id: o.id,
            date: d,
            dateDisplay: `${d.slice(8)}/${d.slice(5, 7)}/${d.slice(0, 4)}`,
            dayName: dn(d),
            inTime: fm(a),
            outTime: fm(b),
            rawIn: a,
            rawOut: b,
            absenceType,
            absenceTypeLabel,
            note,
            isExcused,
            key: `${o.id}|${d}`,
          });
        });
      });

    // Populate sequence index
    rows.forEach((r, i) => (r.idx = i + 1));
    return rows;
  }, [analysis, cfg, excusedMap]);

  // Statistics counters
  const stats = useMemo(() => {
    let noPunches = 0;
    let inOnly = 0;
    let outOnly = 0;
    let excused = 0;

    rawRows.forEach(r => {
      if (r.isExcused) excused++;
      else if (r.absenceType === 'no_punches') noPunches++;
      else if (r.absenceType === 'in_only') inOnly++;
      else if (r.absenceType === 'out_only') outOnly++;
    });

    return {
      total: rawRows.length,
      noPunches,
      inOnly,
      outOnly,
      singleTotal: inOnly + outOnly,
      excused,
    };
  }, [rawRows]);

  // Filter rows by category and column filters
  const filteredRows = useMemo(() => {
    let list = rawRows;

    // Apply category filter
    if (activeCategory === 'no_punches') {
      list = list.filter(r => r.absenceType === 'no_punches' && !r.isExcused);
    } else if (activeCategory === 'in_only') {
      list = list.filter(r => r.absenceType === 'in_only' && !r.isExcused);
    } else if (activeCategory === 'out_only') {
      list = list.filter(r => r.absenceType === 'out_only' && !r.isExcused);
    } else if (activeCategory === 'excused') {
      list = list.filter(r => r.isExcused);
    }

    // Apply column text filters
    const activeEntries = Object.entries(filters).filter(([, v]) => v && v.trim() !== '');
    if (activeEntries.length > 0) {
      list = list.filter(r => {
        return activeEntries.every(([colIdxStr, filterVal]) => {
          const colIdx = +colIdxStr;
          const fVal = filterVal.trim();
          let cellText = '';

          switch (colIdx) {
            case 0: cellText = String(r.idx); break;
            case 1: cellText = r.name; break;
            case 2: cellText = r.id; break;
            case 3: cellText = r.dateDisplay; break;
            case 4: cellText = r.dayName; break;
            case 5: cellText = r.inTime || 'لم تسجل'; break;
            case 6: cellText = r.outTime || 'لم تسجل'; break;
            case 7: cellText = r.absenceTypeLabel; break;
            case 8: cellText = r.note; break;
          }

          const searchTokens = normSearch(fVal).split(/\s+/).filter(Boolean);
          const normCell = normSearch(cellText);
          return searchTokens.every(tok => normCell.includes(tok));
        });
      });
    }

    // Apply sorting
    return [...list].sort((a, b) => {
      let va: any;
      let vb: any;

      switch (sortCol) {
        case 0: va = a.idx; vb = b.idx; break;
        case 1: va = a.name; vb = b.name; break;
        case 2: va = a.id; vb = b.id; break;
        case 3: va = a.date; vb = b.date; break;
        case 4: va = a.dayName; vb = b.dayName; break;
        case 5: va = a.rawIn ?? -1; vb = b.rawIn ?? -1; break;
        case 6: va = a.rawOut ?? -1; vb = b.rawOut ?? -1; break;
        case 7: va = a.absenceTypeLabel; vb = b.absenceTypeLabel; break;
        case 8: va = a.note; vb = b.note; break;
        default: va = a.name; vb = b.name;
      }

      if (typeof va === 'number' && typeof vb === 'number') {
        return sortAsc ? va - vb : vb - va;
      }

      const cmp = sortAsc
        ? String(va).localeCompare(String(vb), 'ar')
        : String(vb).localeCompare(String(va), 'ar');
      if (cmp !== 0) return cmp;
      return a.date.localeCompare(b.date);
    });
  }, [rawRows, activeCategory, filters, sortCol, sortAsc]);

  const handleSort = (colIdx: number) => {
    if (sortCol === colIdx) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(colIdx);
      setSortAsc(true);
    }
  };

  const activeFilterCount = Object.values(filters).filter(v => v && v.trim() !== '').length;

  return (
    <div className="space-y-4">
      {/* Condition & Policy Rule Banner */}
      <div className="p-4 bg-white dark:bg-[#102627] border-2 border-[#1f8a6a] dark:border-[#386062] rounded-xl shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-[#0f3d3e] dark:text-emerald-300">
                <ShieldAlert className="w-5 h-5 text-[#1f8a6a]" />
              </span>
              <h3 className="font-bold text-sm md:text-base font-reem text-[#0f3d3e] dark:text-[#f2b933]">
                قواعد وشروط احتساب الغياب في النظام
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs text-[#141c19] dark:text-[#e6f1ee]">
              {/* Condition 1 */}
              <div className="p-2.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <b className="text-emerald-900 dark:text-emerald-300 font-bold block mb-0.5">
                    الشرط الأول: الغياب الكامل (عدم الحضور)
                  </b>
                  <p className="text-[#435b54] dark:text-[#9bb5b0] leading-relaxed">
                    إذا <b>لا يوجد بصمة دخول وبصمة خروج</b> في تاريخ ويوم معين، يُعتبر المعلم غائباً غياباً كاملاً.
                  </p>
                </div>
              </div>

              {/* Condition 2 */}
              <div className="p-2.5 rounded-lg bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <b className="text-amber-900 dark:text-amber-300 font-bold block mb-0.5">
                    الشرط الثاني: البصمة الفردية الناقصة (محتسبة غياب)
                  </b>
                  <p className="text-[#435b54] dark:text-[#9bb5b0] leading-relaxed">
                    إذا وُجدت <b>بصمة دخول دون بصمة خروج</b>، أو <b>بصمة خروج دون بصمة دخول</b>، يُحتسب ذلك اليوم غياباً لعدم اكتمال الحركة.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Configuration Toggle Switch */}
          {onUpdateCfg && (
            <div className="noprint p-3 bg-[#eef2ef] dark:bg-[#091718] border border-[#d5dfdb] dark:border-[#213e3f] rounded-xl flex flex-col gap-2 shrink-0">
              <span className="text-xs font-bold text-[#0f3d3e] dark:text-[#eaf3f0]">
                حالة احتساب البصمة الفردية:
              </span>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={cfg.singleAsAbsence}
                  onChange={e => onUpdateCfg('singleAsAbsence', e.target.checked)}
                  className="w-4 h-4 rounded text-[#1f8a6a] focus:ring-[#1f8a6a]"
                />
                <span className="text-xs font-semibold text-[#141c19] dark:text-[#e6f1ee]">
                  احتساب دخول فقط / خروج فقط كغياب
                </span>
              </label>
              <span className="text-[11px] text-[#435b54] dark:text-[#9bb5b0]">
                {cfg.singleAsAbsence
                  ? '✓ مفعّل: تضاف تلقائياً لصفحة الغياب ومصفوفة الدوام'
                  : 'تنبيه: معطل حالياً في الحسابات العامة'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {/* Total Absences */}
        <div
          onClick={() => setActiveCategory('all')}
          className={`p-3 bg-white dark:bg-[#102627] border rounded-xl shadow-xs cursor-pointer transition-all ${
            activeCategory === 'all'
              ? 'border-[#0f3d3e] dark:border-[#f2b933] ring-2 ring-[#0f3d3e]/20'
              : 'border-[#d5dfdb] dark:border-[#213e3f] hover:border-[#1f8a6a]'
          }`}
          style={{ borderTop: '4px solid #0f3d3e' }}
        >
          <span className="text-xs font-semibold text-[#435b54] dark:text-[#9bb5b0] block mb-1">
            إجمالي سجلات الغياب
          </span>
          <b className="text-xl md:text-2xl font-bold font-mono text-[#0f3d3e] dark:text-[#f2b933]">
            {stats.total.toLocaleString('ar-EG')}
          </b>
        </div>

        {/* Complete Absence */}
        <div
          onClick={() => setActiveCategory('no_punches')}
          className={`p-3 bg-white dark:bg-[#102627] border rounded-xl shadow-xs cursor-pointer transition-all ${
            activeCategory === 'no_punches'
              ? 'border-rose-600 ring-2 ring-rose-600/20'
              : 'border-[#d5dfdb] dark:border-[#213e3f] hover:border-rose-400'
          }`}
          style={{ borderTop: '4px solid #c4473a' }}
        >
          <span className="text-xs font-semibold text-[#435b54] dark:text-[#9bb5b0] block mb-1">
            غياب كامل (بدون أي بصمة)
          </span>
          <b className="text-xl md:text-2xl font-bold font-mono text-rose-600">
            {stats.noPunches.toLocaleString('ar-EG')}
          </b>
        </div>

        {/* In Only */}
        <div
          onClick={() => setActiveCategory('in_only')}
          className={`p-3 bg-white dark:bg-[#102627] border rounded-xl shadow-xs cursor-pointer transition-all ${
            activeCategory === 'in_only'
              ? 'border-amber-600 ring-2 ring-amber-600/20'
              : 'border-[#d5dfdb] dark:border-[#213e3f] hover:border-amber-400'
          }`}
          style={{ borderTop: '4px solid #e9a914' }}
        >
          <span className="text-xs font-semibold text-[#435b54] dark:text-[#9bb5b0] block mb-1">
            غياب: دخول دون خروج
          </span>
          <b className="text-xl md:text-2xl font-bold font-mono text-amber-600">
            {stats.inOnly.toLocaleString('ar-EG')}
          </b>
        </div>

        {/* Out Only */}
        <div
          onClick={() => setActiveCategory('out_only')}
          className={`p-3 bg-white dark:bg-[#102627] border rounded-xl shadow-xs cursor-pointer transition-all ${
            activeCategory === 'out_only'
              ? 'border-yellow-600 ring-2 ring-yellow-600/20'
              : 'border-[#d5dfdb] dark:border-[#213e3f] hover:border-yellow-400'
          }`}
          style={{ borderTop: '4px solid #f0922b' }}
        >
          <span className="text-xs font-semibold text-[#435b54] dark:text-[#9bb5b0] block mb-1">
            غياب: خروج دون دخول
          </span>
          <b className="text-xl md:text-2xl font-bold font-mono text-yellow-700 dark:text-yellow-400">
            {stats.outOnly.toLocaleString('ar-EG')}
          </b>
        </div>

        {/* Excused Absences */}
        <div
          onClick={() => setActiveCategory('excused')}
          className={`p-3 bg-white dark:bg-[#102627] border rounded-xl shadow-xs cursor-pointer transition-all ${
            activeCategory === 'excused'
              ? 'border-blue-600 ring-2 ring-blue-600/20'
              : 'border-[#d5dfdb] dark:border-[#213e3f] hover:border-blue-400'
          }`}
          style={{ borderTop: '4px solid #4472c4' }}
        >
          <span className="text-xs font-semibold text-[#435b54] dark:text-[#9bb5b0] block mb-1">
            إجازات وغياب مبرَّر
          </span>
          <b className="text-xl md:text-2xl font-bold font-mono text-blue-600">
            {stats.excused.toLocaleString('ar-EG')}
          </b>
        </div>
      </div>

      {/* Filter Ribbon & Category Pills */}
      <div className="noprint flex flex-wrap items-center justify-between gap-3 p-2.5 bg-white dark:bg-[#102627] border border-[#d5dfdb] dark:border-[#213e3f] rounded-xl text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-bold text-[#435b54] dark:text-[#9bb5b0] ml-2">تصفية سريعة:</span>
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              activeCategory === 'all'
                ? 'bg-[#0f3d3e] text-white shadow-xs'
                : 'bg-[#eef2ef] dark:bg-[#091718] text-[#141c19] dark:text-[#e6f1ee] hover:bg-slate-200'
            }`}
          >
            جميع حالات الغياب ({stats.total})
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('no_punches')}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              activeCategory === 'no_punches'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100'
            }`}
          >
            غياب كامل بدون بصمات ({stats.noPunches})
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('in_only')}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              activeCategory === 'in_only'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
            }`}
          >
            دخول دون خروج ({stats.inOnly})
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('out_only')}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              activeCategory === 'out_only'
                ? 'bg-yellow-600 text-white shadow-xs'
                : 'bg-yellow-50 dark:bg-yellow-950/40 text-yellow-800 dark:text-yellow-300 hover:bg-yellow-100'
            }`}
          >
            خروج دون دخول ({stats.outOnly})
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('excused')}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              activeCategory === 'excused'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100'
            }`}
          >
            مبرَّر ({stats.excused})
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div>
            يُعرض <b>{filteredRows.length}</b> من أصل <b>{rawRows.length}</b> سجل غياب
          </div>
          {(activeFilterCount > 0 || activeCategory !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setFilters({});
                setActiveCategory('all');
              }}
              className="px-2.5 py-1 text-xs font-bold text-white rounded-lg bg-rose-600 hover:bg-rose-700 transition-colors"
            >
              مسح التصفية ✕
            </button>
          )}
        </div>
      </div>

      {/* Main Absence Data Table */}
      <div className="overflow-x-auto border border-[#d5dfdb] dark:border-[#213e3f] rounded-xl bg-white dark:bg-[#102627] shadow-xs custom-scroll">
        <table className="w-full text-xs text-center border-collapse whitespace-nowrap min-w-max">
          <thead>
            <tr className="bg-[#d3e7e0] dark:bg-[#082829] text-[#0e3334] dark:text-[#eaf3f0] font-bold border-b border-[#9fb3ad] dark:border-[#386062]">
              <th onClick={() => handleSort(0)} className="p-2 border-l border-[#9fb3ad] dark:border-[#386062] w-12 cursor-pointer">
                م {sortCol === 0 ? (sortAsc ? '▲' : '▼') : ''}
              </th>
              <th onClick={() => handleSort(1)} className="p-2 text-right border-l border-[#9fb3ad] dark:border-[#386062] min-w-[220px] cursor-pointer">
                اسم المعلم {sortCol === 1 ? (sortAsc ? '▲' : '▼') : ''}
              </th>
              <th onClick={() => handleSort(2)} className="p-2 border-l border-[#9fb3ad] dark:border-[#386062] cursor-pointer">
                الرقم الوزاري {sortCol === 2 ? (sortAsc ? '▲' : '▼') : ''}
              </th>
              <th onClick={() => handleSort(3)} className="p-2 border-l border-[#9fb3ad] dark:border-[#386062] cursor-pointer">
                التاريخ {sortCol === 3 ? (sortAsc ? '▲' : '▼') : ''}
              </th>
              <th onClick={() => handleSort(4)} className="p-2 border-l border-[#9fb3ad] dark:border-[#386062] cursor-pointer">
                اليوم {sortCol === 4 ? (sortAsc ? '▲' : '▼') : ''}
              </th>
              <th onClick={() => handleSort(5)} className="p-2 border-l border-[#9fb3ad] dark:border-[#386062] cursor-pointer">
                بصمة الدخول {sortCol === 5 ? (sortAsc ? '▲' : '▼') : ''}
              </th>
              <th onClick={() => handleSort(6)} className="p-2 border-l border-[#9fb3ad] dark:border-[#386062] cursor-pointer">
                بصمة الخروج {sortCol === 6 ? (sortAsc ? '▲' : '▼') : ''}
              </th>
              <th onClick={() => handleSort(7)} className="p-2 text-right border-l border-[#9fb3ad] dark:border-[#386062] min-w-[220px] cursor-pointer">
                سند وحالة الغياب {sortCol === 7 ? (sortAsc ? '▲' : '▼') : ''}
              </th>
              <th onClick={() => handleSort(8)} className="p-2 text-right border-l border-[#9fb3ad] dark:border-[#386062] min-w-[240px] cursor-pointer">
                الملاحظة {sortCol === 8 ? (sortAsc ? '▲' : '▼') : ''}
              </th>
              <th className="p-2 noprint w-24">إجراء التبرير</th>
              <th className="p-2 noprint w-9"></th>
            </tr>

            {/* Filter inputs row */}
            <tr className="noprint bg-[#e2ede8] dark:bg-[#0b3334] border-b-2 border-[#9fb3ad] dark:border-[#386062]">
              <th className="p-1 border-l border-[#9fb3ad] dark:border-[#386062]">
                <input
                  type="text"
                  placeholder="#"
                  value={filters[0] || ''}
                  onChange={e => setFilters({ ...filters, 0: e.target.value })}
                  className="w-full px-1 py-0.5 text-[11px] text-center bg-white dark:bg-[#102627] border border-[#9fb3ad] dark:border-[#386062] rounded"
                />
              </th>
              <th className="p-1 border-l border-[#9fb3ad] dark:border-[#386062]">
                <input
                  type="text"
                  placeholder="المعلم…"
                  value={filters[1] || ''}
                  onChange={e => setFilters({ ...filters, 1: e.target.value })}
                  className="w-full px-2 py-0.5 text-[11px] text-right bg-white dark:bg-[#102627] border border-[#9fb3ad] dark:border-[#386062] rounded"
                />
              </th>
              <th className="p-1 border-l border-[#9fb3ad] dark:border-[#386062]">
                <input
                  type="text"
                  placeholder="الرقم…"
                  value={filters[2] || ''}
                  onChange={e => setFilters({ ...filters, 2: e.target.value })}
                  className="w-full px-1 py-0.5 text-[11px] text-center bg-white dark:bg-[#102627] border border-[#9fb3ad] dark:border-[#386062] rounded"
                />
              </th>
              <th className="p-1 border-l border-[#9fb3ad] dark:border-[#386062]">
                <input
                  type="text"
                  placeholder="تاريخ…"
                  value={filters[3] || ''}
                  onChange={e => setFilters({ ...filters, 3: e.target.value })}
                  className="w-full px-1 py-0.5 text-[11px] text-center bg-white dark:bg-[#102627] border border-[#9fb3ad] dark:border-[#386062] rounded"
                />
              </th>
              <th className="p-1 border-l border-[#9fb3ad] dark:border-[#386062]">
                <input
                  type="text"
                  placeholder="اليوم…"
                  value={filters[4] || ''}
                  onChange={e => setFilters({ ...filters, 4: e.target.value })}
                  className="w-full px-1 py-0.5 text-[11px] text-center bg-white dark:bg-[#102627] border border-[#9fb3ad] dark:border-[#386062] rounded"
                />
              </th>
              <th className="p-1 border-l border-[#9fb3ad] dark:border-[#386062]">
                <input
                  type="text"
                  placeholder="دخول…"
                  value={filters[5] || ''}
                  onChange={e => setFilters({ ...filters, 5: e.target.value })}
                  className="w-full px-1 py-0.5 text-[11px] text-center bg-white dark:bg-[#102627] border border-[#9fb3ad] dark:border-[#386062] rounded"
                />
              </th>
              <th className="p-1 border-l border-[#9fb3ad] dark:border-[#386062]">
                <input
                  type="text"
                  placeholder="خروج…"
                  value={filters[6] || ''}
                  onChange={e => setFilters({ ...filters, 6: e.target.value })}
                  className="w-full px-1 py-0.5 text-[11px] text-center bg-white dark:bg-[#102627] border border-[#9fb3ad] dark:border-[#386062] rounded"
                />
              </th>
              <th className="p-1 border-l border-[#9fb3ad] dark:border-[#386062]">
                <select
                  value={filters[7] || ''}
                  onChange={e => setFilters({ ...filters, 7: e.target.value })}
                  className="w-full px-1 py-0.5 text-[11px] text-center bg-white dark:bg-[#102627] border border-[#9fb3ad] dark:border-[#386062] rounded"
                >
                  <option value="">الكل</option>
                  <option value="كامل">غياب كامل</option>
                  <option value="دخول فقط">دخول دون خروج</option>
                  <option value="خروج فقط">خروج دون دخول</option>
                </select>
              </th>
              <th className="p-1 border-l border-[#9fb3ad] dark:border-[#386062]">
                <input
                  type="text"
                  placeholder="ملاحظة…"
                  value={filters[8] || ''}
                  onChange={e => setFilters({ ...filters, 8: e.target.value })}
                  className="w-full px-1 py-0.5 text-[11px] text-right bg-white dark:bg-[#102627] border border-[#9fb3ad] dark:border-[#386062] rounded"
                />
              </th>
              <th className="p-1 noprint"></th>
              <th className="p-1 noprint"></th>
            </tr>
          </thead>

          <tbody>
            {filteredRows.map((r, i) => (
              <tr
                key={r.key}
                className="odd:bg-white even:bg-[#f6f9f7] dark:odd:bg-[#102627] dark:even:bg-[#0c1e1f] hover:bg-amber-50/70 dark:hover:bg-amber-950/30 transition-colors"
              >
                {/* Index */}
                <td className="p-2 border-b border-l border-[#d5dfdb] dark:border-[#213e3f] font-mono font-bold text-sm md:text-base text-[#435b54] dark:text-[#9bb5b0]">
                  {r.idx}
                </td>

                {/* Name */}
                <td className="p-2 text-right border-b border-l border-[#d5dfdb] dark:border-[#213e3f] font-bold text-sm md:text-base">
                  {r.name}
                </td>

                {/* Employee ID */}
                <td className="p-2 border-b border-l border-[#d5dfdb] dark:border-[#213e3f] text-[#435b54] dark:text-[#9bb5b0] font-mono font-bold text-sm md:text-base">
                  {r.id}
                </td>

                {/* Date */}
                <td className="p-2 border-b border-l border-[#d5dfdb] dark:border-[#213e3f] font-mono font-semibold text-sm md:text-base">
                  {r.dateDisplay}
                </td>

                {/* Day name */}
                <td className="p-2 border-b border-l border-[#d5dfdb] dark:border-[#213e3f] text-xs md:text-sm font-medium">
                  {r.dayName}
                </td>

                {/* Punch In */}
                <td className="p-2 border-b border-l border-[#d5dfdb] dark:border-[#213e3f] font-mono font-bold text-sm md:text-base">
                  {r.inTime ? (
                    <span className="text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                      {r.inTime}
                    </span>
                  ) : (
                    <span className="text-rose-600 font-bold opacity-80">-</span>
                  )}
                </td>

                {/* Punch Out */}
                <td className="p-2 border-b border-l border-[#d5dfdb] dark:border-[#213e3f] font-mono font-bold text-sm md:text-base">
                  {r.outTime ? (
                    <span className="text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded">
                      {r.outTime}
                    </span>
                  ) : (
                    <span className="text-rose-600 font-bold opacity-80">-</span>
                  )}
                </td>

                {/* Absence Reason & Status Badge */}
                <td className="p-2 text-right border-b border-l border-[#d5dfdb] dark:border-[#213e3f]">
                  {r.isExcused ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-200">
                      <Check className="w-3.5 h-3.5" />
                      إجازة / غياب مبرَّر رسمياً
                    </span>
                  ) : r.absenceType === 'no_punches' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200">
                      <UserX className="w-3.5 h-3.5" />
                      لا دخول ولا خروج (غياب كامل)
                    </span>
                  ) : r.absenceType === 'in_only' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200">
                      <LogIn className="w-3.5 h-3.5" />
                      دخول فقط — لم تسجل بصمة الخروج
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-yellow-100 dark:bg-yellow-950/60 text-yellow-900 dark:text-yellow-200">
                      <LogOut className="w-3.5 h-3.5" />
                      خروج فقط — لم تسجل بصمة الدخول
                    </span>
                  )}
                </td>

                {/* Note */}
                <td className="p-2 text-right border-b border-l border-[#d5dfdb] dark:border-[#213e3f] text-xs md:text-sm text-[#435b54] dark:text-[#9bb5b0]">
                  {r.note}
                </td>

                {/* Excuse Action Button */}
                <td className="p-2 border-b border-l border-[#d5dfdb] dark:border-[#213e3f] noprint">
                  <button
                    type="button"
                    onClick={() => onToggleExcuse(r.key)}
                    className={`px-2.5 py-1 rounded text-xs font-bold border transition-all ${
                      r.isExcused
                        ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                        : 'bg-blue-50 hover:bg-blue-100 border-blue-300 text-blue-700'
                    }`}
                  >
                    {r.isExcused ? 'إلغاء التبرير' : 'تحويل لمبرَّر ✓'}
                  </button>
                </td>

                {/* Skip Row Action */}
                <td className="p-2 border-b border-[#d5dfdb] dark:border-[#213e3f] noprint">
                  <button
                    type="button"
                    onClick={() => onSkipRecord(r.key)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                    title="استبعاد السجل"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="noprint p-3 bg-white dark:bg-[#102627] border border-[#d5dfdb] dark:border-[#213e3f] rounded-xl text-xs text-[#435b54] dark:text-[#9bb5b0] flex items-center justify-between">
        <p>
          💡 <b>ملاحظة:</b> يتم احتساب الغياب تلقائياً لكل يوم عمل لم يسجل فيه المعلم دخول وخروج كاملين، ويمكن تحويل أي غياب إلى «مبرَّر» بنقرة واحدة لحفظ حقوق المعلم الإدارية.
        </p>
      </div>
    </div>
  );
};
