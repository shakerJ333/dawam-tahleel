import React, { useState, useMemo } from 'react';
import { TeacherAnalysis } from '../../types';
import { normSearch } from '../../utils/engine';
import { X, FileText, Filter, Users, CalendarCheck, CalendarX, Clock, DoorOpen, Star, Printer } from 'lucide-react';

interface SummaryTabProps {
  teachers: TeacherAnalysis[];
  onDeleteTeacher: (id: string) => void;
  onExportPdf: () => void;
  isExportingPdf?: boolean;
  onPrint?: () => void;
}

export const SummaryTab: React.FC<SummaryTabProps> = ({
  teachers,
  onDeleteTeacher,
  onExportPdf,
  isExportingPdf,
  onPrint,
}) => {
  // Column filters state
  const [colFilters, setColFilters] = useState<Record<number, string>>({});
  // Sorting state - default sort alphabetically by Teacher Name (column 1, ascending)
  const [sortCol, setSortCol] = useState<number>(1);
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Prepare base sorted rows - default alphabetical order by teacher name
  const sortedBase = useMemo(() => {
    return [...teachers].sort((x, y) => x.name.localeCompare(y.name, 'ar'));
  }, [teachers]);

  // Max values for proportional bars
  const maxLateMin = useMemo(
    () => Math.max(1, ...sortedBase.map(o => o.lateMin)),
    [sortedBase]
  );
  const maxEarlyMin = useMemo(
    () => Math.max(1, ...sortedBase.map(o => o.earlyMin)),
    [sortedBase]
  );

  // Row mapper
  const rawRows = useMemo(() => {
    return sortedBase.map((o, idx) => {
      const avgLate = o.late.length ? Math.round(o.lateMin / o.late.length) : 0;
      return {
        idx: idx + 1,
        name: o.name,
        rawTeacher: o,
        id: o.id,
        pres: o.pres,
        abs: o.abs,
        lateDays: o.late.length,
        lateMin: o.lateMin,
        avgLate,
        earlyDays: o.early.length,
        earlyMin: o.earlyMin,
        noOut: o.noOut,
        sus: o.sus,
        score: o.irr ? '' : +o.score.toFixed(1),
        scoreVal: o.irr ? -1 : o.score,
        grade: o.irr ? 'غير منتظم' : o.grade[0],
        gradeColor: o.grade[1],
        isFew: o.few,
        isIrr: o.irr,
      };
    });
  }, [sortedBase]);

  // Apply filters
  const filteredRows = useMemo(() => {
    const activeEntries = Object.entries(colFilters).filter(([, val]) => val && val.trim() !== '');

    if (!activeEntries.length) return rawRows;

    return rawRows.filter(r => {
      return activeEntries.every(([colIdxStr, filterVal]) => {
        const colIdx = +colIdxStr;
        const fVal = filterVal.trim();
        let cellText = '';
        let cellNum: number | null = null;

        switch (colIdx) {
          case 0: cellText = String(r.idx); cellNum = r.idx; break;
          case 1: cellText = r.name; break;
          case 2: cellText = r.id; break;
          case 3: cellText = String(r.pres); cellNum = r.pres; break;
          case 4: cellText = String(r.abs); cellNum = r.abs; break;
          case 5: cellText = String(r.lateDays); cellNum = r.lateDays; break;
          case 6: cellText = String(r.lateMin); cellNum = r.lateMin; break;
          case 7: cellText = String(r.avgLate); cellNum = r.avgLate; break;
          case 8: cellText = String(r.earlyDays); cellNum = r.earlyDays; break;
          case 9: cellText = String(r.earlyMin); cellNum = r.earlyMin; break;
          case 10: cellText = String(r.noOut); cellNum = r.noOut; break;
          case 11: cellText = String(r.sus); cellNum = r.sus; break;
          case 12: cellText = String(r.score); cellNum = r.scoreVal; break;
          case 13: cellText = r.grade; break;
        }

        // Check for numeric comparison operators: >=, <=, >, <, =, !=
        const opMatch = fVal.match(/^(>=|<=|>|<|=|==|!=)\s*(-?[\d.]+)$/);
        if (opMatch && cellNum != null) {
          const target = +opMatch[2];
          const op = opMatch[1];
          if (op === '>') return cellNum > target;
          if (op === '<') return cellNum < target;
          if (op === '>=') return cellNum >= target;
          if (op === '<=') return cellNum <= target;
          if (op === '!=') return cellNum !== target;
          return cellNum === target;
        }

        // Check for range: 10..20 or 10-20
        const rangeMatch = fVal.match(/^(\d+)\s*(\.\.|-)\s*(\d+)$/);
        if (rangeMatch && cellNum != null) {
          return cellNum >= +rangeMatch[1] && cellNum <= +rangeMatch[3];
        }

        // Text search
        const searchTokens = normSearch(fVal).split(/\s+/).filter(Boolean);
        const normCell = normSearch(cellText);
        return searchTokens.every(tok => normCell.includes(tok));
      });
    });
  }, [rawRows, colFilters]);

  // Sort rows
  const sortedRows = useMemo(() => {
    return [...filteredRows].sort((a, b) => {
      let va: any;
      let vb: any;
      switch (sortCol) {
        case 0: va = a.idx; vb = b.idx; break;
        case 1: va = a.name; vb = b.name; break;
        case 2: va = a.id; vb = b.id; break;
        case 3: va = a.pres; vb = b.pres; break;
        case 4: va = a.abs; vb = b.abs; break;
        case 5: va = a.lateDays; vb = b.lateDays; break;
        case 6: va = a.lateMin; vb = b.lateMin; break;
        case 7: va = a.avgLate; vb = b.avgLate; break;
        case 8: va = a.earlyDays; vb = b.earlyDays; break;
        case 9: va = a.earlyMin; vb = b.earlyMin; break;
        case 10: va = a.noOut; vb = b.noOut; break;
        case 11: va = a.sus; vb = b.sus; break;
        case 12: va = a.scoreVal; vb = b.scoreVal; break;
        case 13: va = a.grade; vb = b.grade; break;
        default: va = a.idx; vb = b.idx;
      }
      if (typeof va === 'number' && typeof vb === 'number') {
        return sortAsc ? va - vb : vb - va;
      }
      return sortAsc
        ? String(va).localeCompare(String(vb), 'ar')
        : String(vb).localeCompare(String(va), 'ar');
    });
  }, [filteredRows, sortCol, sortAsc]);

  // Calculate totals for footer
  const totals = useMemo(() => {
    const sum = (key: keyof typeof rawRows[0]) =>
      sortedRows.reduce((acc, r) => acc + (typeof r[key] === 'number' ? (r[key] as number) : 0), 0);
    const validScores = sortedRows.filter(r => !r.isIrr && !r.isFew && typeof r.score === 'number');
    const avgScore = validScores.length
      ? (validScores.reduce((acc, r) => acc + (r.score as number), 0) / validScores.length).toFixed(1)
      : '';
    const totLateDays = sum('lateDays');
    const totLateMin = sum('lateMin');

    return {
      pres: sum('pres'),
      abs: sum('abs'),
      lateDays: totLateDays,
      lateMin: totLateMin,
      avgLate: totLateDays ? Math.round(totLateMin / totLateDays) : 0,
      earlyDays: sum('earlyDays'),
      earlyMin: sum('earlyMin'),
      noOut: sum('noOut'),
      sus: sum('sus'),
      avgScore,
    };
  }, [sortedRows]);

  const activeFilterCount = Object.values(colFilters).filter(v => v && v.trim() !== '').length;

  const handleSort = (colIdx: number) => {
    if (sortCol === colIdx) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(colIdx);
      setSortAsc(false);
    }
  };

  const clearAllFilters = () => {
    setColFilters({});
  };

  const hue = (val: number | string) => {
    const v = +val;
    if (isNaN(v)) return 120;
    return Math.max(0, Math.min(120, ((v - 3) / 7) * 120));
  };

  return (
    <div className="space-y-3" id="summary-tab-content">
      {/* KPI Ribbon Strip */}
      <div className="noprint grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
        <div className="p-3 bg-white dark:bg-[#102627] border border-[#d5dfdb] dark:border-[#213e3f] rounded-xl shadow-xs border-t-4 border-t-[#1f8a6a] flex items-center gap-3">
          <Users className="w-6 h-6 text-[#1f8a6a] shrink-0" />
          <div>
            <span className="text-[11px] text-[#435b54] dark:text-[#9bb5b0] block">إجمالي المعلمين</span>
            <b className="text-base font-bold font-reem text-[#141c19] dark:text-[#e6f1ee]">
              {sortedRows.length} معلم
            </b>
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-[#102627] border border-[#d5dfdb] dark:border-[#213e3f] rounded-xl shadow-xs border-t-4 border-t-emerald-500 flex items-center gap-3">
          <CalendarCheck className="w-6 h-6 text-emerald-500 shrink-0" />
          <div>
            <span className="text-[11px] text-[#435b54] dark:text-[#9bb5b0] block">أيام الحضور</span>
            <b className="text-base font-bold font-reem text-emerald-600 dark:text-emerald-400">
              {totals.pres.toLocaleString('ar-EG')}
            </b>
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-[#102627] border border-[#d5dfdb] dark:border-[#213e3f] rounded-xl shadow-xs border-t-4 border-t-rose-500 flex items-center gap-3">
          <CalendarX className="w-6 h-6 text-rose-500 shrink-0" />
          <div>
            <span className="text-[11px] text-[#435b54] dark:text-[#9bb5b0] block">أيام الغياب</span>
            <b className={`text-base font-bold font-reem ${totals.abs > 0 ? 'text-rose-600' : ''}`}>
              {totals.abs.toLocaleString('ar-EG')}
            </b>
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-[#102627] border border-[#d5dfdb] dark:border-[#213e3f] rounded-xl shadow-xs border-t-4 border-t-[#e9a914] flex items-center gap-3">
          <Clock className="w-6 h-6 text-[#e9a914] shrink-0" />
          <div>
            <span className="text-[11px] text-[#435b54] dark:text-[#9bb5b0] block">دقائق التأخير</span>
            <b className="text-base font-bold font-reem text-amber-600 dark:text-amber-400">
              {totals.lateMin.toLocaleString('ar-EG')} د
            </b>
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-[#102627] border border-[#d5dfdb] dark:border-[#213e3f] rounded-xl shadow-xs border-t-4 border-t-[#1f8a6a] flex items-center gap-3">
          <DoorOpen className="w-6 h-6 text-[#1f8a6a] shrink-0" />
          <div>
            <span className="text-[11px] text-[#435b54] dark:text-[#9bb5b0] block">دقائق المغادرة</span>
            <b className="text-base font-bold font-reem text-[#141c19] dark:text-[#e6f1ee]">
              {totals.earlyMin.toLocaleString('ar-EG')} د
            </b>
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-[#102627] border border-[#d5dfdb] dark:border-[#213e3f] rounded-xl shadow-xs border-t-4 border-t-amber-400 flex items-center gap-3">
          <Star className="w-6 h-6 text-amber-500 shrink-0" />
          <div>
            <span className="text-[11px] text-[#435b54] dark:text-[#9bb5b0] block">متوسط التقييم</span>
            <b className="text-base font-bold font-reem text-[#141c19] dark:text-[#e6f1ee]">
              {totals.avgScore} / 10
            </b>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="noprint flex flex-wrap items-center justify-between gap-3 p-2.5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-[#d5dfdb] dark:border-[#213e3f] rounded-xl text-xs">
        <div className="text-[#141c19] dark:text-[#e6f1ee]">
          📌 <b>عرض كامل للاسم:</b> يظهر اسم كل معلم كاملاً دون اقتطاع مع تثبيته ورقم الصف عند التمرير لقراءة المؤشرات بسهولة.
        </div>
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-[#e9a914] text-black font-bold text-[11px]">
              {activeFilterCount} تصفية نشطة
            </span>
          )}
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="px-2.5 py-1 text-xs font-bold text-white rounded-lg bg-rose-600 hover:bg-rose-700 transition-colors"
            >
              مسح جميع التصفية ✕
            </button>
          )}
          <button
            type="button"
            onClick={onExportPdf}
            disabled={isExportingPdf}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-white rounded-lg transition-colors ${
              isExportingPdf ? 'bg-slate-500 cursor-wait opacity-80' : 'bg-[#b9382b] hover:bg-rose-700'
            }`}
          >
            {isExportingPdf ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <FileText className="w-3.5 h-3.5" />
            )}
            <span>{isExportingPdf ? 'جاري تجهيز PDF...' : 'تصدير PDF'}</span>
          </button>
          {onPrint && (
            <button
              type="button"
              onClick={onPrint}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-white rounded-lg bg-[#0f3d3e] dark:bg-[#165354] hover:bg-[#1f8a6a] transition-colors shadow-xs active:scale-95"
              title="طباعة تقرير الخلاصة وفق مقاس ورق A4"
            >
              <Printer className="w-3.5 h-3.5 text-[#e9a914]" />
              <span>طباعة</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto border border-[#d5dfdb] dark:border-[#213e3f] rounded-xl bg-white dark:bg-[#102627] shadow-xs custom-scroll relative">
        <table className="w-full text-xs text-center border-collapse whitespace-nowrap min-w-max">
          <thead>
            {/* Main Headers */}
            <tr className="bg-[#d3e7e0] dark:bg-[#082829] text-[#0e3334] dark:text-[#eaf3f0] font-bold border-b border-[#9fb3ad] dark:border-[#386062]">
              <th
                onClick={() => handleSort(0)}
                className="p-2 cursor-pointer sticky right-0 z-10 bg-[#d3e7e0] dark:bg-[#082829] border-l border-[#9fb3ad] dark:border-[#386062] w-11"
              >
                م
              </th>
              <th
                onClick={() => handleSort(1)}
                className="p-2 text-right cursor-pointer sticky right-11 z-10 bg-[#d3e7e0] dark:bg-[#082829] border-l border-[#9fb3ad] dark:border-[#386062] min-w-[260px] shadow-[-4px_0_8px_-2px_rgba(15,61,62,0.12)]"
              >
                اسم المعلم الكامل
              </th>
              <th onClick={() => handleSort(2)} className="p-2 cursor-pointer border-l border-[#9fb3ad] dark:border-[#386062]">
                الرقم الوزاري
              </th>
              <th onClick={() => handleSort(3)} className="p-2 cursor-pointer border-l border-[#9fb3ad] dark:border-[#386062]">
                أيام الحضور
              </th>
              <th onClick={() => handleSort(4)} className="p-2 cursor-pointer border-l border-[#9fb3ad] dark:border-[#386062]">
                أيام الغياب
              </th>
              <th onClick={() => handleSort(5)} className="p-2 cursor-pointer border-l border-[#9fb3ad] dark:border-[#386062]">
                أيام التأخير
              </th>
              <th onClick={() => handleSort(6)} className="p-2 cursor-pointer border-l border-[#9fb3ad] dark:border-[#386062]">
                مجموع دقائق التأخير
              </th>
              <th onClick={() => handleSort(7)} className="p-2 cursor-pointer border-l border-[#9fb3ad] dark:border-[#386062]">
                متوسط التأخير (د/يوم)
              </th>
              <th onClick={() => handleSort(8)} className="p-2 cursor-pointer border-l border-[#9fb3ad] dark:border-[#386062]">
                أيام المغادرة
              </th>
              <th onClick={() => handleSort(9)} className="p-2 cursor-pointer border-l border-[#9fb3ad] dark:border-[#386062]">
                مجموع دقائق المغادرة
              </th>
              <th onClick={() => handleSort(10)} className="p-2 cursor-pointer border-l border-[#9fb3ad] dark:border-[#386062]">
                خروج غير مسجل
              </th>
              <th onClick={() => handleSort(11)} className="p-2 cursor-pointer border-l border-[#9fb3ad] dark:border-[#386062]">
                بصمات مشكوكة
              </th>
              <th onClick={() => handleSort(12)} className="p-2 cursor-pointer border-l border-[#9fb3ad] dark:border-[#386062]">
                التقييم / 10
              </th>
              <th onClick={() => handleSort(13)} className="p-2 cursor-pointer border-l border-[#9fb3ad] dark:border-[#386062]">
                التقدير
              </th>
              <th className="p-2 noprint w-9"></th>
            </tr>

            {/* Filter Inputs Row */}
            <tr className="noprint bg-[#e2ede8] dark:bg-[#0b3334] border-b-2 border-[#9fb3ad] dark:border-[#386062]">
              <th className="p-1 sticky right-0 z-10 bg-[#e2ede8] dark:bg-[#0b3334] border-l border-[#9fb3ad] dark:border-[#386062]">
                <input
                  type="text"
                  placeholder="#"
                  value={colFilters[0] || ''}
                  onChange={e => setColFilters({ ...colFilters, 0: e.target.value })}
                  className="w-full px-1 py-0.5 text-[11px] text-center bg-white dark:bg-[#102627] border border-[#9fb3ad] dark:border-[#386062] rounded"
                />
              </th>
              <th className="p-1 sticky right-11 z-10 bg-[#e2ede8] dark:bg-[#0b3334] border-l border-[#9fb3ad] dark:border-[#386062] shadow-[-4px_0_8px_-2px_rgba(15,61,62,0.12)]">
                <input
                  type="text"
                  placeholder="تصفية بالاسم…"
                  value={colFilters[1] || ''}
                  onChange={e => setColFilters({ ...colFilters, 1: e.target.value })}
                  className="w-full px-2 py-0.5 text-[11px] text-right bg-white dark:bg-[#102627] border border-[#9fb3ad] dark:border-[#386062] rounded"
                />
              </th>
              <th className="p-1 border-l border-[#9fb3ad] dark:border-[#386062]">
                <input
                  type="text"
                  placeholder="الرقم…"
                  value={colFilters[2] || ''}
                  onChange={e => setColFilters({ ...colFilters, 2: e.target.value })}
                  className="w-full px-1 py-0.5 text-[11px] text-center bg-white dark:bg-[#102627] border border-[#9fb3ad] dark:border-[#386062] rounded"
                />
              </th>
              <th className="p-1 border-l border-[#9fb3ad] dark:border-[#386062]">
                <input
                  type="text"
                  placeholder="> < أو رقم"
                  value={colFilters[3] || ''}
                  onChange={e => setColFilters({ ...colFilters, 3: e.target.value })}
                  className="w-full px-1 py-0.5 text-[11px] text-center bg-white dark:bg-[#102627] border border-[#9fb3ad] dark:border-[#386062] rounded"
                />
              </th>
              <th className="p-1 border-l border-[#9fb3ad] dark:border-[#386062]">
                <input
                  type="text"
                  placeholder="> < أو رقم"
                  value={colFilters[4] || ''}
                  onChange={e => setColFilters({ ...colFilters, 4: e.target.value })}
                  className="w-full px-1 py-0.5 text-[11px] text-center bg-white dark:bg-[#102627] border border-[#9fb3ad] dark:border-[#386062] rounded"
                />
              </th>
              <th className="p-1 border-l border-[#9fb3ad] dark:border-[#386062]">
                <input
                  type="text"
                  placeholder="تصفية…"
                  value={colFilters[5] || ''}
                  onChange={e => setColFilters({ ...colFilters, 5: e.target.value })}
                  className="w-full px-1 py-0.5 text-[11px] text-center bg-white dark:bg-[#102627] border border-[#9fb3ad] dark:border-[#386062] rounded"
                />
              </th>
              <th className="p-1 border-l border-[#9fb3ad] dark:border-[#386062]">
                <input
                  type="text"
                  placeholder="> < دقيقة"
                  value={colFilters[6] || ''}
                  onChange={e => setColFilters({ ...colFilters, 6: e.target.value })}
                  className="w-full px-1 py-0.5 text-[11px] text-center bg-white dark:bg-[#102627] border border-[#9fb3ad] dark:border-[#386062] rounded"
                />
              </th>
              <th className="p-1 border-l border-[#9fb3ad] dark:border-[#386062]">
                <input
                  type="text"
                  placeholder="تصفية…"
                  value={colFilters[7] || ''}
                  onChange={e => setColFilters({ ...colFilters, 7: e.target.value })}
                  className="w-full px-1 py-0.5 text-[11px] text-center bg-white dark:bg-[#102627] border border-[#9fb3ad] dark:border-[#386062] rounded"
                />
              </th>
              <th className="p-1 border-l border-[#9fb3ad] dark:border-[#386062]">
                <input
                  type="text"
                  placeholder="تصفية…"
                  value={colFilters[8] || ''}
                  onChange={e => setColFilters({ ...colFilters, 8: e.target.value })}
                  className="w-full px-1 py-0.5 text-[11px] text-center bg-white dark:bg-[#102627] border border-[#9fb3ad] dark:border-[#386062] rounded"
                />
              </th>
              <th className="p-1 border-l border-[#9fb3ad] dark:border-[#386062]">
                <input
                  type="text"
                  placeholder="> < دقيقة"
                  value={colFilters[9] || ''}
                  onChange={e => setColFilters({ ...colFilters, 9: e.target.value })}
                  className="w-full px-1 py-0.5 text-[11px] text-center bg-white dark:bg-[#102627] border border-[#9fb3ad] dark:border-[#386062] rounded"
                />
              </th>
              <th className="p-1 border-l border-[#9fb3ad] dark:border-[#386062]">
                <input
                  type="text"
                  placeholder="تصفية…"
                  value={colFilters[10] || ''}
                  onChange={e => setColFilters({ ...colFilters, 10: e.target.value })}
                  className="w-full px-1 py-0.5 text-[11px] text-center bg-white dark:bg-[#102627] border border-[#9fb3ad] dark:border-[#386062] rounded"
                />
              </th>
              <th className="p-1 border-l border-[#9fb3ad] dark:border-[#386062]">
                <input
                  type="text"
                  placeholder="تصفية…"
                  value={colFilters[11] || ''}
                  onChange={e => setColFilters({ ...colFilters, 11: e.target.value })}
                  className="w-full px-1 py-0.5 text-[11px] text-center bg-white dark:bg-[#102627] border border-[#9fb3ad] dark:border-[#386062] rounded"
                />
              </th>
              <th className="p-1 border-l border-[#9fb3ad] dark:border-[#386062]">
                <input
                  type="text"
                  placeholder="> < أو درجة"
                  value={colFilters[12] || ''}
                  onChange={e => setColFilters({ ...colFilters, 12: e.target.value })}
                  className="w-full px-1 py-0.5 text-[11px] text-center bg-white dark:bg-[#102627] border border-[#9fb3ad] dark:border-[#386062] rounded"
                />
              </th>
              <th className="p-1 border-l border-[#9fb3ad] dark:border-[#386062]">
                <select
                  value={colFilters[13] || ''}
                  onChange={e => setColFilters({ ...colFilters, 13: e.target.value })}
                  className="w-full px-1 py-0.5 text-[11px] text-center bg-white dark:bg-[#102627] border border-[#9fb3ad] dark:border-[#386062] rounded"
                >
                  <option value="">الكل</option>
                  <option value="ممتاز">ممتاز</option>
                  <option value="جيد جداً">جيد جداً</option>
                  <option value="جيد">جيد</option>
                  <option value="مقبول">مقبول</option>
                  <option value="ضعيف">ضعيف</option>
                  <option value="غير منتظم">غير منتظم</option>
                </select>
              </th>
              <th className="p-1 noprint"></th>
            </tr>
          </thead>

          <tbody>
            {sortedRows.map(r => {
              const lateBarWidth = Math.round((r.lateMin / maxLateMin) * 100);
              const earlyBarWidth = Math.round((r.earlyMin / maxEarlyMin) * 100);
              const initial = r.name.trim().charAt(0) || 'م';

              return (
                <tr
                  key={r.id}
                  className="odd:bg-white even:bg-[#f6f9f7] dark:odd:bg-[#102627] dark:even:bg-[#0c1e1f] hover:bg-amber-50/70 dark:hover:bg-amber-950/30 transition-colors"
                >
                  {/* Sticky Index */}
                  <td className="p-2 border-b border-l border-[#d5dfdb] dark:border-[#213e3f] sticky right-0 z-10 bg-inherit font-bold text-sm md:text-base font-mono text-[#435b54] dark:text-[#9bb5b0] w-11">
                    {r.idx}
                  </td>

                  {/* Sticky Full Name */}
                  <td className="p-2 text-right border-b border-l border-[#d5dfdb] dark:border-[#213e3f] sticky right-11 z-10 bg-inherit shadow-[-4px_0_8px_-2px_rgba(15,61,62,0.12)]">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full bg-linear-to-br from-[#0f3d3e] to-[#165354] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                        {initial}
                      </span>
                      <div className="flex items-center gap-1.5 flex-nowrap">
                        <span className="font-bold text-sm md:text-base text-[#141c19] dark:text-[#e6f1ee] whitespace-nowrap">
                          {r.name}
                        </span>
                        {r.isFew && (
                          <span className="px-1.5 py-0.2 text-[10px] rounded bg-amber-100 text-amber-800 font-bold whitespace-nowrap">
                            بيانات ناقصة
                          </span>
                        )}
                        {r.isIrr && (
                          <span className="px-1.5 py-0.2 text-[10px] rounded bg-rose-100 text-rose-800 font-bold whitespace-nowrap">
                            غير منتظم
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* ID */}
                  <td className="p-2 border-b border-l border-[#d5dfdb] dark:border-[#213e3f] text-sm font-mono font-bold text-[#435b54] dark:text-[#9bb5b0]">
                    {r.id}
                  </td>

                  {/* Present Days */}
                  <td className="p-2 border-b border-l border-[#d5dfdb] dark:border-[#213e3f] font-bold text-base font-mono text-emerald-600">
                    {r.pres}
                  </td>

                  {/* Absence Days */}
                  <td
                    className={`p-2 border-b border-l border-[#d5dfdb] dark:border-[#213e3f] font-bold text-base font-mono ${
                      r.abs >= 5
                        ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700'
                        : r.abs >= 2
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800'
                        : ''
                    }`}
                  >
                    {r.abs}
                  </td>

                  {/* Late Days */}
                  <td className="p-2 border-b border-l border-[#d5dfdb] dark:border-[#213e3f] text-base font-mono font-bold">
                    {r.lateDays > 0 ? (
                      <b className="text-rose-600">{r.lateDays}</b>
                    ) : (
                      <span className="opacity-40">0</span>
                    )}
                  </td>

                  {/* Late Minutes */}
                  <td
                    className="p-2 border-b border-l border-[#d5dfdb] dark:border-[#213e3f]"
                    style={{
                      background: `linear-gradient(to left, rgba(233,169,20,0.3) ${lateBarWidth}%, transparent ${lateBarWidth}%)`,
                    }}
                  >
                    <div className="flex items-baseline justify-center gap-0.5">
                      <b className="font-bold text-base font-mono">{r.lateMin}</b>
                      <small className="text-xs font-semibold text-[#435b54] dark:text-[#9bb5b0]">د</small>
                    </div>
                  </td>

                  {/* Avg Late */}
                  <td className="p-2 border-b border-l border-[#d5dfdb] dark:border-[#213e3f] text-base font-mono font-bold">
                    {r.avgLate > 0 ? `${r.avgLate} د` : '-'}
                  </td>

                  {/* Early Days */}
                  <td className="p-2 border-b border-l border-[#d5dfdb] dark:border-[#213e3f] text-base font-mono font-bold">
                    {r.earlyDays > 0 ? (
                      <b className="text-amber-600">{r.earlyDays}</b>
                    ) : (
                      <span className="opacity-40">0</span>
                    )}
                  </td>

                  {/* Early Minutes */}
                  <td
                    className="p-2 border-b border-l border-[#d5dfdb] dark:border-[#213e3f]"
                    style={{
                      background: `linear-gradient(to left, rgba(31,138,106,0.3) ${earlyBarWidth}%, transparent ${earlyBarWidth}%)`,
                    }}
                  >
                    <div className="flex items-baseline justify-center gap-0.5">
                      <b className="font-bold text-base font-mono">{r.earlyMin}</b>
                      <small className="text-xs font-semibold text-[#435b54] dark:text-[#9bb5b0]">د</small>
                    </div>
                  </td>

                  {/* Unrecorded Exits */}
                  <td className="p-2 border-b border-l border-[#d5dfdb] dark:border-[#213e3f] text-base font-mono font-bold">
                    {r.noOut > 0 ? (
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 font-bold text-sm">
                        {r.noOut}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>

                  {/* Suspect Punches */}
                  <td className="p-2 border-b border-l border-[#d5dfdb] dark:border-[#213e3f] text-base font-mono font-bold">
                    {r.sus > 0 ? (
                      <span className="px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 font-bold text-sm">
                        {r.sus}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>

                  {/* Score */}
                  <td
                    className="p-2 border-b border-l border-[#d5dfdb] dark:border-[#213e3f]"
                    style={
                      r.score !== ''
                        ? {
                            backgroundColor: `hsl(${hue(r.score)} 65% 85%)`,
                            color: '#0f3028',
                          }
                        : {}
                    }
                  >
                    <b className="text-base md:text-lg font-bold font-reem font-mono">{r.score !== '' ? r.score : '-'}</b>
                  </td>

                  {/* Grade */}
                  <td className="p-2 border-b border-l border-[#d5dfdb] dark:border-[#213e3f]">
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-bold text-slate-900 shadow-2xs"
                      style={{ backgroundColor: r.gradeColor }}
                    >
                      {r.grade}
                    </span>
                  </td>

                  {/* Delete Action */}
                  <td className="p-2 border-b border-[#d5dfdb] dark:border-[#213e3f] noprint">
                    <button
                      type="button"
                      onClick={() => onDeleteTeacher(r.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                      title="استبعاد المعلم من التقارير"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* Footer Totals */}
          <tfoot>
            <tr className="bg-[#d3e7e0] dark:bg-[#082829] text-[#0e3334] dark:text-[#eaf3f0] font-bold sticky bottom-0 border-t-2 border-[#9fb3ad] dark:border-[#386062]">
              <td className="p-2.5 sticky right-0 bg-[#d3e7e0] dark:bg-[#082829] z-10 border-l border-[#9fb3ad] dark:border-[#386062] font-bold text-sm">
                ∑
              </td>
              <td className="p-2.5 text-right font-bold text-sm sticky right-11 bg-[#d3e7e0] dark:bg-[#082829] z-10 border-l border-[#9fb3ad] dark:border-[#386062] shadow-[-4px_0_8px_-2px_rgba(15,61,62,0.12)]">
                الإجمالي العام لكادر المدرسة
              </td>
              <td className="p-2.5 border-l border-[#9fb3ad] dark:border-[#386062] text-sm md:text-base font-bold font-mono">
                {sortedRows.length} معلم
              </td>
              <td className="p-2.5 border-l border-[#9fb3ad] dark:border-[#386062] text-sm md:text-base font-bold font-mono text-emerald-700 dark:text-emerald-300">
                {totals.pres}
              </td>
              <td className="p-2.5 border-l border-[#9fb3ad] dark:border-[#386062] text-sm md:text-base font-bold font-mono text-rose-700 dark:text-rose-300">
                {totals.abs}
              </td>
              <td className="p-2.5 border-l border-[#9fb3ad] dark:border-[#386062] text-sm md:text-base font-bold font-mono">
                {totals.lateDays}
              </td>
              <td className="p-2.5 border-l border-[#9fb3ad] dark:border-[#386062] text-sm md:text-base font-bold font-mono">
                {totals.lateMin} د
              </td>
              <td className="p-2.5 border-l border-[#9fb3ad] dark:border-[#386062] text-sm md:text-base font-bold font-mono">
                {totals.avgLate} د
              </td>
              <td className="p-2.5 border-l border-[#9fb3ad] dark:border-[#386062] text-sm md:text-base font-bold font-mono">
                {totals.earlyDays}
              </td>
              <td className="p-2.5 border-l border-[#9fb3ad] dark:border-[#386062] text-sm md:text-base font-bold font-mono">
                {totals.earlyMin} د
              </td>
              <td className="p-2.5 border-l border-[#9fb3ad] dark:border-[#386062] text-sm md:text-base font-bold font-mono">
                {totals.noOut}
              </td>
              <td className="p-2.5 border-l border-[#9fb3ad] dark:border-[#386062] text-sm md:text-base font-bold font-mono">
                {totals.sus}
              </td>
              <td className="p-2.5 border-l border-[#9fb3ad] dark:border-[#386062] text-base md:text-lg font-bold font-reem font-mono">
                {totals.avgScore}
              </td>
              <td className="p-2.5 border-l border-[#9fb3ad] dark:border-[#386062]"></td>
              <td className="p-2.5 noprint"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="noprint text-xs text-[#435b54] dark:text-[#9bb5b0] mt-2">
        💡 ملاحظة: خروج غير مسجل = بصمة دخول بلا خروج. البصمات المشكوكة = خارج الفترة الصالحة أو في غير أيام الدوام أو مدتها أقل من ساعة أو أكثر من 10 ساعات.
      </p>
    </div>
  );
};
