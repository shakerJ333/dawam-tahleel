import React, { useState, useMemo } from 'react';
import { TeacherAnalysis, AppConfig } from '../../types';
import { fm, dn, normSearch } from '../../utils/engine';
import { X } from 'lucide-react';

interface EarlyTabProps {
  teachers: TeacherAnalysis[];
  cfg: AppConfig;
  onDeleteEarlyRecord: (key: string) => void;
}

export const EarlyTab: React.FC<EarlyTabProps> = ({
  teachers,
  cfg,
  onDeleteEarlyRecord,
}) => {
  const [filters, setFilters] = useState<Record<number, string>>({});

  const rawRows = useMemo(() => {
    const rows: {
      idx: number;
      name: string;
      id: string;
      date: string;
      dateDisplay: string;
      dayName: string;
      outTime: string;
      minutes: number;
      category: string;
      key: string;
    }[] = [];

    teachers
      .filter(o => !o.irr)
      .slice()
      .sort((x, y) => x.name.localeCompare(y.name, 'ar'))
      .forEach(o => {
        o.early.forEach(x => {
          const cat =
            x.m >= cfg.severe
              ? `جسيم (${cfg.severe}+ د)`
              : x.m >= 15
              ? `متوسط (15–${cfg.severe - 1} د)`
              : 'بسيط (أقل من 15 د)';

          rows.push({
            idx: 0,
            name: o.name,
            id: o.id,
            date: x.d,
            dateDisplay: `${x.d.slice(8)}/${x.d.slice(5, 7)}/${x.d.slice(0, 4)}`,
            dayName: dn(x.d),
            outTime: fm(x.t),
            minutes: x.m,
            category: cat,
            key: `${o.id}|${x.d}`,
          });
        });
      });

    rows.forEach((r, i) => (r.idx = i + 1));
    return rows;
  }, [teachers, cfg]);

  const maxMin = useMemo(
    () => Math.max(1, ...rawRows.map(r => r.minutes)),
    [rawRows]
  );

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
          case 0: cellText = String(r.idx); cellNum = r.idx; break;
          case 1: cellText = r.name; break;
          case 2: cellText = r.dateDisplay; break;
          case 3: cellText = r.dayName; break;
          case 4: cellText = r.outTime; break;
          case 5: cellText = String(r.minutes); cellNum = r.minutes; break;
          case 6: cellText = r.category; break;
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

  return (
    <div className="space-y-3">
      {/* Ribbon */}
      <div className="noprint flex flex-wrap items-center justify-between gap-3 p-2.5 bg-white dark:bg-[#102627] border border-[#d5dfdb] dark:border-[#213e3f] rounded-xl text-xs">
        <div>
          يُعرض <b>{filteredRows.length}</b> من أصل <b>{rawRows.length}</b> مغادرة مبكرة
        </div>
        {Object.values(filters).some(v => v && v.trim()) && (
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
              <th className="p-2 border-l border-[#9fb3ad] dark:border-[#386062] w-12">م</th>
              <th className="p-2 text-right border-l border-[#9fb3ad] dark:border-[#386062] min-w-[220px]">اسم المعلم</th>
              <th className="p-2 border-l border-[#9fb3ad] dark:border-[#386062]">التاريخ</th>
              <th className="p-2 border-l border-[#9fb3ad] dark:border-[#386062]">اليوم</th>
              <th className="p-2 border-l border-[#9fb3ad] dark:border-[#386062]">وقت الخروج</th>
              <th className="p-2 border-l border-[#9fb3ad] dark:border-[#386062]">دقائق المغادرة</th>
              <th className="p-2 border-l border-[#9fb3ad] dark:border-[#386062]">التصنيف</th>
              <th className="p-2 noprint w-9"></th>
            </tr>
            {/* Filter Row */}
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
                  placeholder="وقت…"
                  value={filters[4] || ''}
                  onChange={e => setFilters({ ...filters, 4: e.target.value })}
                  className="w-full px-1 py-0.5 text-[11px] text-center bg-white dark:bg-[#102627] border border-[#9fb3ad] dark:border-[#386062] rounded"
                />
              </th>
              <th className="p-1 border-l border-[#9fb3ad] dark:border-[#386062]">
                <input
                  type="text"
                  placeholder="> < دقيقة"
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
                  <option value="بسيط">بسيط</option>
                  <option value="متوسط">متوسط</option>
                  <option value="جسيم">جسيم</option>
                </select>
              </th>
              <th className="p-1 noprint"></th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map(r => {
              const barWidth = Math.round((r.minutes / maxMin) * 100);
              return (
                <tr
                  key={r.idx}
                  className="odd:bg-white even:bg-[#f6f9f7] dark:odd:bg-[#102627] dark:even:bg-[#0c1e1f] hover:bg-amber-50/70 dark:hover:bg-amber-950/30 transition-colors"
                >
                  <td className="p-2 border-b border-l border-[#d5dfdb] dark:border-[#213e3f] font-mono font-bold text-sm md:text-base text-[#435b54] dark:text-[#9bb5b0]">
                    {r.idx}
                  </td>
                  <td className="p-2 text-right border-b border-l border-[#d5dfdb] dark:border-[#213e3f] font-bold text-sm md:text-base">
                    {r.name}
                  </td>
                  <td className="p-2 border-b border-l border-[#d5dfdb] dark:border-[#213e3f] font-mono font-semibold text-sm md:text-base">
                    {r.dateDisplay}
                  </td>
                  <td className="p-2 border-b border-l border-[#d5dfdb] dark:border-[#213e3f] text-xs md:text-sm">
                    {r.dayName}
                  </td>
                  <td className="p-2 border-b border-l border-[#d5dfdb] dark:border-[#213e3f] font-mono font-bold text-sm md:text-base">
                    {r.outTime}
                  </td>
                  <td
                    className="p-2 border-b border-l border-[#d5dfdb] dark:border-[#213e3f]"
                    style={{
                      background: `linear-gradient(to left, rgba(169,205,238,0.5) ${barWidth}%, transparent ${barWidth}%)`,
                    }}
                  >
                    <b className="font-mono font-bold text-base md:text-lg">{r.minutes} د</b>
                  </td>
                  <td className="p-2 border-b border-l border-[#d5dfdb] dark:border-[#213e3f]">
                    <span
                      className={`px-2 py-0.5 rounded text-xs md:text-sm font-bold ${
                        r.category.includes('جسيم')
                          ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200'
                          : r.category.includes('متوسط')
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200'
                          : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200'
                      }`}
                    >
                      {r.category}
                    </span>
                  </td>
                  <td className="p-2 border-b border-[#d5dfdb] dark:border-[#213e3f] noprint">
                    <button
                      type="button"
                      onClick={() => onDeleteEarlyRecord(r.key)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                      title="استبعاد هذه المغادرة"
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
        التصنيف: بسيط أقل من 15 دقيقة، متوسط من 15 حتى {cfg.severe - 1} دقيقة، جسيم {cfg.severe} دقيقة فأكثر.
      </p>
    </div>
  );
};
