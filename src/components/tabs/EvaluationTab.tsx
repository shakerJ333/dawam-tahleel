import React, { useState, useMemo } from 'react';
import { TeacherAnalysis } from '../../types';
import { pc, normSearch } from '../../utils/engine';
import { X } from 'lucide-react';

interface EvaluationTabProps {
  teachers: TeacherAnalysis[];
  onDeleteTeacher: (id: string) => void;
}

export const EvaluationTab: React.FC<EvaluationTabProps> = ({
  teachers,
  onDeleteTeacher,
}) => {
  const [search, setSearch] = useState('');

  const [sortCol, setSortCol] = useState<'name' | 'id' | 'att' | 'pun' | 'score' | 'idx'>('name');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  const baseList = useMemo(() => {
    return teachers
      .filter(o => !o.irr)
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, 'ar'));
  }, [teachers]);

  const filtered = useMemo(() => {
    let list = baseList;
    if (search.trim()) {
      const tokens = normSearch(search).split(/\s+/).filter(Boolean);
      list = list.filter(o => {
        const text = normSearch(`${o.name} ${o.id} ${o.grade[0]}`);
        return tokens.every(tok => text.includes(tok));
      });
    }

    return [...list].sort((a, b) => {
      let va: any;
      let vb: any;
      switch (sortCol) {
        case 'name': va = a.name; vb = b.name; break;
        case 'id': va = a.id; vb = b.id; break;
        case 'att': va = a.att; vb = b.att; break;
        case 'pun': va = a.pun; vb = b.pun; break;
        case 'score': va = a.score; vb = b.score; break;
        default: va = a.name; vb = b.name;
      }
      if (typeof va === 'number' && typeof vb === 'number') {
        return sortAsc ? va - vb : vb - va;
      }
      return sortAsc
        ? String(va).localeCompare(String(vb), 'ar')
        : String(vb).localeCompare(String(va), 'ar');
    });
  }, [baseList, search, sortCol, sortAsc]);

  const handleSort = (col: 'name' | 'id' | 'att' | 'pun' | 'score' | 'idx') => {
    if (sortCol === col) setSortAsc(!sortAsc);
    else {
      setSortCol(col);
      setSortAsc(col === 'score' ? false : true);
    }
  };

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="noprint flex flex-wrap items-center justify-between gap-3 p-2.5 bg-white dark:bg-[#102627] border border-[#d5dfdb] dark:border-[#213e3f] rounded-xl text-xs">
        <div>
          تقييم أداء وانضباط <b>{filtered.length}</b> معلم (مرتب أبجدياً حسب اسم المعلم)
        </div>
        <input
          type="search"
          placeholder="بحث في التقييم…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-3 py-1 bg-[#eef2ef] dark:bg-[#091718] border border-[#9fb3ad] dark:border-[#386062] rounded-lg text-xs"
        />
      </div>

      <div className="overflow-x-auto border border-[#d5dfdb] dark:border-[#213e3f] rounded-xl bg-white dark:bg-[#102627] shadow-xs custom-scroll">
        <table className="w-full text-xs text-center border-collapse whitespace-nowrap min-w-max">
          <thead>
            <tr className="bg-[#d3e7e0] dark:bg-[#082829] text-[#0e3334] dark:text-[#eaf3f0] font-bold border-b border-[#9fb3ad] dark:border-[#386062]">
              <th className="p-2 border-l border-[#9fb3ad] dark:border-[#386062] w-12">م</th>
              <th
                onClick={() => handleSort('name')}
                className="p-2 text-right border-l border-[#9fb3ad] dark:border-[#386062] min-w-[220px] cursor-pointer"
              >
                المعلم {sortCol === 'name' ? (sortAsc ? '▲' : '▼') : ''}
              </th>
              <th
                onClick={() => handleSort('id')}
                className="p-2 border-l border-[#9fb3ad] dark:border-[#386062] cursor-pointer"
              >
                الرقم الوزاري {sortCol === 'id' ? (sortAsc ? '▲' : '▼') : ''}
              </th>
              <th
                onClick={() => handleSort('att')}
                className="p-2 border-l border-[#9fb3ad] dark:border-[#386062] cursor-pointer"
              >
                نسبة الحضور {sortCol === 'att' ? (sortAsc ? '▲' : '▼') : ''}
              </th>
              <th
                onClick={() => handleSort('pun')}
                className="p-2 border-l border-[#9fb3ad] dark:border-[#386062] cursor-pointer"
              >
                نسبة الالتزام {sortCol === 'pun' ? (sortAsc ? '▲' : '▼') : ''}
              </th>
              <th
                onClick={() => handleSort('score')}
                className="p-2 border-l border-[#9fb3ad] dark:border-[#386062] min-w-[160px] cursor-pointer"
              >
                الدرجة / 10 {sortCol === 'score' ? (sortAsc ? '▲' : '▼') : ''}
              </th>
              <th className="p-2 border-l border-[#9fb3ad] dark:border-[#386062]">التقدير</th>
              <th className="p-2 noprint w-9"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o, idx) => (
              <tr
                key={o.id}
                className="odd:bg-white even:bg-[#f6f9f7] dark:odd:bg-[#102627] dark:even:bg-[#0c1e1f] hover:bg-amber-50/70 dark:hover:bg-amber-950/30 transition-colors"
              >
                <td className="p-2 border-b border-l border-[#d5dfdb] dark:border-[#213e3f] font-mono font-bold text-sm md:text-base text-[#435b54] dark:text-[#9bb5b0]">
                  {idx + 1}
                </td>
                <td className="p-2 text-right border-b border-l border-[#d5dfdb] dark:border-[#213e3f] font-bold text-sm md:text-base">
                  <div className="flex items-center gap-1.5">
                    <span>{o.name}</span>
                    {o.few && (
                      <span className="px-1.5 py-0.2 text-[10px] rounded bg-amber-100 text-amber-800 font-bold">
                        بيانات ناقصة
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-2 border-b border-l border-[#d5dfdb] dark:border-[#213e3f] text-[#435b54] dark:text-[#9bb5b0] font-mono font-bold text-sm md:text-base">
                  {o.id}
                </td>
                <td className="p-2 border-b border-l border-[#d5dfdb] dark:border-[#213e3f] font-mono font-bold text-base md:text-lg text-emerald-600">
                  {pc(o.att)}
                </td>
                <td className="p-2 border-b border-l border-[#d5dfdb] dark:border-[#213e3f] font-mono font-bold text-base md:text-lg text-blue-600">
                  {pc(o.pun)}
                </td>
                <td className="p-2 border-b border-l border-[#d5dfdb] dark:border-[#213e3f]">
                  <div className="w-full max-w-[150px] mx-auto bg-slate-200 dark:bg-slate-700 rounded-full h-5 overflow-hidden shadow-inner p-0.5">
                    <div
                      className="h-full rounded-full flex items-center justify-center font-mono text-xs md:text-sm font-bold text-slate-900 transition-all"
                      style={{
                        width: `${Math.min(100, Math.max(8, o.score * 10))}%`,
                        backgroundColor: o.grade[1],
                      }}
                    >
                      {o.score.toFixed(2)}
                    </div>
                  </div>
                </td>
                <td className="p-2 border-b border-l border-[#d5dfdb] dark:border-[#213e3f]">
                  <span
                    className="px-2.5 py-0.5 rounded-full text-xs md:text-sm font-bold text-slate-900 shadow-2xs"
                    style={{ backgroundColor: o.grade[1] }}
                  >
                    {o.grade[0]}
                  </span>
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
