import React, { useState, useMemo } from 'react';
import { AnalysisResult, AppConfig } from '../../types';
import { fm, dn, normSearch } from '../../utils/engine';
import { X } from 'lucide-react';

interface DailyTabProps {
  analysis: AnalysisResult;
  cfg: AppConfig;
  noExitOverrides: Record<string, boolean>;
  onSkipRecord: (key: string) => void;
}

export const DailyTab: React.FC<DailyTabProps> = ({
  analysis,
  cfg,
  noExitOverrides,
  onSkipRecord,
}) => {
  const [filters, setFilters] = useState<Record<number, string>>({});
  const [sortCol, setSortCol] = useState<number>(0); // Default sort by teacher name
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  const rawRows = useMemo(() => {
    const rows: {
      name: string;
      id: string;
      date: string;
      dateDisplay: string;
      dayName: string;
      inTime: string;
      outTime: string;
      type: string;
      lateMin: number;
      earlyMin: number;
      key: string;
    }[] = [];

    analysis.list
      .filter(o => !o.irr)
      .slice()
      .sort((x, y) => x.name.localeCompare(y.name, 'ar'))
      .forEach(o => {
        const emp = analysis.emps.get(o.id);
        if (!emp) return;

        analysis.work.forEach(d => {
          const r = emp.m.get(d);
          if (!r) return;

          let a = r.in;
          let b = r.out;
          let k = 'كامل';

          if (r.t != null) {
            if (r.t < cfg.single) {
              a = r.t;
              b = null;
              k = 'دخول فقط';
            } else {
              a = null;
              b = r.t;
              k = 'خروج فقط';
            }
          }

          const lm =
            a != null && a > cfg.start + cfg.grace
              ? a - (cfg.full ? cfg.start : cfg.start + cfg.grace)
              : 0;

          const em =
            a != null &&
            b != null &&
            b < cfg.end - cfg.egrace &&
            d !== cfg.noExit &&
            !noExitOverrides[`${o.id}|${d}`]
              ? cfg.end - cfg.egrace - b
              : 0;

          rows.push({
            name: o.name,
            id: o.id,
            date: d,
            dateDisplay: `${d.slice(8)}/${d.slice(5, 7)}/${d.slice(0, 4)}`,
            dayName: dn(d),
            inTime: fm(a),
            outTime: fm(b),
            type: k,
            lateMin: lm,
            earlyMin: em,
            key: `${o.id}|${d}`,
          });
        });
      });

    return rows;
  }, [analysis, cfg, noExitOverrides]);

  // Apply filters
  const filteredRows = useMemo(() => {
    const activeEntries = Object.entries(filters).filter(([, v]) => v && v.trim() !== '');
    if (!activeEntries.length) return rawRows;

    return rawRows.filter(r => {
      return activeEntries.every(([colIdxStr, filterVal]) => {
        const colIdx = +colIdxStr;
        const fVal = filterVal.trim();
        let cellText = '';
        let cellNum: number | null = null;

        switch (colIdx) {
          case 0: cellText = r.name; break;
          case 1: cellText = r.id; break;
          case 2: cellText = r.dateDisplay; break;
          case 3: cellText = r.dayName; break;
          case 4: cellText = r.inTime; break;
          case 5: cellText = r.outTime; break;
          case 6: cellText = r.type; break;
          case 7: cellText = String(r.lateMin); cellNum = r.lateMin; break;
          case 8: cellText = String(r.earlyMin); cellNum = r.earlyMin; break;
        }

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

        const searchTokens = normSearch(fVal).split(/\s+/).filter(Boolean);
        const normCell = normSearch(cellText);
        return searchTokens.every(tok => normCell.includes(tok));
      });
    });
  }, [rawRows, filters]);

  // Sort
  const sortedRows = useMemo(() => {
    return [...filteredRows].sort((a, b) => {
      let va: any;
      let vb: any;
      switch (sortCol) {
        case 0: va = a.name; vb = b.name; break;
        case 1: va = a.id; vb = b.id; break;
        case 2: va = a.date; vb = b.date; break;
        case 3: va = a.dayName; vb = b.dayName; break;
        case 4: va = a.inTime; vb = b.inTime; break;
        case 5: va = a.outTime; vb = b.outTime; break;
        case 6: va = a.type; vb = b.type; break;
        case 7: va = a.lateMin; vb = b.lateMin; break;
        case 8: va = a.earlyMin; vb = b.earlyMin; break;
        default: va = a.date; vb = b.date;
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
  }, [filteredRows, sortCol, sortAsc]);

  const handleSort = (colIdx: number) => {
    if (sortCol === colIdx) setSortAsc(!sortAsc);
    else {
      setSortCol(colIdx);
      setSortAsc(true);
    }
  };

  const activeFilterCount = Object.values(filters).filter(v => v && v.trim() !== '').length;

  return (
    <div className="space-y-3">
      {/* Ribbon */}
      <div className="noprint flex flex-wrap items-center justify-between gap-3 p-2.5 bg-white dark:bg-[#102627] border border-[#d5dfdb] dark:border-[#213e3f] rounded-xl text-xs">
        <div>
          يُعرض <b>{sortedRows.length}</b> من أصل <b>{rawRows.length}</b> حركة يومية
        </div>
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={() => setFilters({})}
            className="px-2.5 py-1 text-xs font-bold text-white rounded-lg bg-rose-600 hover:bg-rose-700 transition-colors"
          >
            مسح جميع التصفية ✕
          </button>
        )}
      </div>

      <div className="overflow-x-auto border border-[#d5dfdb] dark:border-[#213e3f] rounded-xl bg-white dark:bg-[#102627] shadow-xs custom-scroll">
        <table className="w-full text-xs text-center border-collapse whitespace-nowrap min-w-max">
          <thead>
            <tr className="bg-[#d3e7e0] dark:bg-[#082829] text-[#0e3334] dark:text-[#eaf3f0] font-bold border-b border-[#9fb3ad] dark:border-[#386062]">
              <th onClick={() => handleSort(0)} className="p-2 text-right cursor-pointer border-l border-[#9fb3ad] dark:border-[#386062] min-w-[200px]">
                اسم المعلم
              </th>
              <th onClick={() => handleSort(1)} className="p-2 cursor-pointer border-l border-[#9fb3ad] dark:border-[#386062]">
                الرقم الوزاري
              </th>
              <th onClick={() => handleSort(2)} className="p-2 cursor-pointer border-l border-[#9fb3ad] dark:border-[#386062]">
                التاريخ
              </th>
              <th onClick={() => handleSort(3)} className="p-2 cursor-pointer border-l border-[#9fb3ad] dark:border-[#386062]">
                اليوم
              </th>
              <th onClick={() => handleSort(4)} className="p-2 cursor-pointer border-l border-[#9fb3ad] dark:border-[#386062]">
                أول دخول
              </th>
              <th onClick={() => handleSort(5)} className="p-2 cursor-pointer border-l border-[#9fb3ad] dark:border-[#386062]">
                آخر خروج
              </th>
              <th onClick={() => handleSort(6)} className="p-2 cursor-pointer border-l border-[#9fb3ad] dark:border-[#386062]">
                نوع السجل
              </th>
              <th onClick={() => handleSort(7)} className="p-2 cursor-pointer border-l border-[#9fb3ad] dark:border-[#386062]">
                دقائق التأخير
              </th>
              <th onClick={() => handleSort(8)} className="p-2 cursor-pointer border-l border-[#9fb3ad] dark:border-[#386062]">
                دقائق المغادرة
              </th>
              <th className="p-2 noprint w-9"></th>
            </tr>

            {/* Filter inputs */}
            <tr className="noprint bg-[#e2ede8] dark:bg-[#0b3334] border-b-2 border-[#9fb3ad] dark:border-[#386062]">
              <th className="p-1 border-l border-[#9fb3ad] dark:border-[#386062]">
                <input
                  type="text"
                  placeholder="اسم المعلم…"
                  value={filters[0] || ''}
                  onChange={e => setFilters({ ...filters, 0: e.target.value })}
                  className="w-full px-2 py-0.5 text-[11px] text-right bg-white dark:bg-[#102627] border border-[#9fb3ad] dark:border-[#386062] rounded"
                />
              </th>
              <th className="p-1 border-l border-[#9fb3ad] dark:border-[#386062]">
                <input
                  type="text"
                  placeholder="الرقم…"
                  value={filters[1] || ''}
                  onChange={e => setFilters({ ...filters, 1: e.target.value })}
                  className="w-full px-1 py-0.5 text-[11px] text-center bg-white dark:bg-[#102627] border border-[#9fb3ad] dark:border-[#386062] rounded"
                />
              </th>
              <th className="p-1 border-l border-[#9fb3ad] dark:border-[#386062]">
                <input
                  type="text"
                  placeholder="تاريخ…"
                  value={filters[2] || ''}
                  onChange={e => setFilters({ ...filters, 2: e.target.value })}
                  className="w-full px-1 py-0.5 text-[11px] text-center bg-white dark:bg-[#102627] border border-[#9fb3ad] dark:border-[#386062] rounded"
                />
              </th>
              <th className="p-1 border-l border-[#9fb3ad] dark:border-[#386062]">
                <input
                  type="text"
                  placeholder="اليوم…"
                  value={filters[3] || ''}
                  onChange={e => setFilters({ ...filters, 3: e.target.value })}
                  className="w-full px-1 py-0.5 text-[11px] text-center bg-white dark:bg-[#102627] border border-[#9fb3ad] dark:border-[#386062] rounded"
                />
              </th>
              <th className="p-1 border-l border-[#9fb3ad] dark:border-[#386062]">
                <input
                  type="text"
                  placeholder="دخول…"
                  value={filters[4] || ''}
                  onChange={e => setFilters({ ...filters, 4: e.target.value })}
                  className="w-full px-1 py-0.5 text-[11px] text-center bg-white dark:bg-[#102627] border border-[#9fb3ad] dark:border-[#386062] rounded"
                />
              </th>
              <th className="p-1 border-l border-[#9fb3ad] dark:border-[#386062]">
                <input
                  type="text"
                  placeholder="خروج…"
                  value={filters[5] || ''}
                  onChange={e => setFilters({ ...filters, 5: e.target.value })}
                  className="w-full px-1 py-0.5 text-[11px] text-center bg-white dark:bg-[#102627] border border-[#9fb3ad] dark:border-[#386062] rounded"
                />
              </th>
              <th className="p-1 border-l border-[#9fb3ad] dark:border-[#386062]">
                <select
                  value={filters[6] || ''}
                  onChange={e => setFilters({ ...filters, 6: e.target.value })}
                  className="w-full px-1 py-0.5 text-[11px] text-center bg-white dark:bg-[#102627] border border-[#9fb3ad] dark:border-[#386062] rounded"
                >
                  <option value="">الكل</option>
                  <option value="كامل">كامل</option>
                  <option value="دخول فقط">دخول فقط</option>
                  <option value="خروج فقط">خروج فقط</option>
                </select>
              </th>
              <th className="p-1 border-l border-[#9fb3ad] dark:border-[#386062]">
                <input
                  type="text"
                  placeholder="> < دقيقة"
                  value={filters[7] || ''}
                  onChange={e => setFilters({ ...filters, 7: e.target.value })}
                  className="w-full px-1 py-0.5 text-[11px] text-center bg-white dark:bg-[#102627] border border-[#9fb3ad] dark:border-[#386062] rounded"
                />
              </th>
              <th className="p-1 border-l border-[#9fb3ad] dark:border-[#386062]">
                <input
                  type="text"
                  placeholder="> < دقيقة"
                  value={filters[8] || ''}
                  onChange={e => setFilters({ ...filters, 8: e.target.value })}
                  className="w-full px-1 py-0.5 text-[11px] text-center bg-white dark:bg-[#102627] border border-[#9fb3ad] dark:border-[#386062] rounded"
                />
              </th>
              <th className="p-1 noprint"></th>
            </tr>
          </thead>

          <tbody>
            {sortedRows.map((r, i) => {
              const isSevereLate = r.lateMin >= cfg.severe;
              const isSevereEarly = r.earlyMin >= cfg.severe;

              return (
                <tr
                  key={i}
                  className="odd:bg-white even:bg-[#f6f9f7] dark:odd:bg-[#102627] dark:even:bg-[#0c1e1f] hover:bg-amber-50/70 dark:hover:bg-amber-950/30 transition-colors"
                >
                  <td className="p-2 text-right font-bold text-sm md:text-base border-b border-l border-[#d5dfdb] dark:border-[#213e3f]">
                    {r.name}
                  </td>
                  <td className="p-2 border-b border-l border-[#d5dfdb] dark:border-[#213e3f] text-[#435b54] dark:text-[#9bb5b0] font-mono font-bold text-sm md:text-base">
                    {r.id}
                  </td>
                  <td className="p-2 border-b border-l border-[#d5dfdb] dark:border-[#213e3f] font-mono font-semibold text-sm md:text-base">
                    {r.dateDisplay}
                  </td>
                  <td className="p-2 border-b border-l border-[#d5dfdb] dark:border-[#213e3f] text-xs md:text-sm font-medium">
                    {r.dayName}
                  </td>
                  <td className="p-2 border-b border-l border-[#d5dfdb] dark:border-[#213e3f] font-mono font-bold text-sm md:text-base">
                    {r.inTime || '-'}
                  </td>
                  <td className="p-2 border-b border-l border-[#d5dfdb] dark:border-[#213e3f] font-mono font-bold text-sm md:text-base">
                    {r.outTime || '-'}
                  </td>
                  <td className="p-2 border-b border-l border-[#d5dfdb] dark:border-[#213e3f] text-xs md:text-sm">
                    {r.type}
                  </td>
                  <td
                    className={`p-2 border-b border-l border-[#d5dfdb] dark:border-[#213e3f] font-mono font-bold text-sm md:text-base ${
                      isSevereLate ? 'bg-amber-100 dark:bg-amber-950/60 font-black text-amber-900 dark:text-amber-200' : ''
                    }`}
                  >
                    {r.lateMin > 0 ? `${r.lateMin} د` : '-'}
                  </td>
                  <td
                    className={`p-2 border-b border-l border-[#d5dfdb] dark:border-[#213e3f] font-mono font-bold text-sm md:text-base ${
                      isSevereEarly ? 'bg-amber-100 dark:bg-amber-950/60 font-black text-amber-900 dark:text-amber-200' : ''
                    }`}
                  >
                    {r.earlyMin > 0 ? `${r.earlyMin} د` : '-'}
                  </td>
                  <td className="p-2 border-b border-[#d5dfdb] dark:border-[#213e3f] noprint">
                    <button
                      type="button"
                      onClick={() => onSkipRecord(r.key)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                      title="استبعاد حركة هذا اليوم"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="noprint text-xs text-[#435b54] dark:text-[#9bb5b0]">
        يُظلَّل التأخير أو المغادرة بالأصفر عند بلوغ حد «التأخير الجسيم» في الإعدادات ({cfg.severe} دقيقة).
      </p>
    </div>
  );
};
