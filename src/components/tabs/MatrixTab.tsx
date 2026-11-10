import React, { useState, useMemo } from 'react';
import { AnalysisResult } from '../../types';
import { dn, normSearch } from '../../utils/engine';
import { X } from 'lucide-react';

interface MatrixTabProps {
  analysis: AnalysisResult;
  onToggleExcuse: (key: string) => void;
  onDeleteTeacher: (id: string) => void;
}

export const MatrixTab: React.FC<MatrixTabProps> = ({
  analysis,
  onToggleExcuse,
  onDeleteTeacher,
}) => {
  const [search, setSearch] = useState('');

  const ds = analysis.work;

  // Filter teachers by search and sort alphabetically
  const filteredTeachers = useMemo(() => {
    const base = analysis.list.slice().sort((a, b) => a.name.localeCompare(b.name, 'ar'));
    if (!search.trim()) return base;
    const tokens = normSearch(search).split(/\s+/).filter(Boolean);
    return base.filter(o => {
      const text = normSearch(`${o.name} ${o.id}`);
      return tokens.every(tok => text.includes(tok));
    });
  }, [analysis.list, search]);

  // Compute daily absences count
  const dailyAbsenceCount = useMemo(() => {
    const counts: Record<string, number> = {};
    ds.forEach(d => (counts[d] = 0));
    filteredTeachers.forEach(o => {
      ds.forEach(d => {
        if (o.cells[d] === 'غ') counts[d]++;
      });
    });
    return counts;
  }, [filteredTeachers, ds]);

  return (
    <div className="space-y-3">
      {/* Legend & Guide */}
      <div className="noprint flex flex-wrap items-center justify-between gap-3 p-2.5 bg-white dark:bg-[#102627] border border-[#d5dfdb] dark:border-[#213e3f] rounded-xl text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <b>دليل الرموز:</b>
          <span className="flex items-center gap-1">
            <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">✓ حاضر</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="px-1.5 py-0.5 rounded bg-rose-200 text-rose-900 font-bold">غ غائب</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 font-bold">ت متأخر</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="px-1.5 py-0.5 rounded bg-yellow-200 text-yellow-900 font-bold">م مغادرة</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-900 font-bold">ب ناقصة</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="px-1.5 py-0.5 rounded bg-blue-200 text-blue-900 font-bold">إ مبرَّر</span>
          </span>
          <span className="text-slate-500 mr-2">
            (انقر أي خلية غياب لتحويلها إلى غياب مبرَّر أو العكس بنقرة واحدة)
          </span>
        </div>

        <input
          type="search"
          placeholder="بحث بالاسم في المصفوفة…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-3 py-1 bg-[#eef2ef] dark:bg-[#091718] border border-[#9fb3ad] dark:border-[#386062] rounded-lg text-xs"
        />
      </div>

      {/* Matrix Table */}
      <div className="overflow-x-auto border border-[#d5dfdb] dark:border-[#213e3f] rounded-xl bg-white dark:bg-[#102627] shadow-xs custom-scroll relative">
        <table className="w-full text-xs text-center border-collapse whitespace-nowrap min-w-max">
          <thead>
            <tr className="bg-[#d3e7e0] dark:bg-[#082829] text-[#0e3334] dark:text-[#eaf3f0] font-bold border-b border-[#9fb3ad] dark:border-[#386062]">
              <th className="p-2 text-right sticky right-0 z-10 bg-[#d3e7e0] dark:bg-[#082829] border-l border-[#9fb3ad] dark:border-[#386062] min-w-[200px]">
                المعلم
              </th>
              {ds.map(d => {
                const dow = analysis.info[d]?.dow;
                const isSunday = dow === 0;
                return (
                  <th
                    key={d}
                    title={`${d} (${dn(d)})`}
                    className={`p-1.5 border-l border-[#9fb3ad] dark:border-[#386062] font-mono font-bold text-xs md:text-sm ${
                      isSunday ? 'border-r-2 border-r-[#e9a914]' : ''
                    }`}
                  >
                    <div>{d.slice(8)}/{d.slice(5, 7)}</div>
                    <div className="text-[10px] md:text-xs opacity-70 font-normal">{dn(d).slice(0, 3)}</div>
                  </th>
                );
              })}
              <th className="p-2 bg-[#d3e7e0] dark:bg-[#082829] border-l border-[#9fb3ad] dark:border-[#386062] font-bold text-rose-700 text-sm md:text-base w-12">
                غ
              </th>
            </tr>
          </thead>

          <tbody>
            {filteredTeachers.map(o => (
              <tr
                key={o.id}
                className="odd:bg-white even:bg-[#f6f9f7] dark:odd:bg-[#102627] dark:even:bg-[#0c1e1f] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {/* Sticky Teacher Name */}
                <td className="p-2 text-right border-b border-l border-[#d5dfdb] dark:border-[#213e3f] sticky right-0 z-10 bg-inherit font-bold text-sm md:text-base">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onDeleteTeacher(o.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded noprint"
                      title="استبعاد المعلم"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <span>{o.name}</span>
                  </div>
                </td>

                {/* Day Cells */}
                {ds.map(d => {
                  const code = o.cells[d] || '';
                  const dow = analysis.info[d]?.dow;
                  const isSunday = dow === 0;
                  const isClickable = code === 'غ' || code === 'إ';
                  const key = `${o.id}|${d}`;

                  return (
                    <td
                      key={d}
                      onClick={() => isClickable && onToggleExcuse(key)}
                      title={`${d} (${dn(d)}) — المعلم: ${o.name} — الحالة: ${code || 'غير مسجل'}`}
                      className={`p-1 border-b border-l border-[#d5dfdb] dark:border-[#213e3f] font-mono font-bold text-xs md:text-sm select-none ${
                        isSunday ? 'border-r-2 border-r-[#e9a914]' : ''
                      } ${
                        code === 'ح'
                          ? 'bg-emerald-100/60 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200'
                          : code === 'غ'
                          ? 'bg-rose-200/80 dark:bg-rose-950/80 text-rose-900 dark:text-rose-200 cursor-pointer hover:brightness-110'
                          : code === 'ت'
                          ? 'bg-amber-200/80 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200'
                          : code === 'م'
                          ? 'bg-yellow-200/80 dark:bg-yellow-950/80 text-yellow-900 dark:text-yellow-200'
                          : code === 'ب'
                          ? 'bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 italic'
                          : code === 'إ'
                          ? 'bg-blue-200/80 dark:bg-blue-950/80 text-blue-900 dark:text-blue-200 cursor-pointer hover:brightness-110'
                          : ''
                      }`}
                    >
                      {code === 'ح' ? '✓' : code}
                    </td>
                  );
                })}

                {/* Total Absence */}
                <td className="p-2 border-b border-l border-[#d5dfdb] dark:border-[#213e3f] font-mono font-bold text-base md:text-lg text-rose-600 bg-inherit">
                  {o.abs}
                </td>
              </tr>
            ))}
          </tbody>

          {/* Footer with Total Daily Absences */}
          <tfoot>
            <tr className="bg-[#d3e7e0] dark:bg-[#082829] text-[#0e3334] dark:text-[#eaf3f0] font-bold sticky bottom-0 border-t-2 border-[#9fb3ad] dark:border-[#386062]">
              <td className="p-2 text-right sticky right-0 bg-[#d3e7e0] dark:bg-[#082829] z-10 border-l border-[#9fb3ad] dark:border-[#386062] text-xs md:text-sm">
                إجمالي الغياب اليومي
              </td>
              {ds.map(d => (
                <td
                  key={d}
                  className={`p-1.5 border-l border-[#9fb3ad] dark:border-[#386062] font-mono font-bold text-sm md:text-base ${
                    dailyAbsenceCount[d] > 0 ? 'text-rose-700 dark:text-rose-300' : ''
                  }`}
                >
                  {dailyAbsenceCount[d]}
                </td>
              ))}
              <td className="p-2 border-l border-[#9fb3ad] dark:border-[#386062]"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
