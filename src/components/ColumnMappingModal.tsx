import React, { useState } from 'react';
import { Settings, Check, X, Layers, Table } from 'lucide-react';
import { ColumnIndexMap } from '../types';
import { esc } from '../utils/engine';

interface ColumnMappingModalProps {
  isOpen: boolean;
  rows: (string | number | Date | null | undefined)[][];
  headerRow: number;
  initialIx: ColumnIndexMap;
  sheetNames?: string[];
  activeSheetName?: string;
  onSelectSheet?: (name: string) => void;
  onApply: (config: { headerRow: number; ix: ColumnIndexMap }) => void;
  onClose: () => void;
  customMessage?: string;
}

export const ColumnMappingModal: React.FC<ColumnMappingModalProps> = ({
  isOpen,
  rows,
  headerRow: initialHeaderRow,
  initialIx,
  sheetNames = [],
  activeSheetName = '',
  onSelectSheet,
  onApply,
  onClose,
  customMessage,
}) => {
  const [headerRow, setHeaderRow] = useState<number>(initialHeaderRow);
  const [ix, setIx] = useState<ColumnIndexMap>(initialIx);

  if (!isOpen || !rows || !rows.length) return null;

  const headers = (rows[headerRow] || []).map((h, i) =>
    String(h || `عمود ${i + 1}`).trim()
  );
  const previewRows = rows.slice(headerRow + 1, headerRow + 4);

  const getColSample = (colIdx: number): string => {
    if (colIdx == null || colIdx < 0 || isNaN(colIdx)) return '— غير محدد —';
    const sampleVals = rows
      .slice(headerRow + 1, headerRow + 6)
      .map(r => String(r[colIdx] ?? '').trim())
      .filter(Boolean);
    return sampleVals.length ? sampleVals.slice(0, 3).join(' ، ') : 'لا توجد بيانات';
  };

  const handleApply = () => {
    if (ix.id < 0 || ix.name < 0 || ix.date < 0 || ix.in < 0) {
      alert('يرجى تحديد الأعمدة الإلزامية المؤشر عليها بنجمة (*) للمتابعة.');
      return;
    }
    onApply({ headerRow, ix });
  };

  const handleHeaderRowChange = (newHeader: number) => {
    setHeaderRow(newHeader);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs transition-opacity"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 bg-white dark:bg-[#102627] text-[#141c19] dark:text-[#e6f1ee] rounded-2xl shadow-2xl border-2 border-[#d5dfdb] dark:border-[#386062] transition-transform animate-in fade-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
        role="dialog"
      >
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#d5dfdb] dark:border-[#213e3f]">
          <h3 className="flex items-center gap-2 text-xl font-bold font-reem text-[#0f3d3e] dark:text-[#f2b933]">
            <Settings className="w-6 h-6 text-[#1f8a6a]" />
            مساعد مطابقة الأعمدة الذكي
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {customMessage && (
          <div className="p-3 mb-4 text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl">
            {customMessage}
          </div>
        )}

        <p className="mb-4 text-xs text-[#435b54] dark:text-[#9bb5b0] leading-relaxed">
          قم بمراجعة أو تخصيص الأعمدة التي تم التعرف عليها من ملف البصمة لضمان معالجة دقيقة وسلسة:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          {sheetNames.length > 1 && onSelectSheet && (
            <div className="p-3 bg-[#eef2ef] dark:bg-[#091718] border border-[#d5dfdb] dark:border-[#213e3f] rounded-xl">
              <label className="flex items-center gap-1.5 mb-1.5 text-xs font-bold text-[#0f3d3e] dark:text-[#eaf3f0]">
                <Layers className="w-4 h-4 text-[#1f8a6a]" />
                ورقة العمل في ملف الإكسل:
              </label>
              <select
                value={activeSheetName}
                onChange={e => onSelectSheet(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-[#102627] text-[#141c19] dark:text-[#e6f1ee] border border-[#9fb3ad] dark:border-[#386062] rounded-lg focus:outline-hidden focus:border-[#1f8a6a]"
              >
                {sheetNames.map(s => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="p-3 bg-[#eef2ef] dark:bg-[#091718] border border-[#d5dfdb] dark:border-[#213e3f] rounded-xl">
            <label className="flex items-center gap-1.5 mb-1.5 text-xs font-bold text-[#0f3d3e] dark:text-[#eaf3f0]">
              <Table className="w-4 h-4 text-[#1f8a6a]" />
              صف الترويسة (عناوين الأعمدة):
            </label>
            <select
              value={headerRow}
              onChange={e => handleHeaderRowChange(+e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-[#102627] text-[#141c19] dark:text-[#e6f1ee] border border-[#9fb3ad] dark:border-[#386062] rounded-lg focus:outline-hidden focus:border-[#1f8a6a]"
            >
              {[0, 1, 2, 3, 4, 5, 6, 7, 8]
                .filter(r => r < rows.length)
                .map(r => (
                  <option key={r} value={r}>
                    الصف رقم {r + 1}: {(rows[r] || []).slice(0, 4).join(' | ')}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-5">
          {/* ID */}
          <div className="p-3 bg-white dark:bg-[#091718] border border-[#d5dfdb] dark:border-[#213e3f] rounded-xl">
            <label className="block mb-1 text-xs font-bold">
              الرقم الوزاري / الوظيفي <span className="text-rose-500">*</span>
            </label>
            <select
              value={ix.id}
              onChange={e => setIx(prev => ({ ...prev, id: +e.target.value }))}
              className="w-full px-2.5 py-1.5 text-xs bg-[#eef2ef] dark:bg-[#102627] border border-[#9fb3ad] dark:border-[#386062] rounded-lg"
            >
              <option value="-1">-- اختر العمود --</option>
              {headers.map((h, i) => (
                <option key={i} value={i}>
                  {h} (عمود {i + 1})
                </option>
              ))}
            </select>
            <div className="mt-1.5 text-[11px] text-[#435b54] dark:text-[#9bb5b0] truncate">
              معاينة: <span className="font-semibold text-[#141c19] dark:text-[#e6f1ee]">{getColSample(ix.id)}</span>
            </div>
          </div>

          {/* Name */}
          <div className="p-3 bg-white dark:bg-[#091718] border border-[#d5dfdb] dark:border-[#213e3f] rounded-xl">
            <label className="block mb-1 text-xs font-bold">
              اسم المعلم / الموظف <span className="text-rose-500">*</span>
            </label>
            <select
              value={ix.name}
              onChange={e => setIx(prev => ({ ...prev, name: +e.target.value }))}
              className="w-full px-2.5 py-1.5 text-xs bg-[#eef2ef] dark:bg-[#102627] border border-[#9fb3ad] dark:border-[#386062] rounded-lg"
            >
              <option value="-1">-- اختر العمود --</option>
              {headers.map((h, i) => (
                <option key={i} value={i}>
                  {h} (عمود {i + 1})
                </option>
              ))}
            </select>
            <div className="mt-1.5 text-[11px] text-[#435b54] dark:text-[#9bb5b0] truncate">
              معاينة: <span className="font-semibold text-[#141c19] dark:text-[#e6f1ee]">{getColSample(ix.name)}</span>
            </div>
          </div>

          {/* Date */}
          <div className="p-3 bg-white dark:bg-[#091718] border border-[#d5dfdb] dark:border-[#213e3f] rounded-xl">
            <label className="block mb-1 text-xs font-bold">
              التاريخ أو الوقت والتاريخ <span className="text-rose-500">*</span>
            </label>
            <select
              value={ix.date >= 0 ? ix.date : ix.datetime ?? -1}
              onChange={e => setIx(prev => ({ ...prev, date: +e.target.value }))}
              className="w-full px-2.5 py-1.5 text-xs bg-[#eef2ef] dark:bg-[#102627] border border-[#9fb3ad] dark:border-[#386062] rounded-lg"
            >
              <option value="-1">-- اختر العمود --</option>
              {headers.map((h, i) => (
                <option key={i} value={i}>
                  {h} (عمود {i + 1})
                </option>
              ))}
            </select>
            <div className="mt-1.5 text-[11px] text-[#435b54] dark:text-[#9bb5b0] truncate">
              معاينة:{' '}
              <span className="font-semibold text-[#141c19] dark:text-[#e6f1ee]">
                {getColSample(ix.date >= 0 ? ix.date : ix.datetime ?? -1)}
              </span>
            </div>
          </div>

          {/* In */}
          <div className="p-3 bg-white dark:bg-[#091718] border border-[#d5dfdb] dark:border-[#213e3f] rounded-xl">
            <label className="block mb-1 text-xs font-bold">
              وقت أول دخول (أو وقت البصمة) <span className="text-rose-500">*</span>
            </label>
            <select
              value={ix.in >= 0 ? ix.in : ix.datetime ?? -1}
              onChange={e => setIx(prev => ({ ...prev, in: +e.target.value }))}
              className="w-full px-2.5 py-1.5 text-xs bg-[#eef2ef] dark:bg-[#102627] border border-[#9fb3ad] dark:border-[#386062] rounded-lg"
            >
              <option value="-1">-- اختر العمود --</option>
              {headers.map((h, i) => (
                <option key={i} value={i}>
                  {h} (عمود {i + 1})
                </option>
              ))}
            </select>
            <div className="mt-1.5 text-[11px] text-[#435b54] dark:text-[#9bb5b0] truncate">
              معاينة:{' '}
              <span className="font-semibold text-[#141c19] dark:text-[#e6f1ee]">
                {getColSample(ix.in >= 0 ? ix.in : ix.datetime ?? -1)}
              </span>
            </div>
          </div>

          {/* Out */}
          <div className="p-3 bg-white dark:bg-[#091718] border border-[#d5dfdb] dark:border-[#213e3f] rounded-xl">
            <label className="block mb-1 text-xs font-bold text-slate-700 dark:text-slate-300">
              وقت آخر خروج (اختياري)
            </label>
            <select
              value={ix.out}
              onChange={e => setIx(prev => ({ ...prev, out: +e.target.value }))}
              className="w-full px-2.5 py-1.5 text-xs bg-[#eef2ef] dark:bg-[#102627] border border-[#9fb3ad] dark:border-[#386062] rounded-lg"
            >
              <option value="-1">-- غير محدد --</option>
              {headers.map((h, i) => (
                <option key={i} value={i}>
                  {h} (عمود {i + 1})
                </option>
              ))}
            </select>
            <div className="mt-1.5 text-[11px] text-[#435b54] dark:text-[#9bb5b0] truncate">
              معاينة: <span className="font-semibold text-[#141c19] dark:text-[#e6f1ee]">{getColSample(ix.out)}</span>
            </div>
          </div>

          {/* School */}
          <div className="p-3 bg-white dark:bg-[#091718] border border-[#d5dfdb] dark:border-[#213e3f] rounded-xl">
            <label className="block mb-1 text-xs font-bold text-slate-700 dark:text-slate-300">
              المدرسة أو القسم (اختياري)
            </label>
            <select
              value={ix.school}
              onChange={e => setIx(prev => ({ ...prev, school: +e.target.value }))}
              className="w-full px-2.5 py-1.5 text-xs bg-[#eef2ef] dark:bg-[#102627] border border-[#9fb3ad] dark:border-[#386062] rounded-lg"
            >
              <option value="-1">-- غير محدد --</option>
              {headers.map((h, i) => (
                <option key={i} value={i}>
                  {h} (عمود {i + 1})
                </option>
              ))}
            </select>
            <div className="mt-1.5 text-[11px] text-[#435b54] dark:text-[#9bb5b0] truncate">
              معاينة: <span className="font-semibold text-[#141c19] dark:text-[#e6f1ee]">{getColSample(ix.school)}</span>
            </div>
          </div>
        </div>

        {/* Data Preview */}
        <div className="mb-5">
          <div className="mb-2 text-xs font-bold text-[#0f3d3e] dark:text-[#f2b933]">
            معاينة أول 3 صفوف من الملف:
          </div>
          <div className="overflow-x-auto border border-[#d5dfdb] dark:border-[#213e3f] rounded-xl max-h-36 custom-scroll">
            <table className="w-full text-xs text-right border-collapse">
              <thead>
                <tr className="bg-[#d3e7e0] dark:bg-[#082829] text-[#0e3334] dark:text-[#eaf3f0] sticky top-0 font-bold">
                  {headers.map((h, i) => (
                    <th key={i} className="p-2 border border-[#9fb3ad] dark:border-[#386062] whitespace-nowrap">
                      {h} <span className="text-[10px] opacity-60">(عمود {i + 1})</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((r, ri) => (
                  <tr key={ri} className="odd:bg-white even:bg-slate-50 dark:odd:bg-[#102627] dark:even:bg-[#091718]">
                    {headers.map((_, ci) => (
                      <td key={ci} className="p-2 border border-[#d5dfdb] dark:border-[#213e3f] whitespace-nowrap">
                        {String(r[ci] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#d5dfdb] dark:border-[#213e3f]">
          <button
            type="button"
            onClick={handleApply}
            className="flex items-center gap-1.5 px-5 py-2 text-sm font-bold text-white rounded-xl bg-[#1f8a6a] hover:bg-[#165354] shadow-sm transition-all active:scale-95"
          >
            <Check className="w-4 h-4" />
            اعتماد ومتابعة الاستيراد
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
};
