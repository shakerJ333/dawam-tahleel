import React, { useState } from 'react';
import { TeacherAnalysis } from '../../types';
import { fm, dn, normSearch } from '../../utils/engine';
import { ChevronDown, X } from 'lucide-react';

interface LateTabProps {
  teachers: TeacherAnalysis[];
  onDeleteTeacher: (id: string) => void;
}

export const LateTab: React.FC<LateTabProps> = ({ teachers, onDeleteTeacher }) => {
  const [filter, setFilter] = useState('');
  const lateTeachers = teachers
    .filter(o => o.late.length > 0)
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, 'ar'));

  const filtered = lateTeachers.filter(o => {
    if (!filter.trim()) return true;
    const tokens = normSearch(filter).split(/\s+/).filter(Boolean);
    const text = normSearch(`${o.name} ${o.id}`);
    return tokens.every(tok => text.includes(tok));
  });

  return (
    <div className="space-y-3">
      {/* Search / Filter */}
      <div className="noprint flex flex-wrap items-center justify-between gap-3 p-2.5 bg-white dark:bg-[#102627] border border-[#d5dfdb] dark:border-[#213e3f] rounded-xl text-xs">
        <div>
          يُعرض <b>{filtered.length}</b> معلم لديهم تأخيرات مسجلة
        </div>
        <input
          type="search"
          placeholder="بحث في المتأخرين…"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="px-3 py-1 bg-[#eef2ef] dark:bg-[#091718] border border-[#9fb3ad] dark:border-[#386062] rounded-lg text-xs"
        />
      </div>

      <div className="overflow-x-auto border border-[#d5dfdb] dark:border-[#213e3f] rounded-xl bg-white dark:bg-[#102627] shadow-xs custom-scroll">
        <table className="w-full text-xs text-center border-collapse whitespace-nowrap min-w-max">
          <thead>
            <tr className="bg-[#d3e7e0] dark:bg-[#082829] text-[#0e3334] dark:text-[#eaf3f0] font-bold border-b border-[#9fb3ad] dark:border-[#386062]">
              <th className="p-2 text-right border-l border-[#9fb3ad] dark:border-[#386062] min-w-[280px]">
                المعلم وتفاصيل أيام التأخير (انقر للاطلاع)
              </th>
              <th className="p-2 border-l border-[#9fb3ad] dark:border-[#386062]">الرقم الوزاري</th>
              <th className="p-2 border-l border-[#9fb3ad] dark:border-[#386062]">أيام التأخير</th>
              <th className="p-2 border-l border-[#9fb3ad] dark:border-[#386062]">مجموع الدقائق</th>
              <th className="p-2 border-l border-[#9fb3ad] dark:border-[#386062]">متوسط التأخير</th>
              <th className="p-2 border-l border-[#9fb3ad] dark:border-[#386062]">أطول تأخير (دقيقة)</th>
              <th className="p-2 noprint w-9"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(o => (
              <tr
                key={o.id}
                className="odd:bg-white even:bg-[#f6f9f7] dark:odd:bg-[#102627] dark:even:bg-[#0c1e1f] hover:bg-amber-50/70 dark:hover:bg-amber-950/30 transition-colors"
              >
                <td className="p-2 text-right border-b border-l border-[#d5dfdb] dark:border-[#213e3f]">
                  <details className="group">
                    <summary className="font-bold cursor-pointer text-sm md:text-base flex items-center justify-between text-[#141c19] dark:text-[#e6f1ee]">
                      <span>{o.name}</span>
                      <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" />
                    </summary>
                    <div className="mt-2 mr-3 pr-2 border-r-2 border-[#e9a914] space-y-1.5 text-xs text-[#435b54] dark:text-[#9bb5b0]">
                      {o.late.map((x, xi) => (
                        <div key={xi} className="flex items-center gap-3">
                          <span className="font-mono font-bold text-xs md:text-sm">{x.d}</span>
                          <span>({dn(x.d)})</span>
                          <span className="text-slate-800 dark:text-slate-200 font-mono font-bold text-xs md:text-sm">
                            — دخول {fm(x.t)}
                          </span>
                          <b className="text-amber-600 font-mono font-bold text-xs md:text-sm">— {x.m} د</b>
                        </div>
                      ))}
                    </div>
                  </details>
                </td>
                <td className="p-2 border-b border-l border-[#d5dfdb] dark:border-[#213e3f] text-[#435b54] dark:text-[#9bb5b0] font-mono font-bold text-sm md:text-base">
                  {o.id}
                </td>
                <td className="p-2 border-b border-l border-[#d5dfdb] dark:border-[#213e3f] font-mono font-bold text-base md:text-lg text-rose-600">
                  {o.late.length}
                </td>
                <td className="p-2 border-b border-l border-[#d5dfdb] dark:border-[#213e3f] font-mono font-bold text-base md:text-lg text-[#0f3d3e] dark:text-emerald-400">
                  {o.lateMin} د
                </td>
                <td className="p-2 border-b border-l border-[#d5dfdb] dark:border-[#213e3f] font-mono font-bold text-sm md:text-base">
                  {(o.lateMin / o.late.length).toFixed(1)} د
                </td>
                <td className="p-2 border-b border-l border-[#d5dfdb] dark:border-[#213e3f] font-mono font-bold text-base md:text-lg text-amber-600">
                  {o.maxLate} د
                </td>
                <td className="p-2 border-b border-[#d5dfdb] dark:border-[#213e3f] noprint">
                  <button
                    type="button"
                    onClick={() => onDeleteTeacher(o.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                    title="استبعاد المعلم"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
